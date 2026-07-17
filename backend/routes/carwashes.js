const express = require("express");
const pool = require("../db");
const { isOpenNow } = require("../utils/hoursUtil");

const router = express.Router();

// GET /api/carwashes?type=location|home-service|moto-mobile&openNow=true
router.get("/", async (req, res) => {
  try {
    const { type, openNow } = req.query;
    let query = "SELECT * FROM car_washes";
    const params = [];

    if (type) {
      params.push(type);
      query += ` WHERE service_type = $${params.length}`;
    }
    query += " ORDER BY id ASC";

    const result = await pool.query(query, params);
    let washes = result.rows.map(w => ({ ...w, is_open_now: isOpenNow(w.operating_hours) }));

    if (openNow === "true") {
      washes = washes.filter(w => w.is_open_now);
    }

    res.json(washes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load car washes." });
  }
});

// GET /api/carwashes/:id — with its addon services
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const washResult = await pool.query("SELECT * FROM car_washes WHERE id = $1", [id]);
    const wash = washResult.rows[0];
    if (!wash) return res.status(404).json({ error: "Car wash not found." });

    const addonsResult = await pool.query(
      "SELECT * FROM addon_services WHERE car_wash_id = $1 ORDER BY price ASC",
      [id]
    );

    res.json({ ...wash, is_open_now: isOpenNow(wash.operating_hours), addons: addonsResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load car wash." });
  }
});

// GET /api/carwashes/:id/slots?date=YYYY-MM-DD
// Generates time slots at the car wash's interval, with live availability
// based on concurrent_slots capacity and existing bookings for that day.
router.get("/:id/slots", async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "A date is required." });

    const washResult = await pool.query("SELECT * FROM car_washes WHERE id = $1", [id]);
    const wash = washResult.rows[0];
    if (!wash) return res.status(404).json({ error: "Car wash not found." });

    const bookedResult = await pool.query(
      `SELECT booking_time, COUNT(*) as count
       FROM bookings
       WHERE car_wash_id = $1 AND booking_date = $2 AND status != 'cancelled'
       GROUP BY booking_time`,
      [id, date]
    );
    const bookedMap = {};
    bookedResult.rows.forEach(row => {
      bookedMap[row.booking_time] = parseInt(row.count, 10);
    });

    const interval = wash.slot_interval_minutes;
    const capacity = wash.concurrent_slots;
    const startHour = 8;
    const endHour = 20;

    const slots = [];
    for (let mins = startHour * 60; mins < endHour * 60; mins += interval) {
      const hh = String(Math.floor(mins / 60)).padStart(2, "0");
      const mm = String(mins % 60).padStart(2, "0");
      const time = `${hh}:${mm}`;
      const booked = bookedMap[time] || 0;
      slots.push({
        time,
        capacity,
        booked,
        available: booked < capacity
      });
    }

    res.json({ carWashId: parseInt(id, 10), date, interval, capacity, slots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load time slots." });
  }
});

module.exports = router;
