// demo-mode.js — a complete, self-contained mock of the backend API.
//
// When demo mode is on, apiFetch() (in auth.js) routes every call here
// instead of hitting the real server. Everything lives in localStorage, so
// it works with zero backend, zero database, zero network — good for
// trying the app out, or for testing when you don't want to stand up
// Postgres. Mutations (bookings, points, etc.) persist across reloads in
// *this browser only* — there's no real server behind any of it, so there's
// nothing to keep in sync and nothing that survives clearing browser data.
//
// This deliberately mirrors the real backend's routes/logic closely so the
// two modes behave the same way — see backend/routes/*.js for the source
// of truth this was ported from.
//
// Everything below is wrapped in an IIFE so its internal names (EMAIL_RE,
// TAX_RATE, etc.) can't collide with a page's own inline <script> — classic
// <script> tags on the same page share one top-level scope for const/let,
// so without this wrapper a page that happens to declare its own, say,
// `const TAX_RATE` (booking-details.html does) would throw a SyntaxError
// and break the entire page, not just demo mode. Only DemoMode and
// DemoAPI are deliberately exposed on window at the bottom.
(function () {

const DEMO_DB_KEY = "cwf_demo_db";
const DEMO_FLAG_KEY = "cwf_demo_mode";

const DemoMode = {
  isActive() {
    return localStorage.getItem(DEMO_FLAG_KEY) === "1";
  },
  enable() {
    localStorage.setItem(DEMO_FLAG_KEY, "1");
  },
  disable() {
    localStorage.removeItem(DEMO_FLAG_KEY);
  },
  reset() {
    const db = buildSeedData();
    saveDB(db);
    return db;
  }
};

// ============================================================
// Seed dataset — deliberately broader than the real backend's seed.js so
// there's plenty to click through: 8 fixed locations across price tiers,
// 3 home-service (van) washes, and 3 moto-mobile washes, all owned in a
// mix by the demo seller account so the Seller Dashboard has real variety
// to show.
// ============================================================
function buildSeedData() {
  const now = new Date().toISOString();

  const users = [
    { id: 1, name: "Layla Hassan", email: "demo.customer@carwash.app", password: "demo1234", role: "customer", avatar_url: null, points_balance: 350, created_at: now },
    { id: 2, name: "Omar Al-Rashid", email: "demo.admin@carwash.app", password: "demo1234", role: "seller", avatar_url: null, points_balance: 0, created_at: now }
  ];

  const carWashes = [
    // Fixed locations
    { id: 1, owner_id: 2, name: "Sparkle Auto Wash", service_type: "location", location: "Downtown", address: "142 Main St", distance_km: 2.8, rating: 4.5, review_count: 142, wait_time_minutes: 15, exterior_price: 15.00, full_wash_addon: 8.00, concurrent_slots: 2, slot_interval_minutes: 15, service_radius_km: null, points_per_visit: 15, image_url: "https://images.unsplash.com/photo-1750492960736-6ef3f76d6c95?fm=jpg&q=80&w=1200&auto=format&fit=crop", description: "A neighborhood favorite for a quick, reliable wash." },
    { id: 2, owner_id: null, name: "SuperClean Express", service_type: "location", location: "Burnaby", address: "88 Kingsway Ave", distance_km: 4.3, rating: 4.2, review_count: 87, wait_time_minutes: 5, exterior_price: 10.00, full_wash_addon: 6.00, concurrent_slots: 2, slot_interval_minutes: 15, service_radius_km: null, points_per_visit: 8, image_url: "https://images.unsplash.com/photo-1762933855598-273a51b47649?fm=jpg&q=80&w=1200&auto=format&fit=crop", description: "Fast in-and-out express wash, no appointment stress." },
    { id: 3, owner_id: null, name: "EcoWash", service_type: "location", location: "Richmond", address: "5 Garden City Rd", distance_km: 3.1, rating: 4.7, review_count: 203, wait_time_minutes: 25, exterior_price: 18.00, full_wash_addon: 9.00, concurrent_slots: 2, slot_interval_minutes: 15, service_radius_km: null, points_per_visit: 20, image_url: "https://images.pexels.com/photos/5233285/pexels-photo-5233285.jpeg?auto=compress&cs=tinysrgb&w=1200", description: "Biodegradable soaps and water-reclaiming equipment." },
    { id: 4, owner_id: null, name: "FastShine", service_type: "location", location: "Surrey", address: "220 King George Blvd", distance_km: 5.7, rating: 4.0, review_count: 64, wait_time_minutes: 10, exterior_price: 12.00, full_wash_addon: 7.00, concurrent_slots: 2, slot_interval_minutes: 15, service_radius_km: null, points_per_visit: 10, image_url: "https://images.unsplash.com/photo-1750492960736-6ef3f76d6c95?fm=jpg&q=80&w=1200&auto=format&fit=crop", description: "Straightforward, budget-friendly washes." },
    { id: 5, owner_id: 2, name: "Golden Touch", service_type: "location", location: "Vancouver", address: "900 Granville St", distance_km: 1.5, rating: 4.8, review_count: 311, wait_time_minutes: 30, exterior_price: 25.00, full_wash_addon: 10.00, concurrent_slots: 2, slot_interval_minutes: 15, service_radius_km: null, points_per_visit: 30, image_url: "https://images.pexels.com/photos/5233285/pexels-photo-5233285.jpeg?auto=compress&cs=tinysrgb&w=1200", description: "Premium hand-finished detailing." },
    { id: 6, owner_id: null, name: "Quick N Clean", service_type: "location", location: "New West", address: "12 Columbia St", distance_km: 6.2, rating: 3.9, review_count: 41, wait_time_minutes: 0, exterior_price: 8.00, full_wash_addon: 5.00, concurrent_slots: 2, slot_interval_minutes: 15, service_radius_km: null, points_per_visit: 6, image_url: "https://images.unsplash.com/photo-1762933855598-273a51b47649?fm=jpg&q=80&w=1200&auto=format&fit=crop", description: "The no-frills budget option — always the cheapest in town." },
    { id: 7, owner_id: null, name: "Midnight Wash 24/7", service_type: "location", location: "Coquitlam", address: "77 Lougheed Hwy", distance_km: 7.4, rating: 4.1, review_count: 58, wait_time_minutes: 5, exterior_price: 11.00, full_wash_addon: 6.00, concurrent_slots: 3, slot_interval_minutes: 15, service_radius_km: null, points_per_visit: 9, image_url: "https://images.unsplash.com/photo-1750492960736-6ef3f76d6c95?fm=jpg&q=80&w=1200&auto=format&fit=crop", description: "Open around the clock — self-serve bays, never closed." },
    { id: 8, owner_id: 2, name: "Prestige Detailing Studio", service_type: "location", location: "West Vancouver", address: "1500 Marine Dr", distance_km: 9.1, rating: 4.9, review_count: 96, wait_time_minutes: 45, exterior_price: 35.00, full_wash_addon: 15.00, concurrent_slots: 1, slot_interval_minutes: 30, service_radius_km: null, points_per_visit: 40, image_url: "https://images.pexels.com/photos/5233261/pexels-photo-5233261.jpeg?auto=compress&cs=tinysrgb&w=1200", description: "By-appointment concours-level detailing for people who take their car seriously." },
    // Home service (van)
    { id: 9, owner_id: 2, name: "DriveClean Mobile Wash", service_type: "home-service", location: "Comes to your home", address: null, distance_km: 0, rating: 4.6, review_count: 58, wait_time_minutes: 0, exterior_price: 22.00, full_wash_addon: 12.00, concurrent_slots: 1, slot_interval_minutes: 45, service_radius_km: 15, points_per_visit: 20, image_url: "https://images.pexels.com/photos/6196223/pexels-photo-6196223.jpeg?auto=compress&cs=tinysrgb&w=1200", description: "A fully-equipped van with its own water tank and generator comes to your driveway." },
    { id: 10, owner_id: null, name: "HomeShine On-Demand", service_type: "home-service", location: "Comes to your home", address: null, distance_km: 0, rating: 4.4, review_count: 33, wait_time_minutes: 0, exterior_price: 20.00, full_wash_addon: 10.00, concurrent_slots: 1, slot_interval_minutes: 45, service_radius_km: 10, points_per_visit: 18, image_url: "https://images.pexels.com/photos/6196223/pexels-photo-6196223.jpeg?auto=compress&cs=tinysrgb&w=1200", description: "A two-person detailing crew and their van, at your address." },
    { id: 11, owner_id: null, name: "WeekendWash Concierge", service_type: "home-service", location: "Comes to your home", address: null, distance_km: 0, rating: 4.8, review_count: 21, wait_time_minutes: 0, exterior_price: 30.00, full_wash_addon: 14.00, concurrent_slots: 1, slot_interval_minutes: 60, service_radius_km: 20, points_per_visit: 28, image_url: "https://images.pexels.com/photos/6196223/pexels-photo-6196223.jpeg?auto=compress&cs=tinysrgb&w=1200", description: "A premium weekend-only concierge wash, booked ahead." },
    // Moto-mobile (washes cars via a motorcycle with a water tank)
    { id: 12, owner_id: 2, name: "MotoWheels Quick Wash", service_type: "moto-mobile", location: "Comes to your home", address: null, distance_km: 0, rating: 4.7, review_count: 46, wait_time_minutes: 0, exterior_price: 12.00, full_wash_addon: 6.00, concurrent_slots: 1, slot_interval_minutes: 30, service_radius_km: 12, points_per_visit: 12, image_url: "https://images.pexels.com/photos/4513028/pexels-photo-4513028.jpeg?auto=compress&cs=tinysrgb&w=1200", description: "A motorcycle fitted with its own water tank washes your car right at your door." },
    { id: 13, owner_id: null, name: "BikeVan Express", service_type: "moto-mobile", location: "Comes to your home", address: null, distance_km: 0, rating: 4.3, review_count: 27, wait_time_minutes: 0, exterior_price: 10.00, full_wash_addon: 5.00, concurrent_slots: 1, slot_interval_minutes: 30, service_radius_km: 8, points_per_visit: 10, image_url: "https://images.pexels.com/photos/36709685/pexels-photo-36709685.jpeg?auto=compress&cs=tinysrgb&w=1200", description: "Zips through traffic to reach you fast." },
    { id: 14, owner_id: 2, name: "ZipWash Moto", service_type: "moto-mobile", location: "Comes to your home", address: null, distance_km: 0, rating: 4.0, review_count: 14, wait_time_minutes: 0, exterior_price: 9.00, full_wash_addon: 4.00, concurrent_slots: 1, slot_interval_minutes: 30, service_radius_km: 6, points_per_visit: 8, image_url: "https://images.pexels.com/photos/4513028/pexels-photo-4513028.jpeg?auto=compress&cs=tinysrgb&w=1200", description: "The budget moto-mobile option — quick and cheap." }
  ];

  const carAddons = [
    { name: "Tire Shine", price: 3.00, appliesTo: "both" },
    { name: "Undercarriage Wash", price: 4.00, appliesTo: "both" },
    { name: "Wax Coating", price: 7.00, appliesTo: "both" },
    { name: "Headlight Restoration", price: 6.00, appliesTo: "both" },
    { name: "Engine Bay Clean", price: 8.00, appliesTo: "exterior" },
    { name: "Pet Hair Removal", price: 5.00, appliesTo: "full" }
  ];
  const lightAddons = [
    { name: "Tire Shine", price: 2.00, appliesTo: "both" },
    { name: "Wax Coating", price: 5.00, appliesTo: "both" },
    { name: "Air Freshener", price: 2.00, appliesTo: "both" }
  ];

  let addonId = 1;
  const addonServices = [];
  carWashes.forEach(w => {
    const isMoto = w.service_type === "moto-mobile";
    const set = isMoto ? lightAddons : carAddons;
    set.forEach(a => addonServices.push({ id: addonId++, car_wash_id: w.id, name: a.name, price: a.price, applies_to: a.appliesTo }));
  });

  const offers = [
    { id: 1, title: "20% Off New Users", description: "Get 20% off your very first booking on Car Wash Finder — any location, any service type. Applied automatically at checkout on your first order.", icon: "fa-gift", discount_text: "20% OFF", scope: "app-only", expires_at: addDays(30) },
    { id: 2, title: "Monthly Value Pack — 4 Washes", description: "Prepay for 4 washes in a calendar month at any single location and get 15% off the total, worked out per-wash. Great for regular commuters — mention this offer when booking your first wash of the month.", icon: "fa-calendar-check", discount_text: "15% OFF", scope: "app-only", expires_at: null },
    { id: 3, title: "Bi-Weekly Shine Plan — 2 Washes", description: "Book 2 washes in the same month at the same location and get 10% off both. A lighter commitment than the Monthly Value Pack, same idea.", icon: "fa-repeat", discount_text: "10% OFF", scope: "app-only", expires_at: null },
    { id: 4, title: "Summer Deals", description: "Seasonal pricing on exterior washes at participating locations nationwide through the end of summer. Look for the Summer Deals badge on eligible car washes.", icon: "fa-sun", discount_text: "Up to 15% OFF", scope: "nationwide", expires_at: "2026-08-31" },
    { id: 5, title: "Loyalty Rewards", description: "Earn points on every booking — how many depends on the wash place and service. Reach 500 points for a free basic wash, 1000 for a free full detail, and more. Points never expire.", icon: "fa-crown", discount_text: "Earn as you go", scope: "app-only", expires_at: null },
    { id: 6, title: "Free Wax Upgrade", description: "Book a Premium Detail or Deluxe Service package this week and we will add a Wax Coating upgrade at no extra charge.", icon: "fa-spa", discount_text: "Free upgrade", scope: "app-only", expires_at: addDays(14) },
    { id: 7, title: "Group Discount", description: "Booking 3 or more vehicles for the same day and location? Get 15% off the entire group booking. Applies to both fixed locations and mobile services nationwide.", icon: "fa-user-friends", discount_text: "15% OFF", scope: "nationwide", expires_at: null }
  ];

  const vehicles = [
    { id: 1, user_id: 1, nickname: "My Camry", make: "Toyota", model: "Camry", plate: "ABC-1234", vehicle_type: "sedan" },
    { id: 2, user_id: 1, nickname: "Family SUV", make: "Honda", model: "CR-V", plate: "XYZ-5678", vehicle_type: "suv" }
  ];

  const paymentMethods = [
    { id: 1, user_id: 1, type: "visa", last4: "1234", label: "Visa •••• 1234", is_default: true, created_at: now },
    { id: 2, user_id: 1, type: "mastercard", last4: "5678", label: "Mastercard •••• 5678", is_default: false, created_at: now },
    { id: 3, user_id: 1, type: "apple-pay", last4: null, label: "Apple Pay", is_default: false, created_at: now }
  ];

  const bookings = [
    { id: 1, booking_ref: "CW-DEMO01", user_id: 1, car_wash_id: 1, vehicle_id: 1, wash_type: "full", addons: [], booking_date: addDays(-14), booking_time: "10:30", base_price: 23.00, addons_price: 0, tax: 2.30, total_price: 25.30, payment_method_id: 1, address: null, special_requests: null, points_earned: 15, status: "completed", created_at: addDays(-14) },
    { id: 2, booking_ref: "CW-DEMO02", user_id: 1, car_wash_id: 3, vehicle_id: 1, wash_type: "exterior", addons: [], booking_date: addDays(-5), booking_time: "14:00", base_price: 18.00, addons_price: 7.00, tax: 2.50, total_price: 27.50, payment_method_id: 1, address: null, special_requests: null, points_earned: 20, status: "completed", created_at: addDays(-5) },
    { id: 3, booking_ref: "CW-DEMO03", user_id: 1, car_wash_id: 1, vehicle_id: 1, wash_type: "full", addons: [], booking_date: addDays(3), booking_time: "09:15", base_price: 23.00, addons_price: 0, tax: 2.30, total_price: 25.30, payment_method_id: 1, address: null, special_requests: null, points_earned: 0, status: "confirmed", created_at: now }
  ];

  const reviews = [
    { id: 1, booking_id: 1, user_id: 1, car_wash_id: 1, rating: 5, comment: "Quick, friendly, and my car looked brand new. Will book again!", created_at: addDays(-13) }
  ];

  const pointTransactions = [
    { id: 1, user_id: 1, booking_id: 1, points: 15, reason: "Wash completed at Sparkle Auto Wash", created_at: addDays(-14) },
    { id: 2, user_id: 1, booking_id: 2, points: 20, reason: "Wash completed at EcoWash", created_at: addDays(-5) },
    { id: 3, user_id: 1, booking_id: null, points: 315, reason: "Welcome bonus", created_at: now }
  ];

  return {
    users, carWashes, addonServices, offers, vehicles, paymentMethods,
    bookings, reviews, pointTransactions, rewardRedemptions: [],
    nextId: { user: 3, carWash: 15, addon: addonId, vehicle: 3, paymentMethod: 4, booking: 4, review: 2, pointTx: 4, redemption: 1 }
  };
}

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ============================================================
// Storage
// ============================================================
function loadDB() {
  try {
    const raw = localStorage.getItem(DEMO_DB_KEY);
    if (!raw) return DemoMode.reset();
    return JSON.parse(raw);
  } catch {
    return DemoMode.reset();
  }
}
function saveDB(db) {
  localStorage.setItem(DEMO_DB_KEY, JSON.stringify(db));
}

// ============================================================
// Auth helpers (demo tokens are just "demo-token-<userId>" — there's
// nothing to forge since this all runs in one browser against local data)
// ============================================================
function demoToken(userId) { return `demo-token-${userId}`; }
function demoUserIdFromToken(token) {
  const m = /^demo-token-(\d+)$/.exec(token || "");
  return m ? parseInt(m[1], 10) : null;
}
function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, avatarUrl: u.avatar_url || null, pointsBalance: u.points_balance, createdAt: u.created_at };
}
function apiError(message, status = 400) {
  const e = new Error(message);
  e.status = status;
  return e;
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VEHICLE_SURCHARGE = { sedan: 0, suv: 5, truck: 8, van: 10 };
const TAX_RATE = 0.1;
const TIERS = [
  { points: 500, label: "Free Basic Wash (Exterior Only)" },
  { points: 1000, label: "Free Full Detail (Exterior + Interior)" },
  { points: 1500, label: "$25 Off Any Mobile Service" },
  { points: 2500, label: "Free Premium Detail + Priority Booking for a Month" }
];

// ============================================================
// Router — mirrors backend/routes/*.js
// ============================================================
const DemoAPI = {
  async request(method, path, bodyRaw) {
    const db = loadDB();
    const body = bodyRaw ? JSON.parse(bodyRaw) : {};
    const [pathname, qs] = path.split("?");
    const query = Object.fromEntries(new URLSearchParams(qs || ""));
    const seg = pathname.split("/").filter(Boolean);

    function currentUser() {
      const id = demoUserIdFromToken(Auth.getToken());
      return db.users.find(u => u.id === id) || null;
    }
    function requireUser() {
      const u = currentUser();
      if (!u) throw apiError("Not authenticated. Please log in.", 401);
      return u;
    }
    function requireSellerUser() {
      const u = requireUser();
      if (u.role !== "seller") throw apiError("This action is only available to wash owner accounts.", 403);
      return u;
    }

    // ---------- AUTH ----------
    if (method === "POST" && pathname === "/auth/signup") {
      const { name, email, password, role, business } = body;
      const accountRole = role === "seller" ? "seller" : "customer";
      if (!name || !name.trim()) throw apiError("Please enter your name.");
      if (!email || !EMAIL_RE.test(email.trim())) throw apiError("Please enter a valid email address.");
      if (!password || password.length < 6) throw apiError("Password must be at least 6 characters.");
      if (accountRole === "seller") {
        if (!business || !business.name || !business.name.trim()) throw apiError("Please enter your wash business name.");
        if (!["location", "home-service", "moto-mobile"].includes(business.serviceType)) throw apiError("Please choose a valid service type for your business.");
      }
      const emailNorm = email.trim().toLowerCase();
      if (db.users.some(u => u.email === emailNorm)) throw apiError("An account with this email already exists. Try logging in instead.", 409);

      const user = { id: db.nextId.user++, name: name.trim(), email: emailNorm, password, role: accountRole, avatar_url: null, points_balance: 0, created_at: new Date().toISOString() };
      db.users.push(user);

      if (accountRole === "seller") {
        const isMobile = business.serviceType !== "location";
        db.carWashes.push({
          id: db.nextId.carWash++, owner_id: user.id, name: business.name.trim(), service_type: business.serviceType,
          location: business.location ? business.location.trim() : (isMobile ? "Comes to your home" : null),
          address: null, distance_km: 0, rating: 4.5, review_count: 0, wait_time_minutes: isMobile ? 0 : 15,
          exterior_price: 15.00, full_wash_addon: 8.00, concurrent_slots: isMobile ? 1 : 2, slot_interval_minutes: isMobile ? 45 : 15,
          service_radius_km: isMobile ? 15 : null, points_per_visit: 10, image_url: null,
          description: "New on Car Wash Finder — set your pricing and details from your seller dashboard."
        });
      }
      saveDB(db);
      return { status: 201, data: { token: demoToken(user.id), user: publicUser(user) } };
    }

    if (method === "POST" && pathname === "/auth/login") {
      const { email, password, expectRole } = body;
      if (!email || !EMAIL_RE.test(email.trim())) throw apiError("Please enter a valid email address.");
      if (!password) throw apiError("Please enter your password.");
      const user = db.users.find(u => u.email === email.trim().toLowerCase());
      if (!user) throw apiError("We couldn't find an account with that email.", 401);
      if (user.password !== password) throw apiError("Incorrect password. Please try again.", 401);
      if (expectRole && user.role !== expectRole) {
        const friendly = user.role === "seller" ? "wash owner" : "customer";
        const wanted = expectRole === "seller" ? "wash owner" : "customer";
        throw apiError(`This is a ${friendly} account. You're signing in on the ${wanted} login — try the ${friendly} login instead.`, 403);
      }
      return { status: 200, data: { token: demoToken(user.id), user: publicUser(user) } };
    }

    if (method === "GET" && pathname === "/auth/me") {
      const user = requireUser();
      const bookings = db.bookings.filter(b => b.user_id === user.id).length;
      const vehicles = db.vehicles.filter(v => v.user_id === user.id).length;
      const payments = db.paymentMethods.filter(p => p.user_id === user.id).length;
      return { status: 200, data: { user: publicUser(user), stats: { bookings, vehicles, payments } } };
    }

    // ---------- CAR WASHES ----------
    if (method === "GET" && pathname === "/carwashes") {
      let list = db.carWashes.slice();
      if (query.type) list = list.filter(w => w.service_type === query.type);
      list.sort((a, b) => a.id - b.id);
      return { status: 200, data: list };
    }

    if (method === "GET" && seg[0] === "carwashes" && seg.length === 2) {
      const wash = db.carWashes.find(w => w.id === parseInt(seg[1], 10));
      if (!wash) throw apiError("Car wash not found.", 404);
      const addons = db.addonServices.filter(a => a.car_wash_id === wash.id).sort((a, b) => a.price - b.price);
      return { status: 200, data: { ...wash, addons } };
    }

    if (method === "GET" && seg[0] === "carwashes" && seg[2] === "slots") {
      const washId = parseInt(seg[1], 10);
      const wash = db.carWashes.find(w => w.id === washId);
      if (!wash) throw apiError("Car wash not found.", 404);
      const date = query.date;
      if (!date) throw apiError("A date is required.");

      const bookedMap = {};
      db.bookings.filter(b => b.car_wash_id === washId && b.booking_date === date && b.status !== "cancelled")
        .forEach(b => { bookedMap[b.booking_time] = (bookedMap[b.booking_time] || 0) + 1; });

      const interval = wash.slot_interval_minutes;
      const capacity = wash.concurrent_slots;
      const slots = [];
      for (let mins = 8 * 60; mins < 20 * 60; mins += interval) {
        const hh = String(Math.floor(mins / 60)).padStart(2, "0");
        const mm = String(mins % 60).padStart(2, "0");
        const time = `${hh}:${mm}`;
        const booked = bookedMap[time] || 0;
        slots.push({ time, capacity, booked, available: booked < capacity });
      }
      return { status: 200, data: { carWashId: washId, date, interval, capacity, slots } };
    }

    // ---------- OFFERS ----------
    if (method === "GET" && pathname === "/offers") {
      return { status: 200, data: db.offers.slice().sort((a, b) => a.id - b.id) };
    }

    // ---------- VEHICLES ----------
    if (method === "GET" && pathname === "/vehicles") {
      const user = requireUser();
      return { status: 200, data: db.vehicles.filter(v => v.user_id === user.id).sort((a, b) => a.id - b.id) };
    }
    if (method === "POST" && pathname === "/vehicles") {
      const user = requireUser();
      const { nickname, make, model, plate, vehicleType } = body;
      if (!vehicleType) throw apiError("vehicleType is required.");
      const vehicle = { id: db.nextId.vehicle++, user_id: user.id, nickname: nickname || null, make: make || null, model: model || null, plate: plate || null, vehicle_type: vehicleType };
      db.vehicles.push(vehicle);
      saveDB(db);
      return { status: 201, data: vehicle };
    }
    if (method === "DELETE" && seg[0] === "vehicles") {
      const user = requireUser();
      const id = parseInt(seg[1], 10);
      const idx = db.vehicles.findIndex(v => v.id === id && v.user_id === user.id);
      if (idx === -1) throw apiError("Vehicle not found.", 404);
      db.vehicles.splice(idx, 1);
      saveDB(db);
      return { status: 200, data: { deleted: true } };
    }

    // ---------- PAYMENT METHODS ----------
    if (method === "GET" && pathname === "/payment-methods") {
      const user = requireUser();
      return {
        status: 200,
        data: db.paymentMethods.filter(p => p.user_id === user.id).sort((a, b) => (b.is_default - a.is_default) || (a.id - b.id))
      };
    }
    if (method === "POST" && pathname === "/payment-methods") {
      const user = requireUser();
      const { type, last4, label, isDefault } = body;
      const validTypes = ["visa", "mastercard", "amex", "discover", "apple-pay"];
      if (!type || !validTypes.includes(type)) throw apiError("Please choose a valid payment method type.");
      if (type !== "apple-pay" && (!last4 || !/^\d{4}$/.test(last4))) throw apiError("Please enter the last 4 digits of the card.");
      if (type === "apple-pay" && db.paymentMethods.some(p => p.user_id === user.id && p.type === "apple-pay")) {
        throw apiError("Apple Pay is already saved to your account.", 409);
      }
      if (!type.includes("apple-pay") && db.paymentMethods.some(p => p.user_id === user.id && p.type === type && p.last4 === last4)) {
        throw apiError("You've already saved this exact payment method.", 409);
      }
      if (isDefault) db.paymentMethods.forEach(p => { if (p.user_id === user.id) p.is_default = false; });
      const method_ = { id: db.nextId.paymentMethod++, user_id: user.id, type, last4: type === "apple-pay" ? null : last4, label: label || null, is_default: !!isDefault, created_at: new Date().toISOString() };
      db.paymentMethods.push(method_);
      saveDB(db);
      return { status: 201, data: method_ };
    }
    if (method === "DELETE" && seg[0] === "payment-methods") {
      const user = requireUser();
      const id = parseInt(seg[1], 10);
      const idx = db.paymentMethods.findIndex(p => p.id === id && p.user_id === user.id);
      if (idx === -1) throw apiError("Payment method not found.", 404);
      db.paymentMethods.splice(idx, 1);
      saveDB(db);
      return { status: 200, data: { deleted: true } };
    }

    // ---------- BOOKINGS ----------
    if (method === "POST" && pathname === "/bookings") {
      const user = requireUser();
      const { carWashId, vehicleId, vehicleType, washType, addonIds = [], date, time, paymentMethodId, specialRequests, address } = body;
      if (!carWashId || !washType || !date || !time) throw apiError("Missing required booking fields.");
      if (!["exterior", "full"].includes(washType)) throw apiError("washType must be 'exterior' or 'full'.");

      const wash = db.carWashes.find(w => w.id === carWashId);
      if (!wash) throw apiError("Car wash not found.", 404);
      if (wash.service_type !== "location" && (!address || !address.trim())) throw apiError("Please provide an address for this mobile service.");

      const bookedCount = db.bookings.filter(b => b.car_wash_id === carWashId && b.booking_date === date && b.booking_time === time && b.status !== "cancelled").length;
      if (bookedCount >= wash.concurrent_slots) throw apiError("That time slot just filled up. Please pick another.", 409);

      let resolvedVehicleType = vehicleType || "sedan";
      if (vehicleId) {
        const v = db.vehicles.find(v => v.id === vehicleId && v.user_id === user.id);
        if (v) resolvedVehicleType = v.vehicle_type;
      }
      if (wash.service_type === "moto-mobile" && !["sedan", "suv"].includes(resolvedVehicleType)) {
        throw apiError("This motorcycle-delivered wash can only service sedans and SUVs — try a home-service (van) or a fixed location for larger vehicles.");
      }
      const vehicleSurcharge = VEHICLE_SURCHARGE[resolvedVehicleType] ?? 0;

      let addons = [];
      if (addonIds.length > 0) {
        addons = db.addonServices.filter(a => a.car_wash_id === carWashId && addonIds.includes(a.id))
          .map(a => ({ id: a.id, name: a.name, price: parseFloat(a.price) }));
      }
      const addonsPrice = addons.reduce((sum, a) => sum + a.price, 0);
      const basePrice = parseFloat(wash.exterior_price) + (washType === "full" ? parseFloat(wash.full_wash_addon) : 0) + vehicleSurcharge;
      const subtotal = basePrice + addonsPrice;
      const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;

      const booking = {
        id: db.nextId.booking++, booking_ref: "CW-" + Math.floor(100000 + Math.random() * 900000),
        user_id: user.id, car_wash_id: carWashId, vehicle_id: vehicleId || null, wash_type: washType,
        addons, booking_date: date, booking_time: time, base_price: basePrice, addons_price: addonsPrice,
        tax, total_price: total, payment_method_id: paymentMethodId || null,
        address: (address && address.trim()) || null, special_requests: specialRequests || null,
        points_earned: 0, status: "confirmed", created_at: new Date().toISOString()
      };
      db.bookings.push(booking);
      saveDB(db);
      return { status: 201, data: { ...booking, carWashName: wash.name } };
    }

    if (method === "GET" && pathname === "/bookings") {
      const user = requireUser();
      const list = db.bookings.filter(b => b.user_id === user.id).map(b => enrichBooking(db, b));
      list.sort((a, b) => (b.booking_date + b.booking_time).localeCompare(a.booking_date + a.booking_time));
      return { status: 200, data: list };
    }
    if (method === "GET" && seg[0] === "bookings" && seg.length === 2) {
      const user = requireUser();
      const booking = db.bookings.find(b => b.id === parseInt(seg[1], 10) && b.user_id === user.id);
      if (!booking) throw apiError("Booking not found.", 404);
      return { status: 200, data: enrichBooking(db, booking) };
    }
    if (method === "PATCH" && seg[0] === "bookings" && seg[2] === "cancel") {
      const user = requireUser();
      const booking = db.bookings.find(b => b.id === parseInt(seg[1], 10) && b.user_id === user.id && b.status !== "cancelled");
      if (!booking) throw apiError("Booking not found or already cancelled.", 404);
      booking.status = "cancelled";
      saveDB(db);
      return { status: 200, data: booking };
    }

    // ---------- POINTS ----------
    if (method === "GET" && pathname === "/points") {
      const user = requireUser();
      const balance = user.points_balance;
      const history = db.pointTransactions.filter(p => p.user_id === user.id).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 20);
      const redemptions = db.rewardRedemptions.filter(r => r.user_id === user.id).sort((a, b) => b.redeemed_at.localeCompare(a.redeemed_at));
      return { status: 200, data: { balance, tiers: TIERS.map(t => ({ ...t, unlocked: balance >= t.points })), history, redemptions } };
    }
    if (method === "POST" && pathname === "/points/redeem") {
      const user = requireUser();
      const tier = TIERS.find(t => t.points === body.tierPoints);
      if (!tier) throw apiError("Not a valid reward tier.");
      if (user.points_balance < tier.points) throw apiError(`You need ${tier.points} points for this reward — you have ${user.points_balance}.`);
      user.points_balance -= tier.points;
      db.pointTransactions.push({ id: db.nextId.pointTx++, user_id: user.id, booking_id: null, points: -tier.points, reason: `Redeemed: ${tier.label}`, created_at: new Date().toISOString() });
      const redemption = { id: db.nextId.redemption++, user_id: user.id, tier_points: tier.points, reward_label: tier.label, code: `RW-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, redeemed_at: new Date().toISOString(), used: false };
      db.rewardRedemptions.push(redemption);
      saveDB(db);
      return { status: 201, data: redemption };
    }

    // ---------- REVIEWS ----------
    if (method === "GET" && pathname === "/reviews") {
      const carWashId = parseInt(query.carWashId, 10);
      if (!carWashId) throw apiError("carWashId is required.");
      const reviews = db.reviews.filter(r => r.car_wash_id === carWashId).map(r => ({ ...r, reviewer_name: (db.users.find(u => u.id === r.user_id) || {}).name || "Anonymous" }))
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0.0";
      return { status: 200, data: { reviews, averageRating: avg, totalReviews: reviews.length } };
    }
    if (method === "GET" && seg[0] === "reviews" && seg[1] === "booking") {
      const user = requireUser();
      const booking = db.bookings.find(b => b.id === parseInt(seg[2], 10) && b.user_id === user.id);
      if (!booking) throw apiError("Booking not found.", 404);
      const wash = db.carWashes.find(w => w.id === booking.car_wash_id) || {};
      const existingReview = db.reviews.find(r => r.booking_id === booking.id) || null;
      return { status: 200, data: { booking: { ...booking, car_wash_name: wash.name, image_url: wash.image_url }, existingReview } };
    }
    if (method === "POST" && pathname === "/reviews") {
      const user = requireUser();
      const { bookingId, rating, comment } = body;
      if (!bookingId || !rating || rating < 1 || rating > 5) throw apiError("A booking and a rating from 1 to 5 are required.");
      const booking = db.bookings.find(b => b.id === bookingId && b.user_id === user.id);
      if (!booking) throw apiError("Booking not found.", 404);
      if (booking.status !== "completed") throw apiError("You can only rate a wash after it's completed.");
      if (db.reviews.some(r => r.booking_id === bookingId)) throw apiError("You've already rated this booking.", 409);

      const review = { id: db.nextId.review++, booking_id: bookingId, user_id: user.id, car_wash_id: booking.car_wash_id, rating, comment: comment || null, created_at: new Date().toISOString() };
      db.reviews.push(review);
      const wash = db.carWashes.find(w => w.id === booking.car_wash_id);
      if (wash) {
        const washReviews = db.reviews.filter(r => r.car_wash_id === wash.id);
        wash.review_count = washReviews.length;
        wash.rating = Math.round((washReviews.reduce((s, r) => s + r.rating, 0) / washReviews.length) * 10) / 10;
      }
      saveDB(db);
      return { status: 201, data: review };
    }

    // ---------- SELLER ----------
    if (method === "GET" && pathname === "/seller/washes") {
      const user = requireSellerUser();
      return { status: 200, data: db.carWashes.filter(w => w.owner_id === user.id).sort((a, b) => a.id - b.id) };
    }
    if (method === "GET" && pathname === "/seller/bookings") {
      const user = requireSellerUser();
      const ownedIds = new Set(db.carWashes.filter(w => w.owner_id === user.id).map(w => w.id));
      const list = db.bookings.filter(b => ownedIds.has(b.car_wash_id)).map(b => {
        const wash = db.carWashes.find(w => w.id === b.car_wash_id) || {};
        const customer = db.users.find(u => u.id === b.user_id) || {};
        const vehicle = db.vehicles.find(v => v.id === b.vehicle_id) || {};
        return { ...b, car_wash_name: wash.name, service_type: wash.service_type, customer_name: customer.name, customer_email: customer.email, vehicle_nickname: vehicle.nickname, vehicle_type: vehicle.vehicle_type };
      });
      list.sort((a, b) => (b.booking_date + b.booking_time).localeCompare(a.booking_date + a.booking_time));
      return { status: 200, data: list };
    }
    if (method === "PATCH" && seg[0] === "seller" && seg[1] === "bookings" && seg[3] === "status") {
      const user = requireSellerUser();
      const { status } = body;
      if (!["confirmed", "completed", "cancelled"].includes(status)) throw apiError("Not a valid status.");
      const bookingId = parseInt(seg[2], 10);
      const booking = db.bookings.find(b => b.id === bookingId);
      const wash = booking ? db.carWashes.find(w => w.id === booking.car_wash_id) : null;
      if (!booking || !wash || wash.owner_id !== user.id) throw apiError("Booking not found.", 404);

      if (status === "completed" && booking.status !== "completed") {
        booking.points_earned = wash.points_per_visit;
        const customer = db.users.find(u => u.id === booking.user_id);
        if (customer) customer.points_balance += wash.points_per_visit;
        db.pointTransactions.push({ id: db.nextId.pointTx++, user_id: booking.user_id, booking_id: booking.id, points: wash.points_per_visit, reason: `Wash completed at ${wash.name}`, created_at: new Date().toISOString() });
      }
      booking.status = status;
      saveDB(db);
      return { status: 200, data: booking };
    }
    if (method === "GET" && pathname === "/seller/stats") {
      const user = requireSellerUser();
      const ownedIds = new Set(db.carWashes.filter(w => w.owner_id === user.id).map(w => w.id));
      const owned = db.bookings.filter(b => ownedIds.has(b.car_wash_id));
      const today = new Date().toISOString().slice(0, 10);
      const cutoff = addDays(-30);
      const today_bookings = owned.filter(b => b.booking_date === today).length;
      const revenue_30d = owned.filter(b => b.status === "completed" && b.booking_date >= cutoff).reduce((s, b) => s + parseFloat(b.total_price), 0);
      const upcoming = owned.filter(b => b.status === "confirmed").length;
      const completed = owned.filter(b => b.status === "completed").length;
      return { status: 200, data: { today_bookings, revenue_30d, upcoming, completed } };
    }

    throw apiError(`Demo mode has no handler for ${method} ${pathname}`, 404);
  }
};

function enrichBooking(db, b) {
  const wash = db.carWashes.find(w => w.id === b.car_wash_id) || {};
  return { ...b, car_wash_name: wash.name, service_type: wash.service_type, location: wash.location };
}

// Only these two are meant to be used by the rest of the app (auth.js,
// and the "Try Demo" buttons on login.html).
window.DemoMode = DemoMode;
window.DemoAPI = DemoAPI;

})();
