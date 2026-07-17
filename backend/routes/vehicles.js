const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/vehicles
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM vehicles WHERE user_id = $1 ORDER BY id ASC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load vehicles." });
  }
});

// POST /api/vehicles
router.post("/", requireAuth, async (req, res) => {
  try {
    const { nickname, make, model, plate, vehicleType } = req.body;
    if (!vehicleType) return res.status(400).json({ error: "vehicleType is required." });

    const result = await pool.query(
      `INSERT INTO vehicles (user_id, nickname, make, model, plate, vehicle_type)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id, nickname || null, make || null, model || null, plate || null, vehicleType]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not add vehicle." });
  }
});

// DELETE /api/vehicles/:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM vehicles WHERE id = $1 AND user_id = $2 RETURNING *",
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Vehicle not found." });
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not delete vehicle." });
  }
});

module.exports = router;
