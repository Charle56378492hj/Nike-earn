-- ============================================================
-- Cachvio — Gaming Rewards Platform
-- Complete Database Schema (PostgreSQL / Supabase)
-- Generated from Drizzle ORM schema definitions.
-- This script is idempotent: it is safe to run multiple times.
-- ============================================================

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE IF NOT EXISTS user_status AS ENUM ('active', 'disabled', 'unverified');

CREATE TYPE IF NOT EXISTS admin_role AS ENUM ('admin', 'super_admin');

CREATE TYPE IF NOT EXISTS transaction_type AS ENUM ('earning', 'withdrawal', 'adjustment', 'refund');

CREATE TYPE IF NOT EXISTS transaction_status AS ENUM ('completed', 'pending', 'failed');

CREATE TYPE IF NOT EXISTS withdrawal_network AS ENUM ('BEP20', 'TRC20', 'SHAM_CASH', 'SYRIATEL_CASH', 'COENEX_EMAIL');

CREATE TYPE IF NOT EXISTS withdrawal_status AS ENUM ('pending', 'approved', 'rejected', 'paid');

CREATE TYPE IF NOT EXISTS platform_placement AS ENUM ('homepage', 'sidebar', 'dedicated');

-- ============================================================
-- TABLES
-- ============================================================

-- ------------------------------------------------------------
-- Users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  username        TEXT NOT NULL UNIQUE,
  password_hash   TEXT,
  status          user_status NOT NULL DEFAULT 'unverified',
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Balances
-- One row per user (1:1 relationship)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS balances (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance         NUMERIC(20, 8) NOT NULL DEFAULT 0,
  total_earned    NUMERIC(20, 8) NOT NULL DEFAULT 0,
  total_withdrawn NUMERIC(20, 8) NOT NULL DEFAULT 0,
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Transactions
-- Every balance-affecting event (earnings, withdrawals, adjustments, refunds)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type           transaction_type NOT NULL,
  amount         NUMERIC(20, 8) NOT NULL,
  balance_before NUMERIC(20, 8) NOT NULL,
  balance_after  NUMERIC(20, 8) NOT NULL,
  description    TEXT NOT NULL,
  status         transaction_status NOT NULL DEFAULT 'completed',
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Withdrawals
-- User cash-out requests
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS withdrawals (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount         NUMERIC(20, 8) NOT NULL,
  network        withdrawal_network NOT NULL,
  wallet_address TEXT NOT NULL,
  status         withdrawal_status NOT NULL DEFAULT 'pending',
  admin_note     TEXT,
  tx_hash        TEXT,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Platforms (Offerwalls)
-- Configured offerwall providers with optional postback param overrides
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platforms (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  description    TEXT,
  logo_url       TEXT,
  api_key        TEXT,
  api_endpoint   TEXT,
  secret_key     TEXT,
  placement      platform_placement NOT NULL DEFAULT 'dedicated',
  is_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  param_user_id  TEXT,
  param_amount   TEXT,
  param_txid     TEXT,
  param_status   TEXT,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Admins
-- Privileged users with role-based access
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  role        admin_role NOT NULL DEFAULT 'admin',
  permissions TEXT[] NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Email Verifications
-- Temporary codes for verifying new user sign-ups
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_verifications (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL,
  username   TEXT NOT NULL,
  code       TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Password Resets
-- Single-use tokens for password recovery
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_resets (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_transactions_user_id    ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status     ON transactions(status);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id    ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status     ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_balances_user_id ON balances(user_id);

CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_role    ON admins(role);

CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_used  ON email_verifications(used);

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_user  ON password_resets(user_id);

CREATE INDEX IF NOT EXISTS idx_platforms_is_enabled ON platforms(is_enabled);
CREATE INDEX IF NOT EXISTS idx_platforms_placement  ON platforms(placement);

CREATE INDEX IF NOT EXISTS idx_users_status    ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email     ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username  ON users(username);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- Auto-update the updated_at column on row modification
-- for tables that track it (users, balances, withdrawals,
-- platforms, admins).
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_balances_updated_at ON balances;
CREATE TRIGGER trg_balances_updated_at
  BEFORE UPDATE ON balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_withdrawals_updated_at ON withdrawals;
CREATE TRIGGER trg_withdrawals_updated_at
  BEFORE UPDATE ON withdrawals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_platforms_updated_at ON platforms;
CREATE TRIGGER trg_platforms_updated_at
  BEFORE UPDATE ON platforms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_admins_updated_at ON admins;
CREATE TRIGGER trg_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- END OF SCHEMA
-- ============================================================
