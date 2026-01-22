-- ============================================
-- 在庫調整用ストアドプロシージャ（トランザクション対応）
-- ============================================
-- 在庫更新と履歴記録を原子的に実行

CREATE OR REPLACE FUNCTION adjust_inventory(
  p_product_id UUID,
  p_adjust_type VARCHAR,  -- 'in', 'out', 'adjust'
  p_quantity INT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_inventory RECORD;
  v_new_quantity INT;
  v_change_quantity INT;
BEGIN
  -- バリデーション
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', '数量は1以上を指定してください'
    );
  END IF;

  IF p_adjust_type NOT IN ('in', 'out', 'adjust') THEN
    RETURN json_build_object(
      'success', false,
      'error', '調整タイプが不正です'
    );
  END IF;

  -- 商品の存在確認
  IF NOT EXISTS (SELECT 1 FROM products WHERE id = p_product_id AND is_active = true) THEN
    RETURN json_build_object(
      'success', false,
      'error', '商品が存在しません'
    );
  END IF;

  -- 在庫レコードを取得（FOR UPDATEでロック）
  SELECT id, quantity INTO v_inventory
  FROM hq_inventory
  WHERE product_id = p_product_id
  FOR UPDATE;

  -- 在庫レコードがない場合は作成
  IF v_inventory.id IS NULL THEN
    INSERT INTO hq_inventory (product_id, quantity, threshold)
    VALUES (p_product_id, 0, 5)
    RETURNING id, quantity INTO v_inventory;
  END IF;

  -- 新しい在庫数を計算
  IF p_adjust_type = 'in' THEN
    v_new_quantity := v_inventory.quantity + p_quantity;
    v_change_quantity := p_quantity;
  ELSIF p_adjust_type = 'out' THEN
    v_new_quantity := GREATEST(0, v_inventory.quantity - p_quantity);
    v_change_quantity := -p_quantity;
  ELSE  -- adjust
    v_new_quantity := p_quantity;
    v_change_quantity := p_quantity - v_inventory.quantity;
  END IF;

  -- 在庫を更新
  UPDATE hq_inventory
  SET quantity = v_new_quantity, updated_at = NOW()
  WHERE id = v_inventory.id;

  -- 履歴を記録
  INSERT INTO inventory_history (
    product_id,
    change_type,
    quantity,
    previous_quantity,
    new_quantity,
    reason
  ) VALUES (
    p_product_id,
    p_adjust_type,
    v_change_quantity,
    v_inventory.quantity,
    v_new_quantity,
    p_reason
  );

  RETURN json_build_object(
    'success', true,
    'previous_quantity', v_inventory.quantity,
    'new_quantity', v_new_quantity
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- RPC呼び出し権限を付与
GRANT EXECUTE ON FUNCTION adjust_inventory TO authenticated;
GRANT EXECUTE ON FUNCTION adjust_inventory TO anon;
