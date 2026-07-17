const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Fixed reward tiers. Points never expire; redeeming deducts points and
// issues a one-time coupon code the customer can mention at checkout.
const TIERS = [
  { points: 500, label: "Free Basic Wash (Exterior Only)" },
  { points: 1000, label: "Free Full Detail (Exterior + Interior)" },
  { points: 1500, label: "$25 Off Any Mobile Service" },
  { points: 2500, label: "Free Premium Detail + Priority Booking for a Month" }
];

function genCode() {
  return `RW-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

// GET /api/points — balance, available tiers, and recent history
router.get("/", requireAuth, async (req, res) => {
  try {
    const userResult = await pool.query("SELECT points_balance FROM users WHERE id = $1", [req.user.id]);
    if (userResult.rows.length === 0) {
      // Token references a user that no longer exists — usually because the
      // database was reset/reseeded while this browser still had an old
      // session. Ask them to log in again rather than crashing.
      return res.status(401).json({ error: "Your session is out of date. Please log out and log back in." });
    }
    const balance = userResult.rows[0].points_balance;

    const [historyResult, redemptionsResult] = await Promise.all([
      pool.query(
        "SELECT * FROM point_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20",
        [req.user.id]
      ),
      pool.query(
        "SELECT * FROM reward_redemptions WHERE user_id = $1 ORDER BY redeemed_at DESC",
        [req.user.id]
      )
    ]);

    res.json({
      balance,
      tiers: TIERS.map(t => ({ ...t, unlocked: balance >= t.points })),
      history: historyResult.rows,
      redemptions: redemptionsResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load points." });
  }
});

// POST /api/points/redeem  { tierPoints: 500 }
router.post("/redeem", requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { tierPoints } = req.body;
    const tier = TIERS.find(t => t.points === tierPoints);
    if (!tier) return res.status(400).json({ error: "Not a valid reward tier." });

    await client.query("BEGIN");
    const userResult = await client.query("SELECT points_balance FROM users WHERE id = $1 FOR UPDATE", [req.user.id]);
    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(401).json({ error: "Your session is out of date. Please log out and log back in." });
    }
    const balance = userResult.rows[0].points_balance;

    if (balance < tier.points) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: `You need ${tier.points} points for this reward — you have ${balance}.` });
    }

    await client.query("UPDATE users SET points_balance = points_balance - $1 WHERE id = $2", [tier.points, req.user.id]);
    await client.query(
      "INSERT INTO point_transactions (user_id, points, reason) VALUES ($1, $2, $3)",
      [req.user.id, -tier.points, `Redeemed: ${tier.label}`]
    );

    const code = genCode();
    const redemption = await client.query(
      `INSERT INTO reward_redemptions (user_id, tier_points, reward_label, code)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user.id, tier.points, tier.label, code]
    );

    await client.query("COMMIT");
    res.status(201).json(redemption.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Could not redeem reward." });
  } finally {
    client.release();
  }
});

module.exports = router;
