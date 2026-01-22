-- ============================================
-- 発注完了用ストアドプロシージャ（トランザクション対応）
-- ============================================
-- 在庫更新 + 履歴記録 + ステータス更新を一括で行い、
-- どれか失敗したら全てロールバック

CREATE OR REPLACE FUNCTION complete_order(
  p_order_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_inventory RECORD;
  v_new_quantity INT;
  v_order_number TEXT;
BEGIN
  -- 発注の存在確認とステータスチェック
  SELECT id, order_number, status INTO v_order
  FROM orders
  WHERE id = p_order_id;

  IF v_order.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', '発注が見つかりません'
    );
  END IF;

  IF v_order.status = 'completed' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'この発注は既に完了しています'
    );
  END IF;

  v_order_number := v_order.order_number;

  -- 各明細について在庫更新と履歴記録
  FOR v_item IN
    SELECT oi.product_id, oi.quantity, oi.fulfilled_from, p.product_code
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = p_order_id
  LOOP
    -- 本部在庫から出荷する場合のみ在庫を減らす
    IF v_item.fulfilled_from = 'hq' THEN
      -- 在庫レコードを取得
      SELECT id, quantity INTO v_inventory
      FROM hq_inventory
      WHERE product_id = v_item.product_id;

      IF v_inventory.id IS NOT NULL THEN
        -- 新しい在庫数を計算（0未満にはしない）
        v_new_quantity := GREATEST(0, v_inventory.quantity - v_item.quantity);

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
          v_item.product_id,
          'out',
          -v_item.quantity,
          v_inventory.quantity,
          v_new_quantity,
          '発注完了: ' || v_order_number
        );
      END IF;
    END IF;
  END LOOP;

  -- 発注ステータスを完了に更新
  UPDATE orders
  SET status = 'completed', completed_at = NOW(), updated_at = NOW()
  WHERE id = p_order_id;

  RETURN json_build_object(
    'success', true,
    'order_id', p_order_id,
    'order_number', v_order_number
  );

EXCEPTION
  WHEN OTHERS THEN
    -- エラー時は自動的にロールバック
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- RPC呼び出し権限を付与
GRANT EXECUTE ON FUNCTION complete_order TO authenticated;
GRANT EXECUTE ON FUNCTION complete_order TO anon;
