const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { requireAuth, JWT_SECRET } = require("../middleware/auth");
const { isValidOperatingHours } = require("../utils/hoursUtil");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatarUrl: row.avatar_url,
    pointsBalance: row.points_balance,
    createdAt: row.created_at
  };
}

// POST /api/auth/signup
// body: { name, email, password, role: 'customer'|'seller', business? }
// business (only for role='seller'): {
//   name, serviceType, location, exteriorPrice, fullWashAddon, pointsRate,
//   autoAccept, concurrentSlots, slotIntervalMinutes, serviceRadiusKm,
//   operatingHours, extras: [{ name, price, appliesTo }]
// }
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role, business } = req.body;
    const accountRole = role === "seller" ? "seller" : "customer";

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Please enter your name." });
    }
    if (!email || !EMAIL_RE.test(email.trim())) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }
    if (accountRole === "seller") {
      if (!business || !business.name || !business.name.trim()) {
        return res.status(400).json({ error: "Please enter your wash business name." });
      }
      if (!["location", "home-service", "moto-mobile"].includes(business.serviceType)) {
        return res.status(400).json({ error: "Please choose a valid service type for your business." });
      }
      if (business.exteriorPrice == null || isNaN(business.exteriorPrice) || business.exteriorPrice < 0) {
        return res.status(400).json({ error: "Please enter a price for an exterior-only wash." });
      }
      if (business.operatingHours && !isValidOperatingHours(business.operatingHours)) {
        return res.status(400).json({ error: "Operating hours are in an unexpected format." });
      }
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email.trim().toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists. Try logging in instead." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name.trim(), email.trim().toLowerCase(), passwordHash, accountRole]
    );
    const user = result.rows[0];

    if (accountRole === "seller") {
      const isMobile = business.serviceType !== "location";
      const washResult = await pool.query(
        `INSERT INTO car_washes
          (owner_id, name, service_type, location, exterior_price, full_wash_addon, points_rate,
           auto_accept, concurrent_slots, slot_interval_minutes, service_radius_km, operating_hours, description,
           vehicle_pricing, require_cash_only)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         RETURNING id`,
        [
          user.id, business.name.trim(), business.serviceType,
          business.location ? business.location.trim() : (isMobile ? "Comes to your home" : null),
          business.exteriorPrice, business.fullWashAddon || 0, business.pointsRate || 1.0,
          business.autoAccept !== false,
          business.concurrentSlots || (isMobile ? 1 : 2),
          business.slotIntervalMinutes || (isMobile ? 45 : 15),
          isMobile ? (business.serviceRadiusKm || 15) : null,
          JSON.stringify(business.operatingHours || { is24_7: true, schedule: {} }),
          "New on Car Wash Finder — add photos and fine-tune details from your seller dashboard.",
          business.vehiclePricing ? JSON.stringify(business.vehiclePricing) : null,
          !!business.requireCashOnly
        ]
      );

      if (Array.isArray(business.extras)) {
        for (const extra of business.extras) {
          if (!extra.name || extra.price == null) continue;
          await pool.query(
            "INSERT INTO addon_services (car_wash_id, name, price, applies_to) VALUES ($1,$2,$3,$4)",
            [washResult.rows[0].id, extra.name, extra.price, extra.appliesTo || "both"]
          );
        }
      }
    }

    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong creating your account. Please try again." });
  }
});

// POST /api/auth/login
// body: { email, password, expectRole?: 'customer'|'seller' }
router.post("/login", async (req, res) => {
  try {
    const { email, password, expectRole } = req.body;
    if (!email || !EMAIL_RE.test(email.trim())) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    if (!password) {
      return res.status(400).json({ error: "Please enter your password." });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email.trim().toLowerCase()]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: "We couldn't find an account with that email." });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Incorrect password. Please try again." });
    }

    if (expectRole && user.role !== expectRole) {
      const friendly = user.role === "seller" ? "wash owner" : "customer";
      const wanted = expectRole === "seller" ? "wash owner" : "customer";
      return res.status(403).json({
        error: `This is a ${friendly} account. You're signing in on the ${wanted} login — try the ${friendly} login instead.`
      });
    }

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong logging you in. Please try again." });
  }
});

// GET /api/auth/me — profile + quick stats
router.get("/me", requireAuth, async (req, res) => {
  try {
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ error: "User not found." });

    const [bookingsCount, vehiclesCount, paymentsCount] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM bookings WHERE user_id = $1", [req.user.id]),
      pool.query("SELECT COUNT(*) FROM vehicles WHERE user_id = $1", [req.user.id]),
      pool.query("SELECT COUNT(*) FROM payment_methods WHERE user_id = $1", [req.user.id])
    ]);

    res.json({
      user: publicUser(user),
      stats: {
        bookings: parseInt(bookingsCount.rows[0].count, 10),
        vehicles: parseInt(vehiclesCount.rows[0].count, 10),
        payments: parseInt(paymentsCount.rows[0].count, 10)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load profile." });
  }
});

module.exports = router;
