import type { Product } from './types'

/** All catalog entries and images are original, synthetic demonstration data. */
export const PRODUCTS: readonly Product[] = [
  {
    id: '10000000-0000-4000-8000-000000000001', slug: 'cloud-notebook',
    name: '余白のノート', description: '考えごとも、今日の小さな発見も。手になじむ淡いブルーの表紙と、書く時間が楽しみになる方眼ページのノートです。',
    price_jpy: 1280, category: '文房具', image_path: '/products/cloud-notebook.svg', is_active: true, stock: 24,
  },
  {
    id: '10000000-0000-4000-8000-000000000002', slug: 'orbit-pen',
    name: '真鍮のボールペン', description: '静かな光沢と、ほどよい重さ。日々のメモに寄り添う、すっきりとした佇まいの真鍮ボールペンです。',
    price_jpy: 2400, category: '文房具', image_path: '/products/orbit-pen.svg', is_active: true, stock: 18,
  },
  {
    id: '10000000-0000-4000-8000-000000000003', slug: 'fold-stand',
    name: '折りたたみスタンド', description: 'デスクに、ひとつ気持ちのよい角度を。使わないときはコンパクトにたためる、スマートフォン用のアルミスタンドです。',
    price_jpy: 3200, category: 'ガジェット', image_path: '/products/fold-stand.svg', is_active: true, stock: 12,
  },
  {
    id: '10000000-0000-4000-8000-000000000004', slug: 'morning-mug',
    name: '朝のマグカップ', description: 'いつもの一杯が、少し好きになる。やさしいアイボリーと丸い持ち手の、毎朝使いたくなる陶器のマグです。',
    price_jpy: 2200, category: '暮らし', image_path: '/products/morning-mug.svg', is_active: true, stock: 20,
  },
  {
    id: '10000000-0000-4000-8000-000000000005', slug: 'linen-pouch',
    name: 'リネンのポーチ', description: 'バッグの中の小さなものに、定位置を。素朴なリネンの風合いと落ち着いたグリーンが心地よい、小ぶりのポーチです。',
    price_jpy: 1800, category: '暮らし', image_path: '/products/linen-pouch.svg', is_active: true, stock: 16,
  },
  {
    id: '10000000-0000-4000-8000-000000000006', slug: 'soft-lamp',
    name: '小さなデスクライト', description: '夜の読書や、ひと息つく時間に。場所をとらない丸いフォルムで、デスクをやわらかく照らす小さなライトです。',
    price_jpy: 4800, category: 'ガジェット', image_path: '/products/soft-lamp.svg', is_active: true, stock: 8,
  },
  {
    id: '10000000-0000-4000-8000-000000000007', slug: 'grid-tape',
    name: '方眼のマスキングテープ', description: '手帳の目印にも、贈りものの仕上げにも。控えめな方眼模様が、日常の小さな工夫を楽しくする紙のテープです。',
    price_jpy: 680, category: '文房具', image_path: '/products/grid-tape.svg', is_active: true, stock: 36,
  },
  {
    id: '10000000-0000-4000-8000-000000000008', slug: 'round-clock',
    name: 'まるい置き時計', description: '時間を確かめるたび、少し穏やかに。読みやすい文字盤と丸みのあるフレームの、棚にもデスクにも似合う置き時計です。',
    price_jpy: 3600, category: '暮らし', image_path: '/products/round-clock.svg', is_active: true, stock: 10,
  },
  {
    id: '10000000-0000-4000-8000-000000000009', slug: 'pebble-speaker',
    name: 'Pebble スピーカー', description: 'お気に入りの音を、お気に入りの場所へ。小石のようになめらかなフォルムの、持ち運びやすいワイヤレススピーカーです。',
    price_jpy: 5800, category: 'ガジェット', image_path: '/products/pebble-speaker.svg', is_active: true, stock: 9,
  },
  {
    id: '10000000-0000-4000-8000-000000000010', slug: 'daily-tote',
    name: '毎日のトートバッグ', description: '近所へのお出かけから、いつもの通勤まで。肩にかけやすい持ち手と丈夫な帆布で、気負わず使えるトートバッグです。',
    price_jpy: 2800, category: '暮らし', image_path: '/products/daily-tote.svg', is_active: true, stock: 22,
  },
]
