const jwt = require("jsonwebtoken");

// No fallback secret here on purpose: a default that's sitting in public
// source code is not a secret at all. If JWT_SECRET isn't set, anyone who
// has read this file could forge a valid login token for any account — so
// the app refuses to start instead of silently signing tokens with a
// known value. Set a long, random JWT_SECRET as a real environment
// variable (Render dashboard → Environment), never in code.
if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is not set. Refusing to start — " +
    "set a long, random JWT_SECRET in your environment (e.g. Render's " +
    "Environment tab) before running the server."
  );
}
const JWT_SECRET = process.env.JWT_SECRET;

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated. Please log in." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, email: payload.email, name: payload.name, role: payload.role || "customer" };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }
}

// Use after requireAuth to restrict a route to seller (wash owner) accounts.
function requireSeller(req, res, next) {
  if (req.user.role !== "seller") {
    return res.status(403).json({ error: "This action is only available to wash owner accounts." });
  }
  next();
}

module.exports = { requireAuth, requireSeller, JWT_SECRET };
