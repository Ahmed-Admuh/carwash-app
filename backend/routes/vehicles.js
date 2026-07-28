const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Saudi private plates: 1-3 letters + 1-4 digits (digits are always Western/
// English numerals — the plate widget on the frontend converts any Eastern
// Arabic digits before submitting). Letters must come from the official
// 17-letter set used on real Saudi plates — A B J D R S X T E G K L Z N H
// U V (Latin) — entered either in English or in their exact Arabic
// counterpart (the frontend keeps both sides in sync automatically).
const PLATE_RE = /^[ABJDRSXTEGKLZNHUVabjdrsxtegklznhuv\u0623\u0627\u0628\u062D\u062F\u0631\u0633\u0635\u0637\u0639\u0642\u0643\u0644\u0645\u0646\u0647\u0648\u0649\u064A]{1,3}\s\d{1,4}$/;

// GET /api/vehicles
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM vehicles WHERE user_id = $1 ORDER BY is_default DESC, id ASC",
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
    const { model, plate, vehicleType } = req.body;
    if (!vehicleType) return res.status(400).json({ error: "Please choose a vehicle type." });
    if (!plate || !PLATE_RE.test(plate.trim())) {
      return res.status(400).json({ error: "Please enter a valid plate — 1-3 letters, a space, then 1-4 digits (e.g. ABC 1234)." });
    }

    // The very first vehicle someone adds automatically becomes their
    // default — used to pre-select their vehicle when booking, so most
    // customers never have to think about this at all.
    const existing = await pool.query("SELECT id FROM vehicles WHERE user_id = $1 LIMIT 1", [req.user.id]);
    const isDefault = existing.rows.length === 0;

    const result = await pool.query(
      `INSERT INTO vehicles (user_id, model, plate, vehicle_type, is_default)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, model || null, plate.trim().toUpperCase(), vehicleType, isDefault]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not add vehicle." });
  }
});

// PATCH /api/vehicles/:id/default — make this the pre-selected vehicle for booking
router.patch("/:id/default", requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ownedCheck = await client.query(
      "SELECT id FROM vehicles WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    if (ownedCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Vehicle not found." });
    }
    await client.query("UPDATE vehicles SET is_default = FALSE WHERE user_id = $1", [req.user.id]);
    const result = await client.query(
      "UPDATE vehicles SET is_default = TRUE WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    await client.query("COMMIT");
    res.json(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Could not update default vehicle." });
  } finally {
    client.release();
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

    if (result.rows[0].is_default) {
      await pool.query(
        `UPDATE vehicles SET is_default = TRUE WHERE id = (
           SELECT id FROM vehicles WHERE user_id = $1 ORDER BY id ASC LIMIT 1
         )`,
        [req.user.id]
      );
    }

    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not delete vehicle." });
  }
});

module.exports = router;
