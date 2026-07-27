-- ============================================================
-- Migration 002 — GPS pins, service-area radius, saved address
-- Safe to run on your EXISTING Neon database — it only ADDS
-- columns, it never drops data. Run once:
--   psql "$DATABASE_URL" -f backend/migrations/002_gps_and_addresses.sql
-- (Or paste the contents into the Neon SQL editor.)
-- ============================================================

-- Customers: one saved address, used automatically for moto-mobile bookings.
ALTER TABLE users ADD COLUMN IF NOT EXISTS saved_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS saved_address_lat NUMERIC(9,6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS saved_address_lng NUMERIC(9,6);

-- Car washes: a GPS pin for fixed 'location' washes, and a region-of-access
-- center point for 'home-service' / 'moto-mobile' washes (paired with the
-- existing service_radius_km column).
ALTER TABLE car_washes ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6);
ALTER TABLE car_washes ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6);
ALTER TABLE car_washes ADD COLUMN IF NOT EXISTS service_area_lat NUMERIC(9,6);
ALTER TABLE car_washes ADD COLUMN IF NOT EXISTS service_area_lng NUMERIC(9,6);

-- Bookings: the exact pin used for a mobile-service booking (either picked
-- fresh on the map for home-service, or copied from the customer's saved
-- address for moto-mobile).
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS address_lat NUMERIC(9,6);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS address_lng NUMERIC(9,6);
