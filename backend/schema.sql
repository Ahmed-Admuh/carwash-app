-- ============================================================
-- Car Wash Finder — PostgreSQL schema (v3)
-- Run once against your local Postgres database, e.g.:
--   createdb carwash
--   psql -U postgres -d carwash -f schema.sql
--   npm run seed
-- ============================================================

DROP TABLE IF EXISTS reward_redemptions CASCADE;
DROP TABLE IF EXISTS point_transactions CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS addon_services CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS car_washes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- role: 'customer' | 'seller' (a seller owns one or more car_washes rows)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer',
  avatar_url TEXT,
  points_balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vehicles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  nickname VARCHAR(80),
  make VARCHAR(60),
  model VARCHAR(60),
  plate VARCHAR(20),
  vehicle_type VARCHAR(20) NOT NULL -- sedan | suv | truck | van
);

-- service_type:
--   'location'    fixed shop, customer drives there
--   'home-service' a van with a water tank comes to your home and washes your car
--   'moto-mobile'  a small motorcycle fitted with a water tank comes to your home —
--                  same idea as home-service but on two wheels: nimbler, cheaper,
--                  better for tight streets/parking, best suited to smaller cars.
--                  NOTE: this washes CARS, it does not wash motorcycles.
CREATE TABLE car_washes (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- the seller who manages this wash
  name VARCHAR(160) NOT NULL,
  service_type VARCHAR(24) NOT NULL DEFAULT 'location',
  location VARCHAR(160),
  address VARCHAR(200),
  distance_km NUMERIC(4,1) DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 4.5,        -- seed/starting rating; live average also derivable from reviews
  review_count INTEGER DEFAULT 0,
  wait_time_minutes INTEGER DEFAULT 15,
  exterior_price NUMERIC(6,2) NOT NULL,
  full_wash_addon NUMERIC(6,2) NOT NULL DEFAULT 0,
  concurrent_slots INTEGER DEFAULT 2,      -- how many bookings can share one time slot
  slot_interval_minutes INTEGER DEFAULT 15, -- gap between bookable times, seller-configurable
  service_radius_km NUMERIC(4,1),
  points_per_visit INTEGER NOT NULL DEFAULT 10, -- legacy flat value, kept for old data; points_rate below is used now
  points_rate NUMERIC(4,2) NOT NULL DEFAULT 1.0, -- points earned per 1 SAR spent — pricier washes naturally earn more
  auto_accept BOOLEAN NOT NULL DEFAULT true, -- true: bookings confirm instantly; false: seller must accept each one
  -- vehicle_pricing shape: { "sedan": {"exterior":15,"full":22}, "suv": {...}, "truck": {...}, "van": {...} }
  -- The seller sets a real price per vehicle type directly (no more fixed
  -- global surcharge added on top) — moto-mobile washes only need
  -- sedan/suv keys since they can't service larger vehicles. NULL means
  -- this wash hasn't been migrated to per-vehicle pricing yet — the app
  -- falls back to exterior_price/full_wash_addon plus a flat legacy
  -- surcharge in that case, for old data only.
  vehicle_pricing JSONB,
  require_cash_only BOOLEAN NOT NULL DEFAULT false, -- seller can force in-person cash payment only
  -- operating_hours shape: { "is24_7": bool, "schedule": { "monday": [{"open":"09:00","close":"11:00"}, ...], ... } }
  -- multiple periods per day are supported (e.g. morning + afternoon with a midday closure).
  operating_hours JSONB NOT NULL DEFAULT '{"is24_7": true, "schedule": {}}',
  gallery_images JSONB NOT NULL DEFAULT '[]', -- extra photos for the wash's About page
  image_url TEXT,
  description TEXT
);

CREATE TABLE addon_services (
  id SERIAL PRIMARY KEY,
  car_wash_id INTEGER REFERENCES car_washes(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  price NUMERIC(6,2) NOT NULL,
  applies_to VARCHAR(20) DEFAULT 'both' -- 'exterior' | 'full' | 'both'
);

CREATE TABLE offers (
  id SERIAL PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(40) DEFAULT 'fa-gift',
  discount_text VARCHAR(60),
  scope VARCHAR(20) NOT NULL DEFAULT 'app-only', -- 'app-only' | 'nationwide'
  expires_at DATE
);

CREATE TABLE payment_methods (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- 'visa' | 'mastercard' | 'amex' | 'discover' | 'apple-pay' ('cash' is handled per-booking, not saved here)
  last4 VARCHAR(4),
  label VARCHAR(80),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, type, last4) -- prevents adding the exact same card twice
);

CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  booking_ref VARCHAR(20) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  car_wash_id INTEGER REFERENCES car_washes(id),
  vehicle_id INTEGER REFERENCES vehicles(id),
  wash_type VARCHAR(20) NOT NULL, -- 'exterior' | 'full'
  addons JSONB DEFAULT '[]',
  booking_date DATE NOT NULL,
  booking_time VARCHAR(10) NOT NULL,
  base_price NUMERIC(6,2) NOT NULL,
  addons_price NUMERIC(6,2) NOT NULL DEFAULT 0,
  tax NUMERIC(6,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(6,2) NOT NULL,
  payment_method_id INTEGER REFERENCES payment_methods(id), -- null for cash
  payment_method_type VARCHAR(20) NOT NULL DEFAULT 'cash',  -- denormalized copy, always set, incl. 'cash'
  payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid',     -- 'unpaid' | 'paid' | 'refunded'
  address TEXT,
  special_requests TEXT,
  points_earned INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'confirmed', -- 'pending' | 'confirmed' | 'completed' | 'cancelled'
  cancelled_by VARCHAR(20),               -- 'customer' | 'seller', null unless cancelled
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  car_wash_id INTEGER REFERENCES car_washes(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE point_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  points INTEGER NOT NULL, -- positive = earned, negative = redeemed
  reason VARCHAR(160) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reward_redemptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  tier_points INTEGER NOT NULL,     -- e.g. 500, 1000, 1500
  reward_label VARCHAR(120) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  redeemed_at TIMESTAMP DEFAULT NOW(),
  used BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_carwash_date ON bookings(car_wash_id, booking_date);
CREATE INDEX idx_addons_carwash ON addon_services(car_wash_id);
CREATE INDEX idx_vehicles_user ON vehicles(user_id);
CREATE INDEX idx_carwashes_owner ON car_washes(owner_id);
CREATE INDEX idx_reviews_carwash ON reviews(car_wash_id);
CREATE INDEX idx_point_tx_user ON point_transactions(user_id);

-- Seed data lives in seed.js (run `npm run seed` after this file).
