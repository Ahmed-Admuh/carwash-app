const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/payment-methods
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM payment_methods WHERE user_id = $1 ORDER BY is_default DESC, id ASC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load payment methods." });
  }
});

// POST /api/payment-methods
// type: 'visa' | 'mastercard' | 'amex' | 'discover' | 'apple-pay'
router.post("/", requireAuth, async (req, res) => {
  try {
    const { type, last4, label, isDefault } = req.body;
    const validTypes = ["visa", "mastercard", "amex", "discover", "apple-pay"];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({ error: "Please choose a valid payment method type." });
    }
    if (type !== "apple-pay" && (!last4 || !/^\d{4}$/.test(last4))) {
      return res.status(400).json({ error: "Please enter the last 4 digits of the card." });
    }

    if (type === "apple-pay") {
      const dupe = await pool.query(
        "SELECT id FROM payment_methods WHERE user_id = $1 AND type = 'apple-pay'",
        [req.user.id]
      );
      if (dupe.rows.length > 0) {
        return res.status(409).json({ error: "Apple Pay is already saved to your account." });
      }
    }

    if (isDefault) {
      await pool.query("UPDATE payment_methods SET is_default = FALSE WHERE user_id = $1", [req.user.id]);
    }

    const result = await pool.query(
      `INSERT INTO payment_methods (user_id, type, last4, label, is_default)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, type, type === "apple-pay" ? null : last4, label || null, !!isDefault]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") { // unique_violation — same type+last4 already saved
      return res.status(409).json({ error: "You've already saved this exact payment method." });
    }
    console.error(err);
    res.status(500).json({ error: "Could not add payment method." });
  }
});

// DELETE /api/payment-methods/:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM payment_methods WHERE id = $1 AND user_id = $2 RETURNING *",
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Payment method not found." });
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not delete payment method." });
  }
});

module.exports = router;
