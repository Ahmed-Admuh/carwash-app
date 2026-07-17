# Car Wash Finder — Backend

A real Express + PostgreSQL API: signup/login, car washes (fixed locations + mobile
home/motorcycle services), bookings with live slot availability, offers, vehicles,
and payment methods.

> **Don't want to set any of this up right now?** The frontend has a
> **Demo Mode** (two buttons on the login page) that runs entirely in the
> browser with no backend or database at all — see the top-level
> `README.md`. Come back here when you want the real, persistent version.

## 1. Install PostgreSQL & create the database

```bash
# macOS (Homebrew)
brew install postgresql
brew services start postgresql

# then create the database
createdb carwash
```

## 2. Configure environment variables

There's no `dotenv` dependency here, so a `.env` file won't be read
automatically. See **CONFIG.md** for the full list of variables. Quickest
option — set them inline when starting the server:

```bash
cd backend
DB_PASSWORD=yourpassword JWT_SECRET=some-long-random-string npm start
```

(You can also just edit the fallback values directly in `db.js` and
`middleware/auth.js` for local development.)

**Important:** the old `db.js` had a real password hard-coded in it — that's
been removed in favor of environment variables.

## 3. Install dependencies

```bash
npm install
```

## 4. Create the tables

```bash
psql -U postgres -d carwash -f schema.sql
```

## 5. Seed sample data (car washes, offers, a demo login)

```bash
npm run seed
```

This creates two demo accounts you can log in with right away (password `demo1234` for both):

- **Customer:** demo.customer@carwash.app — has vehicles, payment methods, booking history, and 350 loyalty points already seeded.
- **Seller (wash owner):** demo.admin@carwash.app — owns two of the seeded washes; logs into the seller dashboard instead of the regular app.

It also seeds 6 fixed car wash locations, 2 mobile "van comes to your home" car
wash services, and 2 "moto-mobile" services (a motorcycle with a water tank
comes to you — it washes cars, not motorcycles), plus 5 offers.

## 6. Start the server

```bash
npm start
```

The API runs at `http://localhost:5000`. The frontend (`frontend/index.html` etc.)
is already wired to call it at that address — open the frontend files directly in
your browser, or serve them with any static file server.

## API overview

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | – | Create an account (customer or seller — sellers also create their first wash) |
| POST | `/api/auth/login` | – | Log in, returns a token (send `expectRole` to enforce customer vs seller login) |
| GET | `/api/auth/me` | ✓ | Current user + stats |
| GET | `/api/carwashes?type=location\|home-service\|moto-mobile` | – | List car washes |
| GET | `/api/carwashes/:id` | – | Car wash detail + add-ons |
| GET | `/api/carwashes/:id/slots?date=YYYY-MM-DD` | – | Time slots with live availability |
| GET | `/api/offers` | – | Active offers |
| GET / POST / DELETE | `/api/vehicles` | ✓ | Manage saved vehicles |
| GET / POST / DELETE | `/api/payment-methods` | ✓ | Manage saved payment methods |
| POST | `/api/bookings` | ✓ | Create a booking (price computed server-side) |
| GET | `/api/bookings` | ✓ | Order history |
| GET | `/api/bookings/:id` | ✓ | One booking |
| PATCH | `/api/bookings/:id/cancel` | ✓ | Cancel a booking |
| GET | `/api/points` | ✓ | Points balance, tiers, and history |
| POST | `/api/points/redeem` | ✓ | Redeem points for a reward tier |
| GET | `/api/reviews?carWashId=` | – | Reviews + average rating for a wash |
| GET | `/api/reviews/booking/:id` | ✓ | Booking + existing review, for the rating page |
| POST | `/api/reviews` | ✓ | Submit a review (only for a completed booking, once) |
| GET | `/api/seller/washes` | ✓ (seller) | The washes this seller owns |
| GET | `/api/seller/bookings` | ✓ (seller) | Bookings across owned washes |
| PATCH | `/api/seller/bookings/:id/status` | ✓ (seller) | Mark completed/cancelled — completing awards the customer's points |
| GET | `/api/seller/stats` | ✓ (seller) | Dashboard stats |

Auth routes return a `token` — send it back on every protected request as
`Authorization: Bearer <token>`. The frontend's `auth.js` already handles this.
