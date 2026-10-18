-- Public synthetic catalog only. No Auth users, passwords or orders.
insert into public.products
  (id, slug, name, description, price_jpy, category, image_path, is_active, stock)
values
  ('10000000-0000-4000-8000-000000000001', 'cloud-notebook', '余白のノート', '考えごとも、今日の小さな発見も。手になじむ淡いブルーの表紙と、書く時間が楽しみになる方眼ページのノートです。', 1280, '文房具', '/products/cloud-notebook.svg', true, 24),
  ('10000000-0000-4000-8000-000000000002', 'orbit-pen', '真鍮のボールペン', '静かな光沢と、ほどよい重さ。日々のメモに寄り添う、すっきりとした佇まいの真鍮ボールペンです。', 2400, '文房具', '/products/orbit-pen.svg', true, 18),
  ('10000000-0000-4000-8000-000000000003', 'fold-stand', '折りたたみスタンド', 'デスクに、ひとつ気持ちのよい角度を。使わないときはコンパクトにたためる、スマートフォン用のアルミスタンドです。', 3200, 'ガジェット', '/products/fold-stand.svg', true, 12),
  ('10000000-0000-4000-8000-000000000004', 'morning-mug', '朝のマグカップ', 'いつもの一杯が、少し好きになる。やさしいアイボリーと丸い持ち手の、毎朝使いたくなる陶器のマグです。', 2200, '暮らし', '/products/morning-mug.svg', true, 20),
  ('10000000-0000-4000-8000-000000000005', 'linen-pouch', 'リネンのポーチ', 'バッグの中の小さなものに、定位置を。素朴なリネンの風合いと落ち着いたグリーンが心地よい、小ぶりのポーチです。', 1800, '暮らし', '/products/linen-pouch.svg', true, 16),
  ('10000000-0000-4000-8000-000000000006', 'soft-lamp', '小さなデスクライト', '夜の読書や、ひと息つく時間に。場所をとらない丸いフォルムで、デスクをやわらかく照らす小さなライトです。', 4800, 'ガジェット', '/products/soft-lamp.svg', true, 8),
  ('10000000-0000-4000-8000-000000000007', 'grid-tape', '方眼のマスキングテープ', '手帳の目印にも、贈りものの仕上げにも。控えめな方眼模様が、日常の小さな工夫を楽しくする紙のテープです。', 680, '文房具', '/products/grid-tape.svg', true, 36),
  ('10000000-0000-4000-8000-000000000008', 'round-clock', 'まるい置き時計', '時間を確かめるたび、少し穏やかに。読みやすい文字盤と丸みのあるフレームの、棚にもデスクにも似合う置き時計です。', 3600, '暮らし', '/products/round-clock.svg', true, 10),
  ('10000000-0000-4000-8000-000000000009', 'pebble-speaker', 'Pebble スピーカー', 'お気に入りの音を、お気に入りの場所へ。小石のようになめらかなフォルムの、持ち運びやすいワイヤレススピーカーです。', 5800, 'ガジェット', '/products/pebble-speaker.svg', true, 9),
  ('10000000-0000-4000-8000-000000000010', 'daily-tote', '毎日のトートバッグ', '近所へのお出かけから、いつもの通勤まで。肩にかけやすい持ち手と丈夫な帆布で、気負わず使えるトートバッグです。', 2800, '暮らし', '/products/daily-tote.svg', true, 22)
on conflict (id) do update set
  slug = excluded.slug, name = excluded.name, description = excluded.description,
  price_jpy = excluded.price_jpy, category = excluded.category,
  image_path = excluded.image_path, is_active = excluded.is_active, stock = excluded.stock;
