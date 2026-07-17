const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const carWashRoutes = require("./routes/carwashes");
const bookingRoutes = require("./routes/bookings");
const offerRoutes = require("./routes/offers");
const vehicleRoutes = require("./routes/vehicles");
const paymentMethodRoutes = require("./routes/paymentMethods");
const pointsRoutes = require("./routes/points");
const reviewRoutes = require("./routes/reviews");
const sellerRoutes = require("./routes/sellers");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Car Wash Finder API is running.");
});

app.use("/api/auth", authRoutes);
app.use("/api/carwashes", carWashRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/points", pointsRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/seller", sellerRoutes);

// Fallback error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Car Wash Finder API running on http://localhost:${PORT}`);
});
