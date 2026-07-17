const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const VEHICLE_SURCHARGE = {
  sedan: 0,
  suv: 5,
  truck: 8,
  van: 10
};

const TAX_RATE = 0.1;

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
      specialRequests,
      address
    } = req.body;

    if (!carWashId || !washType || !date || !time) {
      return res.status(400).json({ error: "Missing required booking fields." });
    }
    if (!["exterior", "full"].includes(washType)) {
      return res.status(400).json({ error: "washType must be 'exterior' or 'full'." });
    }

    await client.query("BEGIN");

    const washResult = await client.query("SELECT * FROM car_washes WHERE id = $1 FOR UPDATE", [carWashId]);
    const wash = washResult.rows[0];
    if (!wash) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Car wash not found." });
    }

    if (wash.service_type !== "location" && (!address || !address.trim())) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Please provide an address for this mobile service." });
    }

    // Check slot capacity
    const bookedResult = await client.query(
      `SELECT COUNT(*) FROM bookings
       WHERE car_wash_id = $1 AND booking_date = $2 AND booking_time = $3 AND status != 'cancelled'`,
      [carWashId, date, time]
    );
    const bookedCount = parseInt(bookedResult.rows[0].count, 10);
    if (bookedCount >= wash.concurrent_slots) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "That time slot just filled up. Please pick another." });
    }

    // Resolve vehicle type (for surcharge)
    let resolvedVehicleType = vehicleType || "sedan";
    if (vehicleId) {
      const vResult = await client.query(
        "SELECT * FROM vehicles WHERE id = $1 AND user_id = $2",
        [vehicleId, req.user.id]
      );
      if (vResult.rows[0]) resolvedVehicleType = vResult.rows[0].vehicle_type;
    }

    if (wash.service_type === "moto-mobile" && !["sedan", "suv"].includes(resolvedVehicleType)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "This motorcycle-delivered wash can only service sedans and SUVs — try a home-service (van) or a fixed location for larger vehicles." });
    }

    const vehicleSurcharge = VEHICLE_SURCHARGE[resolvedVehicleType] ?? 0;

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

    const basePrice =
      parseFloat(wash.exterior_price) +
      (washType === "full" ? parseFloat(wash.full_wash_addon) : 0) +
      vehicleSurcharge;

    const subtotal = basePrice + addonsPrice;
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    const bookingRef = generateBookingRef();

    const insertResult = await client.query(
      `INSERT INTO bookings
        (booking_ref, user_id, car_wash_id, vehicle_id, wash_type, addons, booking_date, booking_time,
         base_price, addons_price, tax, total_price, payment_method_id, address, special_requests, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'confirmed')
       RETURNING *`,
      [
        bookingRef, req.user.id, carWashId, vehicleId || null, washType, JSON.stringify(addons),
        date, time, basePrice, addonsPrice, tax, total, paymentMethodId || null,
        (address && address.trim()) || null, specialRequests || null
      ]
    );

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

// PATCH /api/bookings/:id/cancel
router.patch("/:id/cancel", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE bookings SET status = 'cancelled'
       WHERE id = $1 AND user_id = $2 AND status != 'cancelled'
       RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found or already cancelled." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not cancel booking." });
  }
});

module.exports = router;
