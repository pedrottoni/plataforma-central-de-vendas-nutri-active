-- Supabase Migration: Initial Schema
-- Converted from SQLModel models in ADM/core/database/models.py

-- ============================================
-- USERS
-- ============================================
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  level INT NOT NULL DEFAULT 1,
  xp INT NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_users_username ON users (username);

-- ============================================
-- MISSIONS
-- ============================================
CREATE TABLE missions (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_reward INT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id BIGINT REFERENCES users(id)
);

CREATE INDEX idx_missions_user_id ON missions (user_id);

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  keywords TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  supplier_price NUMERIC NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  initial_stock INT NOT NULL DEFAULT 100,
  sku TEXT,
  shopee_id TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id BIGINT REFERENCES users(id)
);

CREATE INDEX idx_products_title ON products (title);
CREATE INDEX idx_products_user_id ON products (user_id);

-- ============================================
-- PRODUCT VARIATIONS
-- ============================================
CREATE TABLE productvariations (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  supplier_price NUMERIC NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  sku TEXT,
  shopee_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_productvariations_name ON productvariations (name);
CREATE INDEX idx_productvariations_product_id ON productvariations (product_id);

-- ============================================
-- INVENTORY ITEMS
-- ============================================
CREATE TABLE inventoryitem (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  supplier_price NUMERIC NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  initial_stock INT NOT NULL DEFAULT 100,
  min_stock INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id BIGINT REFERENCES users(id)
);

CREATE INDEX idx_inventoryitem_name ON inventoryitem (name);

-- ============================================
-- PRODUCT COMPONENTS (kits bridge)
-- ============================================
CREATE TABLE productcomponent (
  id BIGSERIAL PRIMARY KEY,
  quantity INT NOT NULL DEFAULT 1,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  inventory_item_id BIGINT NOT NULL REFERENCES inventoryitem(id)
);

-- ============================================
-- TRANSACTIONS
-- ============================================
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  product_id BIGINT REFERENCES products(id),
  quantity INT NOT NULL DEFAULT 1,
  user_id BIGINT REFERENCES users(id)
);

-- ============================================
-- COMPETITOR LISTINGS
-- ============================================
CREATE TABLE competitorlistings (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  marketplace TEXT NOT NULL,
  competitor_title TEXT NOT NULL,
  competitor_price NUMERIC NOT NULL,
  competitor_seller TEXT,
  our_price_at_time NUMERIC NOT NULL DEFAULT 0,
  price_before_discount NUMERIC,
  shipping_cost NUMERIC,
  product_url TEXT NOT NULL,
  marketplace_id TEXT,
  rating NUMERIC,
  sold_count INT,
  seller_location TEXT,
  is_confirmed_match BOOLEAN NOT NULL DEFAULT FALSE,
  confidence_score TEXT,
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_competitorlistings_product_id ON competitorlistings (product_id);
CREATE INDEX idx_competitorlistings_marketplace ON competitorlistings (marketplace);

-- ============================================
-- TASKS
-- ============================================
CREATE TABLE tasks (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority INT NOT NULL DEFAULT 3,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  auto_generated BOOLEAN NOT NULL DEFAULT TRUE,
  target_tab TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  user_id BIGINT REFERENCES users(id)
);
