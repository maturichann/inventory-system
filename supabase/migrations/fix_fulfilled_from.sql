-- ============================================
-- 既存発注データのfulfilled_from修正
-- ============================================
-- Supabase Dashboard > SQL Editor で実行してください

-- 1. NULLのfulfilled_fromを在庫状況に基づいて更新
UPDATE order_items oi
SET fulfilled_from = CASE
  -- 商品がtrack_hq_inventory = falseなら仕入先
  WHEN p.track_hq_inventory = false THEN 'supplier'
  -- 本部在庫がある場合は本部から
  WHEN COALESCE(hi.quantity, 0) >= oi.quantity THEN 'hq'
  -- それ以外は仕入先
  ELSE 'supplier'
END
FROM products p
LEFT JOIN hq_inventory hi ON hi.product_id = p.id
WHERE oi.product_id = p.id
  AND oi.fulfilled_from IS NULL;

-- 2. 確認
SELECT 
  oi.id,
  o.order_number,
  p.product_name,
  oi.fulfilled_from,
  COALESCE(hi.quantity, 0) as hq_stock
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
LEFT JOIN hq_inventory hi ON hi.product_id = oi.product_id
WHERE o.status IN ('pending', 'processing')
ORDER BY o.created_at DESC;
