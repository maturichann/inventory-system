-- order_itemsに備考欄を追加
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS notes TEXT;
