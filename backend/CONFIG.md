# Configuration

This backend reads configuration from real environment variables — there's no
`dotenv` dependency, so a `.env` file won't be picked up automatically.

## Variables

| Variable      | Default            | Purpose                                    |
|---------------|---------------------|---------------------------------------------|
| DB_USER       | postgres            | Postgres username                           |
| DB_HOST       | localhost            | Postgres host                               |
| DB_NAME       | carwash              | Postgres database name                      |
| DB_PASSWORD   | (empty)              | Postgres password                           |
| DB_PORT       | 5432                 | Postgres port                               |
| JWT_SECRET    | dev_secret_change_me | Used to sign login tokens — set a real one! |
| PORT          | 5000                 | Port the API server listens on              |

## How to set them

**Option A — inline, one-off:**
```bash
DB_PASSWORD=yourpassword JWT_SECRET=some-long-random-string npm start
```

**Option B — export for your shell session:**
```bash
export DB_PASSWORD=yourpassword
export JWT_SECRET=some-long-random-string
npm start
```

**Option C — edit the defaults directly:**
Open `db.js` and `middleware/auth.js` and change the fallback values in the
`process.env.X || "..."` lines. Fine for local development, not recommended
if you ever deploy this publicly.

If you'd like real `.env` file support, run `npm install dotenv` (requires
network access) and add `require("dotenv").config()` back to the top of
`server.js` and `db.js`.
