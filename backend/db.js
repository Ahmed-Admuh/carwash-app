const { Pool } = require("pg");
// Note: no dotenv dependency — set these as real environment variables.
//
// Two ways this connects, checked in order:
// 1. DATABASE_URL — a single connection string, e.g. from Neon or Render
//    Postgres (looks like postgresql://user:pass@host/db?sslmode=require).
//    Cloud Postgres providers require SSL, so this path always enables it.
// 2. Individual DB_USER/DB_HOST/DB_NAME/DB_PASSWORD/DB_PORT vars — used for
//    plain local development against your own Postgres install.

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : new Pool({
      user: process.env.DB_USER || "postgres",
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "carwash",
      password: process.env.DB_PASSWORD || "",
      port: process.env.DB_PORT || 5432
    });

module.exports = pool;
