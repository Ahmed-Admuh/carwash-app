-- ============================================================
-- Migration 004 — clear the old hardcoded "Comes to your home"
-- default location text
--
-- Previously, mobile-service washes that didn't set a custom location
-- got "Comes to your home" written into the database as plain English —
-- which could never be translated to Arabic since it was just stored
-- data, not app text. The frontend now shows a properly translated
-- fallback ("Comes to you" / "يأتي إليك") whenever location is empty, so
-- this clears the old hardcoded text back to empty for existing rows.
-- Safe to run on your existing Neon database — only affects this one
-- default string, nothing else.
--   psql "$DATABASE_URL" -f backend/migrations/004_clear_default_location_text.sql
-- ============================================================

UPDATE car_washes
SET location = NULL
WHERE location = 'Comes to your home';
