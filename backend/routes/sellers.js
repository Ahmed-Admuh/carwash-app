const express = require("express");
const pool = require("../db");
const { requireAuth, requireSeller } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireSeller);

// GET /api/seller/washes — the car washes this seller owns
router.get("/washes", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM car_washes WHERE owner_id = $1 ORDER BY id ASC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load your washes." });
  }
});

// GET /api/seller/bookings — bookings across all washes this seller owns
router.get("/bookings", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, c.name AS car_wash_name, c.service_type, u.name AS customer_name, u.email AS customer_email,
              v.nickname AS vehicle_nickname, v.vehicle_type
       FROM bookings b
       JOIN car_washes c ON c.id = b.car_wash_id
       JOIN users u ON u.id = b.user_id
       LEFT JOIN vehicles v ON v.id = b.vehicle_id
       WHERE c.owner_id = $1
       ORDER BY b.booking_date DESC, b.booking_time DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load bookings." });
  }
});

// PATCH /api/seller/bookings/:id/status  { status: 'completed'|'cancelled' }
router.patch("/bookings/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["confirmed", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Not a valid status." });
    }

    const ownedCheck = await pool.query(
      `SELECT b.id FROM bookings b JOIN car_washes c ON c.id = b.car_wash_id
       WHERE b.id = $1 AND c.owner_id = $2`,
      [req.params.id, req.user.id]
    );
    if (ownedCheck.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found." });
    }

    const bookingResult = await pool.query("SELECT * FROM bookings WHERE id = $1", [req.params.id]);
    const booking = bookingResult.rows[0];

    // Award loyalty points the moment a booking is marked completed (once only).
    if (status === "completed" && booking.status !== "completed") {
      const washResult = await pool.query(
        "SELECT name, points_per_visit FROM car_washes WHERE id = $1",
        [booking.car_wash_id]
      );
      const { name: washName, points_per_visit: points } = washResult.rows[0];

      await pool.query("UPDATE bookings SET points_earned = $1 WHERE id = $2", [points, booking.id]);
      await pool.query("UPDATE users SET points_balance = points_balance + $1 WHERE id = $2", [points, booking.user_id]);
      await pool.query(
        "INSERT INTO point_transactions (user_id, booking_id, points, reason) VALUES ($1,$2,$3,$4)",
        [booking.user_id, booking.id, points, `Wash completed at ${washName}`]
      );
    }

    const result = await pool.query(
      "UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *",
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update booking." });
  }
});

// GET /api/seller/stats
router.get("/stats", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE b.booking_date = CURRENT_DATE) AS today_bookings,
         COALESCE(SUM(b.total_price) FILTER (WHERE b.status = 'completed' AND b.booking_date >= CURRENT_DATE - INTERVAL '30 days'), 0) AS revenue_30d,
         COUNT(*) FILTER (WHERE b.status = 'confirmed') AS upcoming,
         COUNT(*) FILTER (WHERE b.status = 'completed') AS completed
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
