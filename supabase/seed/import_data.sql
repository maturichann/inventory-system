-- ============================================
-- 一括インポート用SQL（重複スキップ版）
-- ============================================
-- Supabase Dashboard > SQL Editor で実行してください

-- ============================================
-- 1. 店舗マスター（既存はスキップ）
-- ============================================
INSERT INTO stores (store_code, store_name) VALUES
('1', '京橋店'),
('2', '福島店'),
('3', '天王寺店'),
('4', '茶屋町店'),
('5', 'Ci belle 西宮北口店'),
('6', 'Ci belle茶屋町店'),
('7', 'Ci belle江坂店'),
('8', 'Sia.茶屋町店'),
('9', 'Sia.京橋店')
ON CONFLICT (store_code) DO NOTHING;

-- ============================================
-- 2. メーカーマスター（既存はスキップ）
-- ============================================
-- group_codeにユニーク制約がないため、名前で重複チェック
INSERT INTO makers (group_code, maker_name, order_category, minimum_order)
SELECT v.group_code, v.maker_name, v.order_category, v.minimum_order
FROM (VALUES
  ('A', 'ビューティーガレージ', '1', 3300),
  ('B', 'フーラストア', '1', 5500),
  ('C', 'はまざき', '1', 5500),
  ('D', 'マリーラッシュ', '1', 7700),
  ('E', 'パリジェンヌラッシュ', '1', 16500),
  ('F', 'テクニコ', '1', 11000),
  ('G', '松風', '1', 5500),
  ('H', 'ビュプロ', '1', 11000),
  ('I', 'アイリス', '1', 0),
  ('J', 'RND JAPAN（BASE）', '1', 6600),
  ('K', 'Lash Box', '1', 10000),
  ('L', 'グラント', '1', 55000),
  ('M', 'RONME', '1', 5500),
  ('N', 'Lash Colors', '1', 5500),
  ('O', '安永', '1', 22000),
  ('P', 'Silk de river', '1', 22000),
  ('Q', '金本さん', '1', 0),
  ('R', '事務所', '1', 0),
  ('S', '楽天', '1', 0),
  ('T', 'ツナグ', '1', 55000),
  ('U', 'モノタロウ', '1', 0),
  ('V', 'その他', '1', 0)
) AS v(group_code, maker_name, order_category, minimum_order)
WHERE NOT EXISTS (SELECT 1 FROM makers m WHERE m.maker_name = v.maker_name);

-- ============================================
-- 3. カテゴリ追加（既存はスキップ）
-- ============================================
INSERT INTO categories (name, description, is_extension, sort_order)
SELECT v.name, v.description, v.is_extension, v.sort_order
FROM (VALUES
  ('アイブロウ', 'アイブロウ関連商品', false, 10),
  ('グルー', 'グルー関連商品', false, 15),
  ('パーマ', 'パーマ関連商品', false, 25),
  ('物販', '物販商品', false, 100),
  ('その他', 'その他商品', false, 90)
) AS v(name, description, is_extension, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.name = v.name);

-- ============================================
-- 4. 商品マスター（既存はスキップ）
-- ============================================
-- ビューティーガレージ
INSERT INTO products (maker_id, category_id, product_code, level1, level2, level3, level4, level5, product_name, unit_price)
SELECT
  (SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'),
  (SELECT id FROM categories WHERE name = v.category),
  v.product_code, v.level1, v.level2, v.level3, v.level4, v.level5, v.product_name, v.unit_price
FROM (VALUES
  ('A-0001', 'アイブロウ', '商材', 'アイブロウ', 'PARISBROWスタイリングブロウペンシル', '01', 'ライトブラウン', 'PARISBROWスタイリングブロウペンシル 01 ライトブラウン', 1755),
  ('A-0002', 'アイブロウ', '商材', 'アイブロウ', 'PARISBROWスタイリングブロウペンシル', '02', 'ミディアムブラウン', 'PARISBROWスタイリングブロウペンシル 02 ミディアムブラウン', 1755),
  ('A-0003', 'アイブロウ', '商材', 'アイブロウ', 'PARISBROWスタイリングブロウペンシル', '03', 'グレーブラウン', 'PARISBROWスタイリングブロウペンシル 03 グレーブラウン', 1755),
  ('A-0004', 'アイブロウ', '商材', 'アイブロウ', 'PARISBROWスタイリングブロウマスカラ', NULL, NULL, 'PARISBROWスタイリングブロウマスカラ', 1881),
  ('A-0005', 'アイブロウ', '商材', 'アイブロウ', 'PARISBROWスリムブロウペンシル', '01', 'ブラウン', 'PARISBROWスリムブロウペンシル 01 ブラウン', 1128),
  ('A-0006', 'アイブロウ', '商材', 'アイブロウ', 'PARISBROWスリムブロウペンシル', '02', 'オリーブグレー', 'PARISBROWスリムブロウペンシル 02 オリーブグレー', 1128),
  ('A-0007', 'アイブロウ', '商材', 'アイブロウ', 'PARISBROWスリムブロウペンシル', '03', 'テラコッタブラウン', 'PARISBROWスリムブロウペンシル 03 テラコッタブラウン', 1128),
  ('A-0008', 'アイブロウ', '商材', 'アイブロウ', 'PARISBROWスリムブロウペンシル', '04', 'ダークブラウン', 'PARISBROWスリムブロウペンシル 04 ダークブラウン', 1128),
  ('A-0009', 'アイブロウ', '商材', 'アイブロウ', 'PARISBROWスリムブロウペンシル', '05', 'ブラック', 'PARISBROWスリムブロウペンシル 05 ブラック', 1128),
  ('A-0010', 'エクステ', '商材', 'エクステ', '【Rich Lash】ラッシュファン（ピンク）', NULL, NULL, '【Rich Lash】ラッシュファン（ピンク）', 880),
  ('A-0011', 'エクステ', '商材', 'エクステ', '【Rich Lash】ラッシュファン（ブラック）', NULL, NULL, '【Rich Lash】ラッシュファン（ブラック）', 880),
  ('A-0012', 'グルー', '商材', 'エクステ', 'グルー', '[AIVIL]プレミアムアイラッシュグルー 7g', NULL, '[AIVIL]プレミアムアイラッシュグルー 7g', 4702),
  ('A-0013', 'グルー', '商材', 'エクステ', 'グルー', '【ome】ファストエチル系国産ブラックグルー5ml', NULL, '【ome】ファストエチル系国産ブラックグルー5ml', 4284),
  ('A-0014', 'グルー', '商材', 'エクステ', 'グルー', '強力ブチル黒 10g BBK', NULL, '強力ブチル黒 10g BBK', 3072),
  ('A-0015', 'グルー', '商材', 'エクステ', 'グルー', '強力国産Bグルー（II） 10g', NULL, '強力国産Bグルー（II） 10g', 2327),
  ('A-0016', 'グルー', '商材', 'エクステ', 'グルー', '強力国産BグルーEX 10g', NULL, '強力国産BグルーEX 10g', 2612),
  ('A-0017', 'エクステ', '商材', 'エクステ', 'その他', '【PREANFA】Lash Pro コーム', NULL, '【PREANFA】Lash Pro コーム', 188),
  ('A-0018', 'エクステ', '商材', 'エクステ', 'その他', 'Miss eye dor ジェルリムーバー15ml', NULL, 'Miss eye dor ジェルリムーバー15ml', 1045),
  ('A-0019', 'エクステ', '商材', 'エクステ', 'その他', 'メディカラッシュジェルリムーバー20ml', NULL, 'メディカラッシュジェルリムーバー20ml', 1045),
  ('A-0020', 'その他', '商材', 'その他', '【beaupro】ラッシュリフトマイクロブラシ100本', NULL, NULL, '【beaupro】ラッシュリフトマイクロブラシ100本', 710),
  ('A-0021', 'その他', '商材', 'その他', '【BEAUTY PRODUCTS】ラッシュフォームB 80ml', NULL, NULL, '【BEAUTY PRODUCTS】ラッシュフォームB 80ml', 1567),
  ('A-0022', 'その他', '商材', 'その他', '【Rich Lash】マイクロスティックロング100本', NULL, NULL, '【Rich Lash】マイクロスティックロング100本', 570),
  ('A-0023', 'その他', '商材', 'その他', '【RLASH】マイクロブラシLL 100本入り', NULL, NULL, '【RLASH】マイクロブラシLL 100本入り', 570),
  ('A-0024', 'その他', '商材', 'その他', '【TRUMP】マイクロスティックロング ホワイト100本', NULL, NULL, '【TRUMP】マイクロスティックロング ホワイト100本', 710),
  ('A-0025', 'コーティング', '商材', 'その他', '【ビュプロ】コーティング剤 濃紺', NULL, NULL, '【ビュプロ】コーティング剤 濃紺', 4180),
  ('A-0026', 'その他', '商材', 'その他', 'スキナゲート 12mm×7m 24巻', NULL, NULL, 'スキナゲート 12mm×7m 24巻', 2768),
  ('A-0027', 'その他', '商材', 'その他', '紙軸白綿棒200本 2個パック', NULL, NULL, '紙軸白綿棒200本 2個パック', 188),
  ('A-0028', 'その他', '商材', 'その他', '優肌絆不織布（白） 24巻', NULL, NULL, '優肌絆不織布（白） 24巻', 2977),
  ('A-0029', 'その他', '商材', 'その他', 'マイクロブラシM 100本入り', NULL, NULL, 'マイクロブラシM 100本入り', 627),
  ('A-0030', 'パーマ', '商材', 'パーマ', '【TIMe】グリッターラッシュセラム BC', NULL, NULL, '【TIMe】グリッターラッシュセラム BC', 3990),
  ('A-0031', 'パーマ', '商材', 'パーマ', '【TIMe】グリッターラッシュセラム KC', NULL, NULL, '【TIMe】グリッターラッシュセラム KC', 3990),
  ('A-0032', 'パーマ', '商材', 'パーマ', '【WINK】ESケラチントリートメント 10ml', NULL, NULL, '【WINK】ESケラチントリートメント 10ml', 3800),
  ('A-0033', 'クレンジング', '物販', 'クレンジング', 'アイズ ジェントルアイメイクアップリムーバーN 150ml', NULL, NULL, 'アイズ ジェントルアイメイクアップリムーバーN 150ml', 883)
) AS v(product_code, category, level1, level2, level3, level4, level5, product_name, unit_price)
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.product_code = v.product_code);

-- フーラストア
INSERT INTO products (maker_id, category_id, product_code, level1, level2, level3, level4, product_name, unit_price)
SELECT
  (SELECT id FROM makers WHERE maker_name = 'フーラストア'),
  (SELECT id FROM categories WHERE name = v.category),
  v.product_code, v.level1, v.level2, v.level3, v.level4, v.product_name, v.unit_price
FROM (VALUES
  ('B-0001', 'グルー', '商材', 'エクステ', 'グルー', '【Foula】国産エチル プロ 5ml', '【Foula】国産エチル プロ 5ml', 3446),
  ('B-0002', 'その他', '商材', 'その他', '【Belle】接着強化剤 5ml', NULL, '【Belle】接着強化剤 5ml', 1254),
  ('B-0003', 'パーマ', '商材', 'パーマ', '【Belle】LASH LIFT GEL GLUE', NULL, '【Belle】LASH LIFT GEL GLUE', 1540),
  ('B-0004', 'パーマ', '商材', 'パーマ', '【Belle】接着強化剤 5ml（パーマ用）', NULL, '【Belle】接着強化剤 5ml（パーマ用）', 1254)
) AS v(product_code, category, level1, level2, level3, level4, product_name, unit_price)
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.product_code = v.product_code);

-- はまざき
INSERT INTO products (maker_id, category_id, product_code, level1, level2, level3, level4, product_name, unit_price)
SELECT
  (SELECT id FROM makers WHERE maker_name = 'はまざき'),
  (SELECT id FROM categories WHERE name = 'グルー'),
  'C-0001', '商材', 'エクステ', 'グルー', 'プレミアムボリュームラッシュ白金グルー', 'プレミアムボリュームラッシュ白金グルー', 4301
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.product_code = 'C-0001');

-- ============================================
-- 5. 本部在庫の初期化（全商品に在庫レコードを作成）
-- ============================================
INSERT INTO hq_inventory (product_id, quantity, threshold)
SELECT p.id, 0, 5
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM hq_inventory hi WHERE hi.product_id = p.id
);

-- ============================================
-- 登録結果の確認
-- ============================================
SELECT 'インポート完了' AS status;
SELECT '店舗' AS テーブル, COUNT(*) AS 件数 FROM stores
UNION ALL SELECT 'メーカー', COUNT(*) FROM makers
UNION ALL SELECT 'カテゴリ', COUNT(*) FROM categories
UNION ALL SELECT '商品', COUNT(*) FROM products
UNION ALL SELECT '本部在庫', COUNT(*) FROM hq_inventory;
