const express = require("express");
const pool = require("../db");
const { requireAuth, requireSeller } = require("../middleware/auth");
const { isOpenNow, isValidOperatingHours } = require("../utils/hoursUtil");

const router = express.Router();

router.use(requireAuth, requireSeller);

const VALID_SERVICE_TYPES = ["location", "home-service", "moto-mobile"];

// ---------------------------------------------------------------
// Washes: list / create / update
// ---------------------------------------------------------------

// GET /api/seller/washes — the car washes this seller owns
router.get("/washes", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM car_washes WHERE owner_id = $1 ORDER BY id ASC",
      [req.user.id]
    );
    const washes = result.rows.map(w => ({ ...w, is_open_now: isOpenNow(w.operating_hours) }));
    res.json(washes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load your washes." });
  }
});

// POST /api/seller/washes — add another wash place (van, moto-mobile, or a
// second/third fixed location) to this seller's account.
// body: { name, serviceType, location, address, exteriorPrice, fullWashAddon,
//         pointsRate, autoAccept, concurrentSlots, slotIntervalMinutes,
//         serviceRadiusKm, operatingHours, description, imageUrl,
//         extras: [{ name, price, appliesTo }] }
router.post("/washes", async (req, res) => {
  try {
    const {
      name, serviceType, location, address, exteriorPrice, fullWashAddon,
      pointsRate, autoAccept, concurrentSlots, slotIntervalMinutes,
      serviceRadiusKm, operatingHours, description, imageUrl, extras
    } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ error: "Please name your wash place." });
    if (!VALID_SERVICE_TYPES.includes(serviceType)) return res.status(400).json({ error: "Please choose a valid service type." });
    if (exteriorPrice == null || isNaN(exteriorPrice) || exteriorPrice < 0) {
      return res.status(400).json({ error: "Please enter a valid exterior wash price." });
    }
    if (fullWashAddon != null && (isNaN(fullWashAddon) || fullWashAddon < 0)) {
      return res.status(400).json({ error: "Please enter a valid price for the Exterior + Interior upgrade." });
    }
    if (operatingHours && !isValidOperatingHours(operatingHours)) {
      return res.status(400).json({ error: "Operating hours are in an unexpected format." });
    }

    const isMobile = serviceType !== "location";

    const result = await pool.query(
      `INSERT INTO car_washes
        (owner_id, name, service_type, location, address, exterior_price, full_wash_addon,
         points_rate, auto_accept, concurrent_slots, slot_interval_minutes, service_radius_km,
         operating_hours, description, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        req.user.id, name.trim(), serviceType,
        location ? location.trim() : (isMobile ? "Comes to your home" : null),
        address || null, exteriorPrice, fullWashAddon || 0,
        pointsRate || 1.0, autoAccept !== false, concurrentSlots || (isMobile ? 1 : 2),
        slotIntervalMinutes || (isMobile ? 45 : 15), isMobile ? (serviceRadiusKm || 15) : null,
        JSON.stringify(operatingHours || { is24_7: true, schedule: {} }),
        description || null, imageUrl || null
      ]
    );
    const wash = result.rows[0];

    if (Array.isArray(extras)) {
      for (const extra of extras) {
        if (!extra.name || extra.price == null) continue;
        await pool.query(
          "INSERT INTO addon_services (car_wash_id, name, price, applies_to) VALUES ($1,$2,$3,$4)",
          [wash.id, extra.name, extra.price, extra.appliesTo || "both"]
        );
      }
    }

    res.status(201).json(wash);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not add wash place." });
  }
});

// PATCH /api/seller/washes/:id — update any subset of the same fields
router.patch("/washes/:id", async (req, res) => {
  try {
    const ownedCheck = await pool.query(
      "SELECT * FROM car_washes WHERE id = $1 AND owner_id = $2",
      [req.params.id, req.user.id]
    );
    if (ownedCheck.rows.length === 0) return res.status(404).json({ error: "Wash place not found." });

    const current = ownedCheck.rows[0];
    const {
      name, location, address, exteriorPrice, fullWashAddon, pointsRate,
      autoAccept, concurrentSlots, slotIntervalMinutes, serviceRadiusKm,
      operatingHours, description, imageUrl, galleryImages
    } = req.body;

    if (operatingHours && !isValidOperatingHours(operatingHours)) {
      return res.status(400).json({ error: "Operating hours are in an unexpected format." });
    }

    const result = await pool.query(
      `UPDATE car_washes SET
         name = $1, location = $2, address = $3, exterior_price = $4, full_wash_addon = $5,
         points_rate = $6, auto_accept = $7, concurrent_slots = $8, slot_interval_minutes = $9,
         service_radius_km = $10, operating_hours = $11, description = $12, image_url = $13,
         gallery_images = $14
       WHERE id = $15 RETURNING *`,
      [
        name ?? current.name, location ?? current.location, address ?? current.address,
        exteriorPrice ?? current.exterior_price, fullWashAddon ?? current.full_wash_addon,
        pointsRate ?? current.points_rate, autoAccept ?? current.auto_accept,
        concurrentSlots ?? current.concurrent_slots, slotIntervalMinutes ?? current.slot_interval_minutes,
        serviceRadiusKm ?? current.service_radius_km,
        JSON.stringify(operatingHours || current.operating_hours),
        description ?? current.description, imageUrl ?? current.image_url,
        JSON.stringify(galleryImages || current.gallery_images),
        req.params.id
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update wash place." });
  }
});

// GET/POST/DELETE addon services for one of this seller's washes
router.get("/washes/:id/addons", async (req, res) => {
  try {
    const ownedCheck = await pool.query("SELECT id FROM car_washes WHERE id = $1 AND owner_id = $2", [req.params.id, req.user.id]);
    if (ownedCheck.rows.length === 0) return res.status(404).json({ error: "Wash place not found." });
    const result = await pool.query("SELECT * FROM addon_services WHERE car_wash_id = $1 ORDER BY price ASC", [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load extras." });
  }
});

router.post("/washes/:id/addons", async (req, res) => {
  try {
    const { name, price, appliesTo } = req.body;
    if (!name || price == null) return res.status(400).json({ error: "An extra needs a name and a price." });
    const ownedCheck = await pool.query("SELECT id FROM car_washes WHERE id = $1 AND owner_id = $2", [req.params.id, req.user.id]);
    if (ownedCheck.rows.length === 0) return res.status(404).json({ error: "Wash place not found." });
    const result = await pool.query(
      "INSERT INTO addon_services (car_wash_id, name, price, applies_to) VALUES ($1,$2,$3,$4) RETURNING *",
      [req.params.id, name, price, appliesTo || "both"]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not add extra." });
  }
});

router.delete("/washes/:washId/addons/:addonId", async (req, res) => {
  try {
    const ownedCheck = await pool.query("SELECT id FROM car_washes WHERE id = $1 AND owner_id = $2", [req.params.washId, req.user.id]);
    if (ownedCheck.rows.length === 0) return res.status(404).json({ error: "Wash place not found." });
    await pool.query("DELETE FROM addon_services WHERE id = $1 AND car_wash_id = $2", [req.params.addonId, req.params.washId]);
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not remove extra." });
  }
});

// ---------------------------------------------------------------
// Bookings: list / accept / complete / cancel
// ---------------------------------------------------------------

// GET /api/seller/bookings?status=pending&date=YYYY-MM-DD
router.get("/bookings", async (req, res) => {
  try {
    const { status, date } = req.query;
    const params = [req.user.id];
    let query = `
      SELECT b.*, c.name AS car_wash_name, c.service_type, u.name AS customer_name, u.email AS customer_email,
             v.nickname AS vehicle_nickname, v.vehicle_type
      FROM bookings b
      JOIN car_washes c ON c.id = b.car_wash_id
      JOIN users u ON u.id = b.user_id
      LEFT JOIN vehicles v ON v.id = b.vehicle_id
      WHERE c.owner_id = $1`;

    if (status) {
      params.push(status);
      query += ` AND b.status = $${params.length}`;
    }
    if (date) {
      params.push(date);
      query += ` AND b.booking_date = $${params.length}`;
    }
    query += " ORDER BY b.booking_date DESC, b.booking_time DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load bookings." });
  }
});

// PATCH /api/seller/bookings/:id/accept — pending → confirmed
router.patch("/bookings/:id/accept", async (req, res) => {
  try {
    const bookingResult = await pool.query(
      `SELECT b.*, c.owner_id FROM bookings b JOIN car_washes c ON c.id = b.car_wash_id WHERE b.id = $1`,
      [req.params.id]
    );
    const booking = bookingResult.rows[0];
    if (!booking || booking.owner_id !== req.user.id) return res.status(404).json({ error: "Booking not found." });
    if (booking.status !== "pending") return res.status(400).json({ error: "Only pending bookings can be accepted." });

    const result = await pool.query(
      "UPDATE bookings SET status = 'confirmed' WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not accept booking." });
  }
});

// PATCH /api/seller/bookings/:id/status  { status: 'completed'|'cancelled', reason? }
router.patch("/bookings/:id/status", async (req, res) => {
  const client = await pool.connect();
  try {
    const { status, reason } = req.body;
    if (!["completed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Not a valid status." });
    }

    await client.query("BEGIN");
    const ownedResult = await client.query(
      `SELECT b.*, c.name AS wash_name, c.owner_id, c.points_rate
       FROM bookings b JOIN car_washes c ON c.id = b.car_wash_id
       WHERE b.id = $1 FOR UPDATE`,
      [req.params.id]
    );
    const booking = ownedResult.rows[0];
    if (!booking || booking.owner_id !== req.user.id) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Booking not found." });
    }
    if (["completed", "cancelled"].includes(booking.status)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: `This booking is already ${booking.status}.` });
    }

    if (status === "completed") {
      let pointsToAward = 0;
      let newPaymentStatus = booking.payment_status;

      // Cash bookings are settled (and points earned) at completion time,
      // since that's when the money actually changes hands.
      if (booking.payment_status === "unpaid") {
        pointsToAward = Math.round(parseFloat(booking.total_price) * parseFloat(booking.points_rate));
        newPaymentStatus = "paid";
      }

      await client.query(
        "UPDATE bookings SET status = 'completed', payment_status = $1, points_earned = points_earned + $2 WHERE id = $3",
        [newPaymentStatus, pointsToAward, booking.id]
      );

      if (pointsToAward > 0) {
        await client.query("UPDATE users SET points_balance = points_balance + $1 WHERE id = $2", [pointsToAward, booking.user_id]);
        await client.query(
          "INSERT INTO point_transactions (user_id, booking_id, points, reason) VALUES ($1,$2,$3,$4)",
          [booking.user_id, booking.id, pointsToAward, `Wash completed at ${booking.wash_name}`]
        );
      }
    } else {
      // Seller-initiated cancellation — reverse any points already awarded.
      if (booking.payment_status === "paid" && booking.points_earned > 0) {
        await client.query(
          "UPDATE users SET points_balance = GREATEST(0, points_balance - $1) WHERE id = $2",
          [booking.points_earned, booking.user_id]
        );
        await client.query(
          "INSERT INTO point_transactions (user_id, booking_id, points, reason) VALUES ($1,$2,$3,$4)",
          [booking.user_id, booking.id, -booking.points_earned, "Points reversed — booking cancelled by wash place"]
        );
      }
      const newPaymentStatus = booking.payment_status === "paid" ? "refunded" : booking.payment_status;
      await client.query(
        `UPDATE bookings SET status = 'cancelled', cancelled_by = 'seller', cancellation_reason = $1, payment_status = $2
         WHERE id = $3`,
        [reason || null, newPaymentStatus, booking.id]
      );
    }

    const finalResult = await client.query("SELECT * FROM bookings WHERE id = $1", [booking.id]);
    await client.query("COMMIT");
    res.json(finalResult.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Could not update booking." });
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------
// Stats
// ---------------------------------------------------------------

// GET /api/seller/stats?date=YYYY-MM-DD — omit date for the standard 30-day overview
router.get("/stats", async (req, res) => {
  try {
    const { date } = req.query;

    if (date) {
      const result = await pool.query(
        `SELECT
           COUNT(*) AS total_bookings,
           COUNT(*) FILTER (WHERE b.status = 'pending') AS pending,
           COUNT(*) FILTER (WHERE b.status = 'confirmed') AS confirmed,
           COUNT(*) FILTER (WHERE b.status = 'completed') AS completed,
           COUNT(*) FILTER (WHERE b.status = 'cancelled') AS cancelled,
           COALESCE(SUM(b.total_price) FILTER (WHERE b.status = 'completed'), 0) AS revenue
         FROM bookings b
         JOIN car_washes c ON c.id = b.car_wash_id
         WHERE c.owner_id = $1 AND b.booking_date = $2`,
        [req.user.id, date]
      );
      return res.json({ date, ...result.rows[0] });
    }

    const result = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE b.booking_date = CURRENT_DATE) AS today_bookings,
         COUNT(*) FILTER (WHERE b.status = 'pending') AS pending,
         COALESCE(SUM(b.total_price) FILTER (WHERE b.status = 'completed' AND b.booking_date >= CURRENT_DATE - INTERVAL '30 days'), 0) AS revenue_30d,
         COUNT(*) FILTER (WHERE b.status = 'confirmed') AS upcoming,
         COUNT(*) FILTER (WHERE b.status = 'completed') AS completed,
         COUNT(*) FILTER (WHERE b.status = 'cancelled') AS cancelled
       FROM bookings b
       JOIN car_washes c ON c.id = b.car_wash_id
       WHERE c.owner_id = $1`,
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load stats." });
  }
});

module.exports = router;
