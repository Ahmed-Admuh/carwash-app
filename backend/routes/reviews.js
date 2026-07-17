const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/reviews?carWashId=5 — public, used on the wash's About page
router.get("/", async (req, res) => {
  try {
    const { carWashId } = req.query;
    if (!carWashId) return res.status(400).json({ error: "carWashId is required." });

    const result = await pool.query(
      `SELECT r.*, u.name AS reviewer_name
       FROM reviews r JOIN users u ON u.id = r.user_id
       WHERE r.car_wash_id = $1
       ORDER BY r.created_at DESC`,
      [carWashId]
    );

    const avgResult = await pool.query(
      "SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*) AS total FROM reviews WHERE car_wash_id = $1",
      [carWashId]
    );

    res.json({
      reviews: result.rows,
      averageRating: parseFloat(avgResult.rows[0].avg_rating).toFixed(1),
      totalReviews: parseInt(avgResult.rows[0].total, 10)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load reviews." });
  }
});

// GET /api/reviews/booking/:bookingId — details needed to render the rating page
router.get("/booking/:bookingId", requireAuth, async (req, res) => {
  try {
    const bookingResult = await pool.query(
      `SELECT b.*, c.name AS car_wash_name, c.image_url
       FROM bookings b JOIN car_washes c ON c.id = b.car_wash_id
       WHERE b.id = $1 AND b.user_id = $2`,
      [req.params.bookingId, req.user.id]
    );
    const booking = bookingResult.rows[0];
    if (!booking) return res.status(404).json({ error: "Booking not found." });

    const existingReview = await pool.query(
      "SELECT * FROM reviews WHERE booking_id = $1",
      [req.params.bookingId]
    );

    res.json({ booking, existingReview: existingReview.rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load booking." });
  }
});

// POST /api/reviews  { bookingId, rating (1-5), comment }
router.post("/", requireAuth, async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;
    if (!bookingId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "A booking and a rating from 1 to 5 are required." });
    }

    const bookingResult = await pool.query(
      "SELECT * FROM bookings WHERE id = $1 AND user_id = $2",
      [bookingId, req.user.id]
    );
    const booking = bookingResult.rows[0];
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    if (booking.status !== "completed") {
      return res.status(400).json({ error: "You can only rate a wash after it's completed." });
    }

    const existing = await pool.query("SELECT id FROM reviews WHERE booking_id = $1", [bookingId]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "You've already rated this booking." });
    }

    const result = await pool.query(
      `INSERT INTO reviews (booking_id, user_id, car_wash_id, rating, comment)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [bookingId, req.user.id, booking.car_wash_id, rating, comment || null]
    );

    // Keep the wash's displayed rating/review_count roughly in sync.
    await pool.query(
      `UPDATE car_washes SET
         review_count = review_count + 1,
         rating = ROUND((
           SELECT AVG(rating) FROM reviews WHERE car_wash_id = $1
         )::numeric, 1)
       WHERE id = $1`,
      [booking.car_wash_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not submit review." });
  }
});

module.exports = router;
