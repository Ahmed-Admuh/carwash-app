const bcrypt = require("bcrypt");
const pool = require("./db");

function genCode(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function seed() {
  console.log("Seeding database...");
  console.log("(This wipes ALL existing data — including any accounts or bookings");
  console.log(" you created yourself while testing — and rebuilds from scratch.)");
  console.log("");

  // TRUNCATE ... CASCADE handles foreign-key dependency order automatically
  // and resets auto-increment IDs back to 1, so this is genuinely safe to
  // run over and over — unlike deleting table-by-table, which breaks the
  // moment any bookings/reviews/etc. exist and reference these rows.
  await pool.query(`
    TRUNCATE TABLE
      reward_redemptions, point_transactions, reviews, bookings,
      addon_services, payment_methods, vehicles, offers, car_washes, users
    RESTART IDENTITY CASCADE
  `);
  console.log("Cleared existing data.");

  // ============================================================
  // Demo accounts
  // ============================================================
  const demoPasswordHash = await bcrypt.hash("demo1234", 10);

  const customer = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, points_balance)
     VALUES ('Layla Hassan', 'demo.customer@carwash.app', $1, 'customer', 350)
     RETURNING id`,
    [demoPasswordHash]
  );
  const customerId = customer.rows[0].id;

  const admin = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, points_balance)
     VALUES ('Omar Al-Rashid', 'demo.admin@carwash.app', $1, 'seller', 0)
     RETURNING id`,
    [demoPasswordHash]
  );
  const adminId = admin.rows[0].id;
  console.log(`Created demo accounts (customer id=${customerId}, seller id=${adminId}).`);

  await pool.query(
    `INSERT INTO vehicles (user_id, nickname, make, model, plate, vehicle_type)
     VALUES ($1,'My Camry','Toyota','Camry','ABC-1234','sedan'),
            ($1,'Family SUV','Honda','CR-V','XYZ-5678','suv')`,
    [customerId]
  );

  await pool.query(
    `INSERT INTO payment_methods (user_id, type, last4, label, is_default)
     VALUES ($1,'visa','1234','Visa •••• 1234', true),
            ($1,'mastercard','5678','Mastercard •••• 5678', false),
            ($1,'apple-pay',NULL,'Apple Pay', false)`,
    [customerId]
  );
  console.log("Added sample vehicles and payment methods for the demo customer.");

  // ---------- Car washes: fixed locations ----------
  const locations = [
    // name, serviceType, location, address, distance, rating, reviewCount, waitTime, extPrice, fullAddon, capacity, interval, pointsPerVisit, imageUrl
    ["Sparkle Auto Wash", "location", "Downtown", "142 Main St", 2.8, 4.5, 142, 15, 15.00, 8.00, 2, 15, 15,
     "https://images.unsplash.com/photo-1750492960736-6ef3f76d6c95?fm=jpg&q=80&w=1200&auto=format&fit=crop"],
    ["SuperClean Express", "location", "Burnaby", "88 Kingsway Ave", 4.3, 4.2, 87, 5, 10.00, 6.00, 2, 15, 8,
     "https://images.unsplash.com/photo-1762933855598-273a51b47649?fm=jpg&q=80&w=1200&auto=format&fit=crop"],
    ["EcoWash", "location", "Richmond", "5 Garden City Rd", 3.1, 4.7, 203, 25, 18.00, 9.00, 2, 15, 20,
     "https://images.pexels.com/photos/5233285/pexels-photo-5233285.jpeg?auto=compress&cs=tinysrgb&w=1200"],
    ["FastShine", "location", "Surrey", "220 King George Blvd", 5.7, 4.0, 64, 10, 12.00, 7.00, 2, 15, 10,
     "https://images.unsplash.com/photo-1750492960736-6ef3f76d6c95?fm=jpg&q=80&w=1200&auto=format&fit=crop"],
    ["Golden Touch", "location", "Vancouver", "900 Granville St", 1.5, 4.8, 311, 30, 25.00, 10.00, 2, 15, 30,
     "https://images.pexels.com/photos/5233285/pexels-photo-5233285.jpeg?auto=compress&cs=tinysrgb&w=1200"],
    ["Quick N Clean", "location", "New West", "12 Columbia St", 6.2, 3.9, 41, 0, 8.00, 5.00, 2, 15, 6,
     "https://images.unsplash.com/photo-1762933855598-273a51b47649?fm=jpg&q=80&w=1200&auto=format&fit=crop"]
  ];

  // ---------- Car washes: mobile services (come to you) ----------
  // Both of these wash CARS at your location — they differ only in the vehicle
  // the crew arrives in. "home-service" = a van with its own water tank.
  // "moto-mobile" = a small motorcycle fitted with a water tank — same idea,
  // just nimbler and cheaper, better suited to tight streets and smaller cars.
  const mobileServices = [
    ["DriveClean Mobile Wash", "home-service", "Comes to your home", null, 0, 4.6, 58, 0, 22.00, 12.00, 1, 45, 15, 20,
     "https://images.pexels.com/photos/6196223/pexels-photo-6196223.jpeg?auto=compress&cs=tinysrgb&w=1200",
     "A fully-equipped van with its own water tank and generator comes to your driveway — perfect for busy schedules."],
    ["HomeShine On-Demand", "home-service", "Comes to your home", null, 0, 4.4, 33, 0, 20.00, 10.00, 1, 45, 10, 18,
     "https://images.pexels.com/photos/6196223/pexels-photo-6196223.jpeg?auto=compress&cs=tinysrgb&w=1200",
     "Book a two-person detailing crew and their van to your address. Great for apartments and offices with parking."],
    ["MotoWheels Quick Wash", "moto-mobile", "Comes to your home", null, 0, 4.7, 46, 0, 12.00, 6.00, 1, 30, 12, 12,
     "https://images.pexels.com/photos/4513028/pexels-photo-4513028.jpeg?auto=compress&cs=tinysrgb&w=1200",
     "A motorcycle fitted with its own water tank washes your car right at your door — quick, affordable, and able to reach tight streets a van can't."],
    ["BikeVan Express", "moto-mobile", "Comes to your home", null, 0, 4.3, 27, 0, 10.00, 5.00, 1, 30, 8, 10,
     "https://images.pexels.com/photos/36709685/pexels-photo-36709685.jpeg?auto=compress&cs=tinysrgb&w=1200",
     "Our water-tank motorcycles zip through traffic to reach you fast — a lighter-touch wash for smaller cars, at a lighter price."]
  ];

  const insertedIds = {};

  for (const loc of locations) {
    const [name, serviceType, location, address, distance, rating, reviewCount, waitTime, extPrice, fullAddon, capacity, interval, points, imageUrl] = loc;
    const result = await pool.query(
      `INSERT INTO car_washes
        (name, service_type, location, address, distance_km, rating, review_count, wait_time_minutes,
         exterior_price, full_wash_addon, concurrent_slots, slot_interval_minutes, points_per_visit, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id, name`,
      [name, serviceType, location, address, distance, rating, reviewCount, waitTime, extPrice, fullAddon, capacity, interval, points, imageUrl]
    );
    insertedIds[name] = result.rows[0].id;
  }

  for (const svc of mobileServices) {
    const [name, serviceType, location, address, distance, rating, reviewCount, waitTime, extPrice, fullAddon, capacity, interval, radius, points, imageUrl, description] = svc;
    const result = await pool.query(
      `INSERT INTO car_washes
        (name, service_type, location, address, distance_km, rating, review_count, wait_time_minutes,
         exterior_price, full_wash_addon, concurrent_slots, slot_interval_minutes, service_radius_km, points_per_visit, image_url, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id, name`,
      [name, serviceType, location, address, distance, rating, reviewCount, waitTime, extPrice, fullAddon, capacity, interval, radius, points, imageUrl, description]
    );
    insertedIds[name] = result.rows[0].id;
  }

  // Give the demo seller ownership of a mix: one fixed location + one moto-mobile
  await pool.query(`UPDATE car_washes SET owner_id = $1 WHERE name IN ('Sparkle Auto Wash', 'MotoWheels Quick Wash')`, [adminId]);
  console.log(`Created ${Object.keys(insertedIds).length} car washes (6 locations, 2 home-service, 2 moto-mobile).`);

  // ---------- Add-on services ----------
  // Both home-service and moto-mobile wash cars, so they get the same style
  // of car add-ons as fixed locations (just a smaller, cheaper set for moto-mobile
  // since it's a lighter-duty service).
  const carAddons = [
    { name: "Tire Shine", price: 3.00, appliesTo: "both" },
    { name: "Undercarriage Wash", price: 4.00, appliesTo: "both" },
    { name: "Wax Coating", price: 7.00, appliesTo: "both" },
    { name: "Headlight Restoration", price: 6.00, appliesTo: "both" },
    { name: "Engine Bay Clean", price: 8.00, appliesTo: "exterior" },
    { name: "Pet Hair Removal", price: 5.00, appliesTo: "full" }
  ];
  const lightAddons = [ // for the smaller moto-mobile service
    { name: "Tire Shine", price: 2.00, appliesTo: "both" },
    { name: "Wax Coating", price: 5.00, appliesTo: "both" },
    { name: "Air Freshener", price: 2.00, appliesTo: "both" }
  ];

  for (const [name, id] of Object.entries(insertedIds)) {
    const isMotoMobile = name === "MotoWheels Quick Wash" || name === "BikeVan Express";
    const addonSet = isMotoMobile ? lightAddons : carAddons;
    for (const addon of addonSet) {
      await pool.query(
        `INSERT INTO addon_services (car_wash_id, name, price, applies_to) VALUES ($1,$2,$3,$4)`,
        [id, addon.name, addon.price, addon.appliesTo]
      );
    }
  }
  console.log("Added add-on services for every wash.");

  // ---------- Offers ----------
  // Includes both one-off promos and recurring "package" style deals —
  // buying a bundle of washes up front at a discount is a proven car-wash
  // industry play (it locks in repeat visits and improves cash flow), so a
  // few of these are structured that way even though there's no separate
  // subscription-billing system behind them yet — a customer just mentions
  // the offer at checkout / a seller can apply it manually for now.
  await pool.query(
    `INSERT INTO offers (title, description, icon, discount_text, scope, expires_at) VALUES
      ('20% Off New Users',
       'Get 20% off your very first booking on Car Wash Finder — any location, any service type. Applied automatically at checkout on your first order.',
       'fa-gift', '20% OFF', 'app-only', CURRENT_DATE + INTERVAL '30 days'),
      ('Monthly Value Pack — 4 Washes',
       'Prepay for 4 washes in a calendar month at any single location and get 15% off the total, worked out per-wash. Great for regular commuters — mention this offer when booking your first wash of the month.',
       'fa-calendar-check', '15% OFF', 'app-only', NULL),
      ('Bi-Weekly Shine Plan — 2 Washes',
       'Book 2 washes in the same month at the same location and get 10% off both. A lighter commitment than the Monthly Value Pack, same idea.',
       'fa-repeat', '10% OFF', 'app-only', NULL),
      ('Summer Deals',
       'Seasonal pricing on exterior washes at participating locations nationwide through the end of summer. Look for the Summer Deals badge on eligible car washes.',
       'fa-sun', 'Up to 15% OFF', 'nationwide', DATE '2026-08-31'),
      ('Loyalty Rewards',
       'Earn points on every booking — how many depends on the wash place and service. Reach 500 points for a free basic wash, 1000 for a free full detail, and more. Points never expire.',
       'fa-crown', 'Earn as you go', 'app-only', NULL),
      ('Free Wax Upgrade',
       'Book a Premium Detail or Deluxe Service package this week and we will add a Wax Coating upgrade at no extra charge.',
       'fa-spa', 'Free upgrade', 'app-only', CURRENT_DATE + INTERVAL '14 days'),
      ('Group Discount',
       'Booking 3 or more vehicles for the same day and location? Get 15% off the entire group booking. Applies to both fixed locations and mobile services nationwide.',
       'fa-user-friends', '15% OFF', 'nationwide', NULL)`
  );
  console.log("Added offers (including monthly/bi-weekly package deals).");

  // ---------- Sample booking history + reviews for the demo customer ----------
  const camry = await pool.query(`SELECT id FROM vehicles WHERE user_id = $1 AND nickname = 'My Camry'`, [customerId]);
  const vehicleId = camry.rows[0].id;
  const visaCard = await pool.query(`SELECT id FROM payment_methods WHERE user_id = $1 AND type = 'visa'`, [customerId]);
  const paymentMethodId = visaCard.rows[0].id;
  const sparkleId = insertedIds["Sparkle Auto Wash"];
  const ecoWashId = insertedIds["EcoWash"];

  const pastBooking1 = await pool.query(
    `INSERT INTO bookings
      (booking_ref, user_id, car_wash_id, vehicle_id, wash_type, addons, booking_date, booking_time,
       base_price, addons_price, tax, total_price, payment_method_id, points_earned, status, created_at)
     VALUES ($1,$2,$3,$4,'full','[]', CURRENT_DATE - INTERVAL '14 days', '10:30',
       23.00, 0, 2.30, 25.30, $5, 15, 'completed', CURRENT_DATE - INTERVAL '14 days')
     RETURNING id`,
    [genCode('CW'), customerId, sparkleId, vehicleId, paymentMethodId]
  );

  const pastBooking2 = await pool.query(
    `INSERT INTO bookings
      (booking_ref, user_id, car_wash_id, vehicle_id, wash_type, addons, booking_date, booking_time,
       base_price, addons_price, tax, total_price, payment_method_id, points_earned, status, created_at)
     VALUES ($1,$2,$3,$4,'exterior','[]', CURRENT_DATE - INTERVAL '5 days', '14:00',
       18.00, 7.00, 2.50, 27.50, $5, 20, 'completed', CURRENT_DATE - INTERVAL '5 days')
     RETURNING id`,
    [genCode('CW'), customerId, ecoWashId, vehicleId, paymentMethodId]
  );

  // An upcoming booking that hasn't happened yet — no review possible for this one.
  await pool.query(
    `INSERT INTO bookings
      (booking_ref, user_id, car_wash_id, vehicle_id, wash_type, addons, booking_date, booking_time,
       base_price, addons_price, tax, total_price, payment_method_id, points_earned, status)
     VALUES ($1,$2,$3,$4,'full','[]', CURRENT_DATE + INTERVAL '3 days', '09:15',
       23.00, 0, 2.30, 25.30, $5, 0, 'confirmed')`,
    [genCode('CW'), customerId, sparkleId, vehicleId, paymentMethodId]
  );

  await pool.query(
    `INSERT INTO reviews (booking_id, user_id, car_wash_id, rating, comment) VALUES
      ($1, $2, $3, 5, 'Quick, friendly, and my car looked brand new. Will book again!')`,
    [pastBooking1.rows[0].id, customerId, sparkleId]
  );
  // pastBooking2 intentionally left unreviewed so there's something to test the rating page with.

  await pool.query(
    `INSERT INTO point_transactions (user_id, booking_id, points, reason) VALUES
      ($1, $2, 15, 'Wash completed at Sparkle Auto Wash'),
      ($1, $3, 20, 'Wash completed at EcoWash'),
      ($1, NULL, 315, 'Welcome bonus')`,
    [customerId, pastBooking1.rows[0].id, pastBooking2.rows[0].id]
  );
  console.log("Added sample booking history, a review, and point transactions for the demo customer.");

  console.log("Seed complete.");
  console.log("");
  console.log("Demo customer login: demo.customer@carwash.app / demo1234");
  console.log("Demo seller (admin) login: demo.admin@carwash.app / demo1234");
  console.log("");
  await pool.end();
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
