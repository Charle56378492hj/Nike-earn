-- ============================================================
-- Gaming Rewards Platform — Database Migration
-- Run this SQL against your Supabase database to create all tables.
-- You can also use: npm run db:push (with DATABASE_URL set)
-- ============================================================

-- Enums
CREATE TYPE IF NOT EXISTS user_status AS ENUM ('active', 'disabled', 'unverified');
CREATE TYPE IF NOT EXISTS admin_role AS ENUM ('admin', 'super_admin');
CREATE TYPE IF NOT EXISTS transaction_type AS ENUM ('earning', 'withdrawal', 'adjustment', 'refund');
CREATE TYPE IF NOT EXISTS transaction_status AS ENUM ('completed', 'pending', 'failed');
CREATE TYPE IF NOT EXISTS withdrawal_network AS ENUM ('BEP20', 'TRC20');
CREATE TYPE IF NOT EXISTS withdrawal_status AS ENUM ('pending', 'approved', 'rejected', 'paid');
CREATE TYPE IF NOT EXISTS platform_placement AS ENUM ('homepage', 'sidebar', 'dedicated');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  username   TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  status     user_status NOT NULL DEFAULT 'unverified',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Balances table
CREATE TABLE IF NOT EXISTS balances (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance         NUMERIC(20, 8) NOT NULL DEFAULT 0,
  total_earned    NUMERIC(20, 8) NOT NULL DEFAULT 0,
  total_withdrawn NUMERIC(20, 8) NOT NULL DEFAULT 0,
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Transactions table
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

-- Withdrawals table
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

-- Platforms (offerwalls) table
CREATE TABLE IF NOT EXISTS platforms (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT,
  logo_url     TEXT,
  api_key      TEXT,
  api_endpoint TEXT,
  secret_key   TEXT,
  placement    platform_placement NOT NULL DEFAULT 'dedicated',
  is_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  role        admin_role NOT NULL DEFAULT 'admin',
  permissions TEXT[] NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Email verifications table
CREATE TABLE IF NOT EXISTS email_verifications (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL,
  username   TEXT NOT NULL,
  code       TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Password resets table
CREATE TABLE IF NOT EXISTS password_resets (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);

-- ============================================================
-- Postback param customization — safe additive migration
-- ============================================================
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS param_user_id TEXT;
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS param_amount   TEXT;
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS param_txid     TEXT;
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS param_status   TEXT;
