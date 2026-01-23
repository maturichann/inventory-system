-- ============================================
-- 一括インポート用SQL
-- ============================================
-- Supabase Dashboard > SQL Editor で実行してください
-- 注意: 既存データがある場合は先に削除するか、このSQLを調整してください

-- ============================================
-- 1. 店舗マスター
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
('9', 'Sia.京橋店');

-- ============================================
-- 2. メーカーマスター
-- ============================================
INSERT INTO makers (group_code, maker_name, order_category, minimum_order) VALUES
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
('V', 'その他', '1', 0);

-- ============================================
-- 3. カテゴリ追加（既存に追加）
-- ============================================
INSERT INTO categories (name, description, is_extension, sort_order) VALUES
('アイブロウ', 'アイブロウ関連商品', false, 10),
('グルー', 'グルー関連商品', false, 15),
('パーマ', 'パーマ関連商品', false, 25),
('物販', '物販商品', false, 100);

-- ============================================
-- 4. 商品マスター
-- ============================================
-- ビューティーガレージ
INSERT INTO products (maker_id, category_id, product_code, level1, level2, level3, level4, level5, product_name, unit_price)
VALUES
-- アイブロウ
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'アイブロウ'), 'A-0001', '商材', 'アイブロウ', 'PARISBROWスタイリングブロウペンシル', '01', 'ライトブラウン', 'PARISBROWスタイリングブロウペンシル 01 ライトブラウン', 1755),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'アイブロウ'), 'A-0002', '商材', 'アイブロウ', 'PARISBROWスタイリングブロウペンシル', '02', 'ミディアムブラウン', 'PARISBROWスタイリングブロウペンシル 02 ミディアムブラウン', 1755),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'アイブロウ'), 'A-0003', '商材', 'アイブロウ', 'PARISBROWスタイリングブロウペンシル', '03', 'グレーブラウン', 'PARISBROWスタイリングブロウペンシル 03 グレーブラウン', 1755),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'アイブロウ'), 'A-0004', '商材', 'アイブロウ', 'PARISBROWスタイリングブロウマスカラ', NULL, NULL, 'PARISBROWスタイリングブロウマスカラ', 1881),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'アイブロウ'), 'A-0005', '商材', 'アイブロウ', 'PARISBROWスリムブロウペンシル', '01', 'ブラウン', 'PARISBROWスリムブロウペンシル 01 ブラウン', 1128),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'アイブロウ'), 'A-0006', '商材', 'アイブロウ', 'PARISBROWスリムブロウペンシル', '02', 'オリーブグレー', 'PARISBROWスリムブロウペンシル 02 オリーブグレー', 1128),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'アイブロウ'), 'A-0007', '商材', 'アイブロウ', 'PARISBROWスリムブロウペンシル', '03', 'テラコッタブラウン', 'PARISBROWスリムブロウペンシル 03 テラコッタブラウン', 1128),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'アイブロウ'), 'A-0008', '商材', 'アイブロウ', 'PARISBROWスリムブロウペンシル', '04', 'ダークブラウン', 'PARISBROWスリムブロウペンシル 04 ダークブラウン', 1128),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'アイブロウ'), 'A-0009', '商材', 'アイブロウ', 'PARISBROWスリムブロウペンシル', '05', 'ブラック', 'PARISBROWスリムブロウペンシル 05 ブラック', 1128),

-- エクステ
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'エクステ'), 'A-0010', '商材', 'エクステ', '【Rich Lash】ラッシュファン（ピンク）', NULL, NULL, '【Rich Lash】ラッシュファン（ピンク）', 880),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'エクステ'), 'A-0011', '商材', 'エクステ', '【Rich Lash】ラッシュファン（ブラック）', NULL, NULL, '【Rich Lash】ラッシュファン（ブラック）', 880),

-- グルー
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'グルー'), 'A-0012', '商材', 'エクステ', 'グルー', '[AIVIL]プレミアムアイラッシュグルー≪プロフェッショナル≫7g', NULL, '[AIVIL]プレミアムアイラッシュグルー≪プロフェッショナル≫7g', 4702),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'グルー'), 'A-0013', '商材', 'エクステ', 'グルー', '【ome】ファストエチル系国産ブラックグルー5ml', NULL, '【ome】ファストエチル系国産ブラックグルー5ml', 4284),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'グルー'), 'A-0014', '商材', 'エクステ', 'グルー', '強力ブチル黒 10g BBK', NULL, '強力ブチル黒 10g BBK', 3072),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'グルー'), 'A-0015', '商材', 'エクステ', 'グルー', '強力国産Bグルー（Ⅱ） 10g', NULL, '強力国産Bグルー（Ⅱ） 10g', 2327),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'グルー'), 'A-0016', '商材', 'エクステ', 'グルー', '強力国産BグルーEX 10g JBGEX-10', NULL, '強力国産BグルーEX 10g JBGEX-10', 2612),

-- その他
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'エクステ'), 'A-0017', '商材', 'エクステ', 'その他', '【PREANFA】Lash Pro コーム LP-CORM01', NULL, '【PREANFA】Lash Pro コーム LP-CORM01', 188),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'エクステ'), 'A-0018', '商材', 'エクステ', 'その他', 'Miss eye d''or ジェルリムーバー15ml', NULL, 'Miss eye d''or ジェルリムーバー15ml', 1045),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'エクステ'), 'A-0019', '商材', 'エクステ', 'その他', 'メディカラッシュジェルリムーバー20ml', NULL, 'メディカラッシュジェルリムーバー20ml', 1045),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'その他'), 'A-0020', '商材', 'その他', '【beaupro】ラッシュリフトマイクロブラシ100本', NULL, NULL, '【beaupro】ラッシュリフトマイクロブラシ100本', 710),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'その他'), 'A-0021', '商材', 'その他', '【BEAUTY PRODUCTS】ラッシュフォームB 80ml', NULL, NULL, '【BEAUTY PRODUCTS】ラッシュフォームB 80ml', 1567),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'その他'), 'A-0022', '商材', 'その他', '【Rich Lash】マイクロスティックロング100本', NULL, NULL, '【Rich Lash】マイクロスティックロング100本', 570),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'その他'), 'A-0023', '商材', 'その他', '【RLASH】マイクロブラシLL 100本入り', NULL, NULL, '【RLASH】マイクロブラシLL 100本入り', 570),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'その他'), 'A-0024', '商材', 'その他', '【TRUMP】マイクロスティックロング ホワイト100本', NULL, NULL, '【TRUMP】マイクロスティックロング ホワイト100本', 710),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'コーティング'), 'A-0025', '商材', 'その他', '【ビュプロ】コーティング剤 濃紺【日本製】', NULL, NULL, '【ビュプロ】コーティング剤 濃紺【日本製】', 4180),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'その他'), 'A-0026', '商材', 'その他', 'スキナゲート 12mm×7m (24巻)(576-114140)', NULL, NULL, 'スキナゲート 12mm×7m (24巻)', 2768),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'その他'), 'A-0027', '商材', 'その他', '紙軸白綿棒200本 2個パック', NULL, NULL, '紙軸白綿棒200本 2個パック', 188),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'その他'), 'A-0028', '商材', 'その他', '優肌絆不織布（白） 24巻 (612-200531)', NULL, NULL, '優肌絆不織布（白） 24巻', 2977),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'その他'), 'A-0029', '商材', 'その他', 'マイクロブラシM 100本入り', NULL, NULL, 'マイクロブラシM 100本入り', 627),

-- パーマ
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'パーマ'), 'A-0030', '商材', 'パーマ', '【TIMe】グリッターラッシュセラム BC', NULL, NULL, '【TIMe】グリッターラッシュセラム BC', 3990),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'パーマ'), 'A-0031', '商材', 'パーマ', '【TIMe】グリッターラッシュセラム KC', NULL, NULL, '【TIMe】グリッターラッシュセラム KC', 3990),
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'パーマ'), 'A-0032', '商材', 'パーマ', '【WINK】ESケラチントリートメント 10ml', NULL, NULL, '【WINK】ESケラチントリートメント 10ml', 3800),

-- 物販
((SELECT id FROM makers WHERE maker_name = 'ビューティーガレージ'), (SELECT id FROM categories WHERE name = 'クレンジング'), 'A-0033', '物販', 'クレンジング', 'アイズクレンジング', 'アイズ ジェントルアイメイクアップリムーバーN 150ml', NULL, 'アイズ ジェントルアイメイクアップリムーバーN 150ml', 883);

-- フーラストア
INSERT INTO products (maker_id, category_id, product_code, level1, level2, level3, level4, product_name, unit_price)
VALUES
((SELECT id FROM makers WHERE maker_name = 'フーラストア'), (SELECT id FROM categories WHERE name = 'グルー'), 'B-0001', '商材', 'エクステ', 'グルー', '【Foula】国産エチル プロ 5ml', '【Foula】国産エチル プロ 5ml', 3446),
((SELECT id FROM makers WHERE maker_name = 'フーラストア'), (SELECT id FROM categories WHERE name = 'その他'), 'B-0002', '商材', 'その他', '【Belle】接着強化剤 5ml', NULL, '【Belle】接着強化剤 5ml', 1254),
((SELECT id FROM makers WHERE maker_name = 'フーラストア'), (SELECT id FROM categories WHERE name = 'パーマ'), 'B-0003', '商材', 'パーマ', '【Belle】LASH LIFT GEL GLUE', NULL, '【Belle】LASH LIFT GEL GLUE', 1540),
((SELECT id FROM makers WHERE maker_name = 'フーラストア'), (SELECT id FROM categories WHERE name = 'パーマ'), 'B-0004', '商材', 'パーマ', '【Belle】接着強化剤 5ml', NULL, '【Belle】接着強化剤 5ml（パーマ用）', 1254);

-- はまざき
INSERT INTO products (maker_id, category_id, product_code, level1, level2, level3, level4, product_name, unit_price)
VALUES
((SELECT id FROM makers WHERE maker_name = 'はまざき'), (SELECT id FROM categories WHERE name = 'グルー'), 'C-0001', '商材', 'エクステ', 'グルー', 'プレミアムボリュームラッシュ白金グルー', 'プレミアムボリュームラッシュ白金グルー', 4301);

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
