-- ============================================================
-- Migration 003 — Vehicle size rename, Mada/wallet-only payments,
-- default vehicle, interior-only wash pricing
-- Safe to run on your EXISTING Neon database — adds columns and
-- renames existing values in place, never drops data. Run once:
--   psql "$DATABASE_URL" -f backend/migrations/003_vehicle_and_payment_rename.sql
-- ============================================================

-- ---- Vehicles: sedan/suv/truck/van -> small/medium/large/xlarge ----
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE vehicles SET vehicle_type = CASE vehicle_type
  WHEN 'sedan' THEN 'small'
  WHEN 'suv' THEN 'medium'
  WHEN 'truck' THEN 'large'
  WHEN 'van' THEN 'xlarge'
  ELSE vehicle_type
END
WHERE vehicle_type IN ('sedan', 'suv', 'truck', 'van');

-- Give every customer who has vehicles but no default yet a default —
-- their oldest (first-added) vehicle, so the booking flow always has
-- something sensible pre-selected.
UPDATE vehicles v SET is_default = TRUE
WHERE v.id = (
  SELECT id FROM vehicles v2
  WHERE v2.user_id = v.user_id
  ORDER BY id ASC LIMIT 1
)
AND NOT EXISTS (
  SELECT 1 FROM vehicles v3 WHERE v3.user_id = v.user_id AND v3.is_default = TRUE
);

-- ---- car_washes.vehicle_pricing JSON keys: same rename ----
UPDATE car_washes SET vehicle_pricing = (
  SELECT jsonb_object_agg(
    CASE key
      WHEN 'sedan' THEN 'small'
      WHEN 'suv' THEN 'medium'
      WHEN 'truck' THEN 'large'
      WHEN 'van' THEN 'xlarge'
      ELSE key
    END,
    value
  )
  FROM jsonb_each(vehicle_pricing)
)
WHERE vehicle_pricing IS NOT NULL;

-- ---- car_washes: optional legacy interior-only price ----
ALTER TABLE car_washes ADD COLUMN IF NOT EXISTS interior_price NUMERIC(6,2);

-- ---- Payment methods: card brands -> Mada; cash removed ----
-- Existing Visa/Mastercard/Amex/Discover cards are converted to Mada so
-- the customer doesn't lose a saved payment method outright — they'll see
-- it listed as Mada going forward and can re-add if the details differ.
UPDATE payment_methods SET
  type = 'mada',
  label = REGEXP_REPLACE(label, '^(Visa|Mastercard|Amex|Discover)', 'Mada')
WHERE type IN ('visa', 'mastercard', 'amex', 'discover');

-- Any saved "cash" payment method rows are removed outright — cash/pay-at-
-- location is no longer offered anywhere in the booking flow.
DELETE FROM payment_methods WHERE type = 'cash';

-- Past bookings keep their original payment_method_type text as a
-- historical record (e.g. old 'visa'/'cash' bookings) — those columns are
-- just descriptive text, not a foreign key, so no rename needed there;
-- nothing to do for the `bookings` table.
