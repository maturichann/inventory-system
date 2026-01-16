-- ============================================
-- 在庫管理・発注システム データベーススキーマ
-- ============================================

-- 店舗マスター
CREATE TABLE stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_code VARCHAR(50) UNIQUE NOT NULL,
  store_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- メーカーマスター
CREATE TABLE makers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_code VARCHAR(50) NOT NULL,
  maker_name VARCHAR(255) NOT NULL,
  order_category VARCHAR(100), -- 発注区分
  minimum_order INT DEFAULT 1, -- 最低発注数
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 担当者マスター（浅野さん、金本さんなど）
CREATE TABLE staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'staff', -- admin, staff
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 商品カテゴリ（大分類：コーティング、マスカラ、エクステ等）
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_extension BOOLEAN DEFAULT false, -- エクステかどうか（自動振り分け用）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 商品マスター
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  maker_id UUID REFERENCES makers(id),
  category_id UUID REFERENCES categories(id),
  product_code VARCHAR(100) UNIQUE NOT NULL,
  -- 柔軟な8階層構造
  level1 VARCHAR(255), -- 第1階層
  level2 VARCHAR(255), -- 第2階層
  level3 VARCHAR(255), -- 第3階層
  level4 VARCHAR(255), -- 第4階層
  level5 VARCHAR(255), -- 第5階層
  level6 VARCHAR(255), -- 第6階層
  level7 VARCHAR(255), -- 第7階層
  level8 VARCHAR(255), -- 第8階層
  product_name VARCHAR(500) NOT NULL, -- 商品名（自動生成または手動）
  unit_price DECIMAL(10,2) DEFAULT 0, -- 単価
  cost_price DECIMAL(10,2) DEFAULT 0, -- 原価
  supplier VARCHAR(255), -- 仕入れ先
  notes TEXT, -- メモ
  -- 担当者設定（商品ごとにラベル）
  assigned_staff_id UUID REFERENCES staff(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 本部在庫
CREATE TABLE hq_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) UNIQUE NOT NULL,
  quantity INT DEFAULT 0, -- 現在の在庫数
  threshold INT DEFAULT 5, -- 閾値（これを下回るとアラート）
  last_updated_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 在庫変動履歴
CREATE TABLE inventory_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) NOT NULL,
  change_type VARCHAR(50) NOT NULL, -- 'in'入庫, 'out'出庫, 'adjust'調整
  quantity INT NOT NULL, -- 変動数（＋/−）
  previous_quantity INT NOT NULL, -- 変動前の在庫数
  new_quantity INT NOT NULL, -- 変動後の在庫数
  reason TEXT, -- 理由
  order_id UUID, -- 関連する発注ID（後で参照）
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 発注（店舗からの発注）
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  store_id UUID REFERENCES stores(id) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, cancelled
  assigned_staff_id UUID REFERENCES staff(id), -- 担当者
  assignment_type VARCHAR(50), -- 'auto'自動, 'manual'手動
  notes TEXT,
  order_date TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 発注明細
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2),
  -- 発注時点の在庫状況
  hq_stock_at_order INT, -- 発注時の本部在庫
  fulfilled_from VARCHAR(50), -- 'hq'本部在庫, 'supplier'仕入れ先
  status VARCHAR(50) DEFAULT 'pending', -- pending, shipped, delivered
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 仕入れ発注（本部からメーカーへの発注）
CREATE TABLE supplier_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  maker_id UUID REFERENCES makers(id) NOT NULL,
  assigned_staff_id UUID REFERENCES staff(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, ordered, received, cancelled
  total_amount DECIMAL(12,2),
  notes TEXT,
  order_date TIMESTAMPTZ DEFAULT NOW(),
  expected_date TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 仕入れ発注明細
CREATE TABLE supplier_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_order_id UUID REFERENCES supplier_orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  quantity INT NOT NULL,
  unit_cost DECIMAL(10,2),
  received_quantity INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- インデックス
-- ============================================
CREATE INDEX idx_products_maker ON products(maker_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_code ON products(product_code);
CREATE INDEX idx_hq_inventory_product ON hq_inventory(product_id);
CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_inventory_history_product ON inventory_history(product_id);

-- ============================================
-- ビュー
-- ============================================

-- 在庫アラートビュー（閾値を下回っている商品）
CREATE VIEW low_stock_alert AS
SELECT
  p.id AS product_id,
  p.product_code,
  p.product_name,
  p.level1,
  p.level2,
  p.level3,
  m.maker_name,
  c.name AS category_name,
  hi.quantity AS current_stock,
  hi.threshold,
  s.name AS assigned_staff_name
FROM products p
JOIN hq_inventory hi ON p.id = hi.product_id
LEFT JOIN makers m ON p.maker_id = m.id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN staff s ON p.assigned_staff_id = s.id
WHERE hi.quantity <= hi.threshold
  AND p.is_active = true;

-- ============================================
-- 関数・トリガー
-- ============================================

-- updated_at自動更新
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルにトリガー適用
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_makers_updated_at BEFORE UPDATE ON makers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_hq_inventory_updated_at BEFORE UPDATE ON hq_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_supplier_orders_updated_at BEFORE UPDATE ON supplier_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_supplier_order_items_updated_at BEFORE UPDATE ON supplier_order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 発注番号自動生成関数
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS order_seq START 1;
CREATE TRIGGER generate_order_number_trigger BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- 仕入れ発注番号自動生成
CREATE OR REPLACE FUNCTION generate_supplier_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'SUP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('supplier_order_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS supplier_order_seq START 1;
CREATE TRIGGER generate_supplier_order_number_trigger BEFORE INSERT ON supplier_orders FOR EACH ROW EXECUTE FUNCTION generate_supplier_order_number();

-- ============================================
-- 初期データ
-- ============================================

-- カテゴリ（大分類）
INSERT INTO categories (name, description, is_extension, sort_order) VALUES
('コーティング', 'コーティング剤', false, 1),
('マスカラ', 'マスカラ類', false, 2),
('エクステ', 'まつげエクステンション', true, 3),
('ラッシュアディクト', 'ラッシュアディクト製品', false, 4),
('エグータム', 'エグータム製品', false, 5),
('クレンジング', 'クレンジング製品', false, 6);

-- 担当者（初期）
INSERT INTO staff (name, email, role) VALUES
('浅野', 'asano@example.com', 'admin'),
('金本', 'kanemoto@example.com', 'staff');
