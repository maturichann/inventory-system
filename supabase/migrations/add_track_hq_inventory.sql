-- ============================================
-- 本部在庫管理フラグの追加
-- ============================================
-- Supabase Dashboard > SQL Editor で実行してください

-- 商品テーブルに本部在庫管理フラグを追加
ALTER TABLE products ADD COLUMN IF NOT EXISTS track_hq_inventory BOOLEAN DEFAULT true;

-- 既存商品は全てtrueに設定
UPDATE products SET track_hq_inventory = true WHERE track_hq_inventory IS NULL;

-- コメント追加
COMMENT ON COLUMN products.track_hq_inventory IS '本部在庫を管理するかどうか（falseの場合は常に仕入先対応）';
