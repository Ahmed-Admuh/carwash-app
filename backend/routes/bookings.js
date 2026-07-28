const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const VEHICLE_SURCHARGE = {
  small: 0,
  medium: 5,
  large: 8,
  xlarge: 10
};

const VALID_PAYMENT_TYPES = ["mada", "apple-pay", "samsung-pay", "google-pay"];
// Note: no separate tax calculation — in Saudi Arabia, prices sellers set
// are expected to already be VAT-inclusive, so nothing is added on top.
// The `tax` column stays in the schema (old bookings still have real
// values in it) but new bookings always write 0.

function generateBookingRef() {
  return "CW-" + Math.floor(100000 + Math.random() * 900000);
}

// POST /api/bookings
router.post("/", requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      carWashId,
      vehicleId,
      vehicleType, // used if vehicleId not provided (guest-style quick booking)
      washType, // 'exterior' | 'full'
      addonIds = [],
      date,
      time,
      paymentMethodId,
      paymentMethodType, // 'mada' | 'apple-pay' | 'samsung-pay' | 'google-pay'
      specialRequests,
      address,
      addressLat,
      addressLng
    } = req.body;

    if (!carWashId || !washType || !date || !time) {
      return res.status(400).json({ error: "Missing required booking fields." });
    }
    if (!["exterior", "interior", "full"].includes(washType)) {
      return res.status(400).json({ error: "washType must be 'exterior', 'interior', or 'full'." });
    }
    if (!paymentMethodType || !VALID_PAYMENT_TYPES.includes(paymentMethodType)) {
      return res.status(400).json({ error: "Please choose a payment method." });
    }
    if (!paymentMethodId) {
      return res.status(400).json({ error: "Please choose a saved payment method." });
    }

    await client.query("BEGIN");

    const washResult = await client.query("SELECT * FROM car_washes WHERE id = $1 FOR UPDATE", [carWashId]);
    const wash = washResult.rows[0];
    if (!wash) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Car wash not found." });
    }

    // Address resolution depends on the wash's service type:
    //  - 'location'      : customer drives there, no address needed at all.
    //  - 'home-service'  : a van comes to a fresh address picked for THIS
    //                      booking (with an optional GPS pin from the map).
    //  - 'moto-mobile'   : never asks for an address in the booking flow —
    //                      it always uses the customer's one saved profile
    //                      address, set once from the Profile page.
    let resolvedAddress = null;
    let resolvedAddressLat = null;
    let resolvedAddressLng = null;

    if (wash.service_type === "home-service") {
      if (!address || !address.trim()) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Please provide an address for this mobile service." });
      }
      resolvedAddress = address.trim();
      resolvedAddressLat = addressLat ?? null;
      resolvedAddressLng = addressLng ?? null;
    } else if (wash.service_type === "moto-mobile") {
      const userResult = await client.query("SELECT saved_address, saved_address_lat, saved_address_lng FROM users WHERE id = $1", [req.user.id]);
      const customer = userResult.rows[0];
      if (!customer || !customer.saved_address) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Please add your address in your Profile first — moto-mobile bookings always use your saved address." });
      }
      resolvedAddress = customer.saved_address;
      resolvedAddressLat = customer.saved_address_lat;
      resolvedAddressLng = customer.saved_address_lng;
    }

    // Check slot capacity
    const bookedResult = await client.query(
      `SELECT COUNT(*) FROM bookings
       WHERE car_wash_id = $1 AND booking_date = $2 AND booking_time = $3 AND status NOT IN ('cancelled')`,
      [carWashId, date, time]
    );
    const bookedCount = parseInt(bookedResult.rows[0].count, 10);
    if (bookedCount >= wash.concurrent_slots) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "That time slot just filled up. Please pick another." });
    }

    // Resolve vehicle type (for surcharge)
    let resolvedVehicleType = vehicleType || "small";
    if (vehicleId) {
      const vResult = await client.query(
        "SELECT * FROM vehicles WHERE id = $1 AND user_id = $2",
        [vehicleId, req.user.id]
      );
      if (vResult.rows[0]) resolvedVehicleType = vResult.rows[0].vehicle_type;
    }

    if (wash.service_type === "moto-mobile" && !["small", "medium"].includes(resolvedVehicleType)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "This motorcycle-delivered wash can only service small and medium vehicles — try a home-service (van) or a fixed location for larger vehicles." });
    }

    // Resolve addons (validated against DB, not trusted from client)
    let addons = [];
    let addonsPrice = 0;
    if (addonIds.length > 0) {
      const addonsResult = await client.query(
        `SELECT * FROM addon_services WHERE car_wash_id = $1 AND id = ANY($2::int[])`,
        [carWashId, addonIds]
      );
      addons = addonsResult.rows.map(a => ({ id: a.id, name: a.name, price: parseFloat(a.price) }));
      addonsPrice = addons.reduce((sum, a) => sum + a.price, 0);
    }

    // Prefer the seller's own per-vehicle-type pricing when they've set it;
    // otherwise fall back to the old exterior_price + flat surcharge model
    // (only relevant for washes that predate this feature).
    let basePrice;
    const vp = wash.vehicle_pricing && wash.vehicle_pricing[resolvedVehicleType];
    if (washType === "interior") {
      const interiorPrice = vp ? vp.interior : wash.interior_price;
      if (interiorPrice == null) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "This wash doesn't offer an interior-only option." });
      }
      basePrice = parseFloat(interiorPrice);
    } else if (vp) {
      basePrice = parseFloat(washType === "full" ? vp.full : vp.exterior);
    } else {
      const vehicleSurcharge = VEHICLE_SURCHARGE[resolvedVehicleType] ?? 0;
      basePrice = parseFloat(wash.exterior_price) + (washType === "full" ? parseFloat(wash.full_wash_addon) : 0) + vehicleSurcharge;
    }

    const subtotal = basePrice + addonsPrice;
    // Saudi prices are VAT-inclusive by law — sellers set the final price,
    // nothing is added on top. For the receipt, the 15% VAT portion is
    // reverse-calculated out of that inclusive total purely for
    // transparency (showing "price excl. VAT" + "VAT (15%)" that sum back
    // to the same total the customer already agreed to).
    const VAT_RATE = 0.15;
    const total = Math.round(subtotal * 100) / 100;
    const preTaxAmount = Math.round((total / (1 + VAT_RATE)) * 100) / 100;
    const tax = Math.round((total - preTaxAmount) * 100) / 100;

    // Every remaining payment method (Mada, Apple/Samsung/Google Pay) is
    // treated as paid immediately — there's no real payment gateway wired
    // up yet, so this simulates an instant successful charge.
    const paymentStatus = "paid";

    // Points are earned proportional to what's actually paid — pricier
    // washes (or washes with a higher points_rate) earn more.
    const pointsEarned = Math.round(total * parseFloat(wash.points_rate));

    // If the seller hasn't turned on auto-accept, new bookings need their
    // explicit sign-off before they're confirmed.
    const initialStatus = wash.auto_accept ? "confirmed" : "pending";

    const bookingRef = generateBookingRef();

    const insertResult = await client.query(
      `INSERT INTO bookings
        (booking_ref, user_id, car_wash_id, vehicle_id, wash_type, addons, booking_date, booking_time,
         base_price, addons_price, tax, total_price, payment_method_id, payment_method_type, payment_status,
         address, address_lat, address_lng, special_requests, points_earned, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       RETURNING *`,
      [
        bookingRef, req.user.id, carWashId, vehicleId || null, washType, JSON.stringify(addons),
        date, time, basePrice, addonsPrice, tax, total, paymentMethodId || null, paymentMethodType,
        paymentStatus, resolvedAddress, resolvedAddressLat, resolvedAddressLng, specialRequests || null, pointsEarned, initialStatus
      ]
    );

    if (pointsEarned > 0) {
      await client.query("UPDATE users SET points_balance = points_balance + $1 WHERE id = $2", [pointsEarned, req.user.id]);
      await client.query(
        "INSERT INTO point_transactions (user_id, booking_id, points, reason) VALUES ($1,$2,$3,$4)",
        [req.user.id, insertResult.rows[0].id, pointsEarned, `Paid booking at ${wash.name}`]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ ...insertResult.rows[0], carWashName: wash.name });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Could not create booking." });
  } finally {
    client.release();
  }
});

// GET /api/bookings — order history for logged-in user
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, c.name as car_wash_name, c.service_type, c.location
       FROM bookings b
       JOIN car_washes c ON c.id = b.car_wash_id
       WHERE b.user_id = $1
       ORDER BY b.booking_date DESC, b.booking_time DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load booking history." });
  }
});

// GET /api/bookings/:id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, c.name as car_wash_name, c.service_type, c.location
       FROM bookings b
       JOIN car_washes c ON c.id = b.car_wash_id
       WHERE b.id = $1 AND b.user_id = $2`,
      [req.params.id, req.user.id]
    );
    const booking = result.rows[0];
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load booking." });
  }
});

// PATCH /api/bookings/:id/cancel — customer-initiated cancellation
router.patch("/:id/cancel", requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const bookingResult = await client.query(
      `SELECT * FROM bookings WHERE id = $1 AND user_id = $2 AND status NOT IN ('cancelled', 'completed') FOR UPDATE`,
      [req.params.id, req.user.id]
    );
    const booking = bookingResult.rows[0];
    if (!booking) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Booking not found, already cancelled, or already completed." });
    }

    // If this booking was already paid (card/Apple Pay, or cash already
    // collected), the points it earned get taken back along with it.
    if (booking.payment_status === "paid" && booking.points_earned > 0) {
      await client.query(
        "UPDATE users SET points_balance = GREATEST(0, points_balance - $1) WHERE id = $2",
        [booking.points_earned, booking.user_id]
      );
      await client.query(
        "INSERT INTO point_transactions (user_id, booking_id, points, reason) VALUES ($1,$2,$3,$4)",
        [booking.user_id, booking.id, -booking.points_earned, "Points reversed — booking cancelled"]
      );
    }

    const newPaymentStatus = booking.payment_status === "paid" ? "refunded" : booking.payment_status;

    const result = await client.query(
      `UPDATE bookings SET status = 'cancelled', cancelled_by = 'customer', payment_status = $2
       WHERE id = $1 RETURNING *`,
      [req.params.id, newPaymentStatus]
    );

    await client.query("COMMIT");
    res.json(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Could not cancel booking." });
  } finally {
    client.release();
  }
});

module.exports = router;
