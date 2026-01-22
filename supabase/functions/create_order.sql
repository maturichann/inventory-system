-- ============================================
-- 発注作成用ストアドプロシージャ（トランザクション対応）
-- ============================================
-- 使用方法: Supabase Dashboard > SQL Editor で実行してRPCとして登録
-- フロントエンドからは supabase.rpc('create_order_with_items', {...}) で呼び出し

CREATE OR REPLACE FUNCTION create_order_with_items(
  p_store_id UUID,
  p_staff_id UUID DEFAULT NULL,
  p_items JSONB -- [{"product_id": "uuid", "quantity": 1}, ...]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
BEGIN
  -- トランザクション内で実行（エラー時は自動ロールバック）

  -- 1. 発注を作成
  INSERT INTO orders (store_id, assigned_staff_id, assignment_type, status)
  VALUES (
    p_store_id,
    p_staff_id,
    CASE WHEN p_staff_id IS NOT NULL THEN 'manual' ELSE NULL END,
    'pending'
  )
  RETURNING id, order_number INTO v_order_id, v_order_number;

  -- 2. 発注明細を作成
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (order_id, product_id, quantity)
    VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INT
    );
  END LOOP;

  -- 成功時は発注情報を返す
  RETURN json_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number
  );

EXCEPTION
  WHEN OTHERS THEN
    -- エラー時は自動的にロールバックされる
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- RPC呼び出し権限を付与
GRANT EXECUTE ON FUNCTION create_order_with_items TO authenticated;
GRANT EXECUTE ON FUNCTION create_order_with_items TO anon;
