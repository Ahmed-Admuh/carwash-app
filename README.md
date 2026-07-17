# Car Wash Finder

A car wash discovery & booking app — fixed-location car washes, mobile "comes
to your home" vans, and moto-mobile washes (a motorcycle with a water tank
that comes to you) — with real user accounts (customers and wash owners),
loyalty points, ratings, and a PostgreSQL-backed database. Available in
English and Arabic.

```
carwash-app/
├── frontend/     Plain HTML/CSS/JS — open directly in a browser, or serve statically
└── backend/      Express + PostgreSQL API
```

## Quick start

1. **Backend first** — see `backend/README.md` for full setup (install
   Postgres, create the DB, run `schema.sql`, seed sample data, start the
   server on `localhost:5000`). There's a demo login pre-seeded:
   `demo.customer@carwash.app` / `demo1234` (customer) or `demo.admin@carwash.app` / `demo1234` (seller/wash owner).
2. **Then the frontend** — open `frontend/index.html` in your browser (or
   serve the `frontend/` folder with any static file server — e.g.
   `npx serve frontend`). It's already pointed at `http://localhost:5000/api`.

If the backend isn't running, most pages will still render using built-in
sample data so you can see the design — but signup, login, real bookings,
and order history all require the backend + database to be up.

## Newest: Bug fixes + real seller controls (this round)

### Fixed
- **The new Riyal symbol didn't render on some browsers** (reported on
  Samsung Internet). There's no reliable way to feature-detect font
  support for a brand-new Unicode character across every browser, so
  rather than risk a broken glyph in front of customers, prices now show
  plain **"SAR" text** everywhere — guaranteed to render correctly on any
  device.
- **"Add Payment Method" on the booking page silently did nothing.** Root
  cause: the button's click listener was being attached before the button
  actually existed in the page (it's inserted dynamically after the wash
  data loads) — this threw an error that also silently broke the modal's
  close button and form submission. Fixed by attaching the listeners at
  the right time.
- **Seller settings couldn't be changed after signup.** Every wash place
  now has a real **"Edit Settings"** button in the Seller Dashboard,
  opening the same form used at signup, pre-filled with current values —
  pricing, hours, extras, everything.
- **Payment method defaults were stuck once set.** Added a real "Set as
  Default" button next to any non-default saved payment method.

### New
- **Store owners now set their own price per vehicle size** — sedan, SUV,
  truck, van each get their own exterior/full price, no fixed markup added
  on top. This replaces the old flat surcharge model going forward (older
  washes that haven't been edited yet still work via the old model
  automatically, so nothing broke).
- **A booked/unbooked time slots table** — "View Time Slots" on any wash
  shows a color-coded grid (green/amber/red) for any date, so a seller can
  see at a glance which times are open, partially booked, or full.
- **Cash-only mode** — a seller can force in-person cash payment only for
  a wash; the booking page then only offers Cash, with a clear notice
  explaining why.
- **A dropdown of common extras** (Tire Shine, Wax Coating, Ceramic
  Coating, etc.) when adding services, with a "Custom…" option for
  anything not listed — faster than typing from scratch, without forcing
  any particular pricing.

### Explicitly deferred (as requested)
- **Google Maps location picking** — this needs a Google Maps API key,
  which isn't something to set up without you providing your own key. The
  address/location fields remain plain text inputs for now; wiring in a
  real map picker is a quick follow-up once you have a key.

## Newest: Launch-readiness round (payments, currency, points, and seller controls)

This was a big one — getting the app ready for real customers and real wash
businesses to try.

### Customer side
- **Add a payment method from the booking page itself**, not just from
  Profile — there's now an "Add Payment Method" button right in the
  checkout flow.
- **Cash is a real payment option** — always available alongside saved
  cards, no setup needed. Cash bookings are marked "unpaid" until the wash
  place marks them complete (that's when the money actually changes
  hands).
- **Payment status is now visible** on the booking confirmation page and in
  your order history (Paid / Unpaid — pay on arrival / Refunded).
- **Currency changed to Saudi Riyal (SAR)** throughout, using the new
  official Riyal symbol (Unicode `U+20C1`, approved by SAMA in Feb 2025,
  added to Unicode 17.0 in Sept 2025). Since it's a very new character with
  uneven font support, every price also carries a screen-reader-only "SAR"
  label as a safety net.
- **Loyalty points now scale with what you actually pay**, not a flat
  amount per wash — a pricier wash (or a wash with a higher points rate)
  earns more. Points are awarded the moment money changes hands (instantly
  for cards, at completion for cash) and are **automatically reversed** if
  a paid booking gets cancelled.

### Seller side — this got a real overhaul
- **Operating hours with multiple periods per day** (e.g. open 9-11am,
  closed, open again 3pm-midnight) or a simple **Open 24/7** toggle, set at
  signup and editable later. A live "Open now" badge shows on the seller's
  own wash cards, and customers can now filter Book results to **Open Now**
  only.
- **Add more than one wash place** — sellers aren't limited to the single
  business they signed up with; there's a real "Add Wash Place" flow in
  the dashboard with its own pricing, hours, and extras.
- **Accept or decline bookings** — turning off "auto-accept" means new
  bookings start as "pending" until the seller explicitly accepts them;
  declining lets the seller leave a reason, which the customer sees.
- **Revenue and booking stats, filterable by day** — the dashboard defaults
  to a 30-day overview, or pick any specific date for that day's
  breakdown (pending/confirmed/completed/cancelled counts and revenue).
- **Full pricing and extras configuration at signup** — exterior price, the
  upgrade cost for Exterior + Interior, and an open-ended list of optional
  extras (only what a seller actually adds shows up on the customer side —
  nothing forced).
- **Slot configuration at signup** — how many bookings fit in one time
  slot, and how many minutes apart slots are, both seller-configurable
  instead of fixed defaults.

### Known simplifications (given the scope of this round)
- The hours editor applies **the same schedule to every day of the week**
  rather than letting each day differ independently — the multi-period
  part (the actual "9-11am then 3pm-midnight" scenario) works fully; true
  per-day-of-week variation would need a bigger UI and wasn't built this
  round.
- **Photo galleries** for wash profiles: the data model supports it
  (`gallery_images` on each wash), but there's no dashboard UI yet to
  manage photos beyond the single main image — happy to add this next if
  useful.
- Demo Mode (`js/demo-mode.js`) mirrors all of the above faithfully, so
  everything above works identically with zero backend running.

## Newest: Demo Mode (no server or database needed)

There's now a real way to try the whole app with **zero setup** — no
Postgres, no `npm start`, nothing. On the login page, two buttons —
**"Explore as Customer"** and **"Explore as Wash Owner"** — log you
straight in against a mock backend that runs entirely in your browser
(`frontend/js/demo-mode.js`), backed by `localStorage` instead of a real
database.

- **14 test wash places** across all three service types (8 fixed
  locations spanning budget to ultra-premium, 3 home-service vans, 3
  moto-mobile) — more variety than the real seed data, specifically so
  there's plenty to click through.
- The demo seller account owns **6 of those 14**, spanning all three
  service types and price tiers, so the Seller Dashboard has real variety
  to manage and test (mark bookings completed, watch points get awarded,
  etc.) without needing multiple accounts.
- Bookings, added vehicles, redeemed points, and so on **do persist** —
  but only in that browser's `localStorage`, not anywhere real. Reloading
  the page keeps your changes; a different browser or device starts fresh.
- A banner across the top of every page while demo mode is active makes
  it unmistakable that nothing here touches a real server — with a one-tap
  "Exit demo" that logs out and returns you to normal mode.
- **Important implementation note:** `demo-mode.js` is wrapped in an IIFE
  specifically so its internal variable names can't collide with each
  page's own inline `<script>` (classic `<script>` tags on the same page
  share one top-level scope for `const`/`let` — without the wrapper, a
  page that happened to declare something with the same name, like
  `booking-details.html`'s own `TAX_RATE`, would throw a `SyntaxError` and
  break the entire page). Verified by combining every page's full script
  set and syntax-checking the result.

## Newest: Points ring on the home page

Logged-in customers now see a small circular progress ring near the top of
the home page — current points balance in the center, filled proportional
to progress toward the next reward tier. Tapping it jumps to Profile →
Points & Rewards. Not shown for logged-out visitors or seller accounts
(points are a customer-facing feature).

## Latest round of changes

- **Fixed a serious seed.js bug**: re-running `npm run seed` after any
  bookings existed would crash partway through (a foreign-key ordering
  issue), silently leaving car washes and/or demo accounts missing or
  broken. This is very likely what caused "no sample stores" and login
  failures. The whole database is now cleared with a single
  `TRUNCATE ... CASCADE` at the start of seeding, which is genuinely safe to
  re-run any number of times — the seed script also now prints progress as
  it goes, so if anything ever does fail, you'll see exactly which step.
- **Working hamburger menu**: the menu button on the home page now opens a
  real slide-out drawer with links to Home, Search, About, Profile/Login,
  Order History, and (for sellers) the Seller Dashboard — this is also what
  makes the About page reachable from anywhere. Bottom navigation was also
  fixed on a few pages that either had a dead "Saved" link or no navigation
  at all (`book.html` had none).
- **New package/subscription-style offers**: a "Monthly Value Pack" (4
  washes in a month, 15% off) and a "Bi-Weekly Shine Plan" (2 washes, 10%
  off) were added to the Offers system — a common, proven car-wash business
  model for locking in repeat visits. These work through the existing
  offers/discount system rather than a full recurring-billing engine, which
  would be a much larger undertaking.
- **Comprehensive Arabic translation**: see the coverage note below — this
  went from "the basics" to essentially the entire app, including forms,
  validation, confirmations, and toasts.

## Earlier round of changes

- **Fixed the moto-mobile concept**: it's now correctly a motorcycle fitted
  with a water tank that comes and washes your **car** (best for sedans/SUVs
  — nimbler and cheaper than a van, great for tight streets) — not a service
  that washes motorcycles.
- **Two account types**: customers and wash owners ("sellers") now sign up
  and log in separately, with a toggle on both the login and signup pages.
  Sellers get their own **Seller Dashboard** (`seller-dashboard.html`)
  showing only their own washes' bookings and stats — nothing bleeds across
  owners.
- **Better login/signup validation**: real inline field errors (invalid
  email, short password, empty fields) instead of just a generic failure,
  plus a much more robust demo-account reset in `seed.js` so re-running
  `npm run seed` always restores working demo logins.
- **Two demo accounts** instead of one: a customer (with sample vehicles,
  payment methods, booking history, and 350 points already seeded) and a
  seller (owning two of the seeded washes) — see `backend/README.md`.
- **Fixed Add Payment Method**: previously it only ever added Apple Pay.
  Now there's a real modal to choose Visa/Mastercard/Amex/Discover/Apple Pay,
  with duplicate protection (both at the database level and a friendly error
  message).
- **Fixed Add Vehicle**: previously it just redirected into the booking flow.
  Now there's a real modal on the Profile page to add a vehicle directly,
  plus delete buttons for vehicles and payment methods.
- **Loyalty points system**: every wash place earns a different number of
  points per completed visit (set in `car_washes.points_per_visit`). Points
  accumulate in Profile → Points & Rewards, with tiered rewards (500 → free
  basic wash, 1000 → free full detail, 1500 → $25 off mobile service, 2500 →
  free premium detail + a month of priority booking). Redeeming issues a
  one-time coupon code.
- **Ratings**: after a booking is marked "completed" (by the seller, from
  their dashboard), the customer gets a "Rate this wash" link in their order
  history leading to a dedicated star-rating page (`rate-wash.html`). Ratings
  feed into each wash's live average, shown on its new About page.
- **New pages**: `about.html` (app-wide About Us), `wash-about.html` (each
  wash's own about page with live reviews, reachable from booking history
  and search results), and `rate-wash.html`.
- **Arabic support**: a language toggle (top-right of most pages) switches
  the whole app between English and Arabic, including right-to-left layout.
  Navigation, auth pages, and major headings are fully translated; some
  deeper dynamic content (e.g. live booking details) is partially covered —
  see the note below.

## What changed in the previous pass

- **Real accounts**: signup/login pages, JWT-based sessions, passwords hashed
  with bcrypt, all stored in Postgres.
- **Real persistence**: bookings, vehicles, and payment methods are written
  to the database and read back on every page load — nothing is hard-coded
  anymore.
- **New service types**: alongside fixed car wash locations, you can now book
  a **mobile car wash** (a van comes to your home) or a **mobile motorcycle
  wash**, each with their own pricing and add-ons, and an address field for
  where the technician should go.
- **Reworked booking flow**: vehicle type is chosen first, and the two big
  wash options — *Exterior Only* and *Exterior + Interior* — show prices that
  already reflect the selected vehicle, instead of adding a surcharge at the
  bottom. Extras (tire shine, undercarriage wash, wax, etc.) are separate,
  smaller add-ons.
- **15-minute slots, 2 at a time**: fixed-location car washes offer
  appointments every 15 minutes with 2 concurrent bookings per slot; mobile
  services use longer intervals since one technician can only be in one
  place.
- **Apple Pay** added alongside Visa/Mastercard as a payment method.
- **Working order history**: your Profile page now pulls real bookings from
  the database, including the ability to cancel a confirmed booking.
- **Offers with detail**: tapping an offer pops up its description, expiry
  date (if any), and whether it's an app-exclusive or nationwide promotion.
- **New hero imagery**: five carousel slides — a mix of real photography and
  on-brand promotional slides — instead of the original three generic photos.
- **Packages are clickable**: each package card routes into the booking flow
  pre-filtered to the right service type.

## Notes & things worth knowing

- Passwords are hashed with bcrypt; nothing sensitive is stored in plain
  text. `JWT_SECRET` should be changed from its default before you show this
  to anyone else — see `backend/CONFIG.md`.
- This backend doesn't use `dotenv` (it wasn't available in this sandbox to
  install) — environment variables are read directly from `process.env` with
  sensible local-dev fallbacks. `backend/CONFIG.md` explains how to set them.
- The admin dashboard (`frontend/admin-dashboard.html`) is still using mock
  data from the earlier design pass — it wasn't part of this round of
  changes either, so it's untouched. The new **Seller Dashboard**
  (`seller-dashboard.html`) is the real, API-wired equivalent for wash
  owners; happy to retire or wire up the old admin page next if useful.
- **Arabic coverage**: essentially the entire app now translates, including
  validation messages, confirmation dialogs, toast notifications, empty
  states, and modal forms — 276 dictionary entries in `js/i18n.js`. A small,
  fixed set of add-on service names (Tire Shine, Wax Coating, etc.) and
  reward tier labels are translated via lookup tables too, since there are
  only a handful of them. What stays in English: car wash business names
  (proper nouns, like any brand name), payment brand names (Visa,
  Mastercard, Apple Pay), and free-text the user typed themselves (review
  comments, addresses, special requests) — translating that would mean
  machine-translating user content, not the UI.
- **Points are awarded when a seller marks a booking "completed"** (from the
  Seller Dashboard) — not automatically at booking time — since points
  should reflect a wash that actually happened. The demo customer account
  has some pre-seeded completed bookings/points so you can see the Points &
  Rewards UI without needing to complete that flow yourself first.
