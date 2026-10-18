export type ProductCategory = '文房具' | '暮らし' | 'ガジェット'

/** Public catalog data. Monetary amounts are integer Japanese yen. */
export interface Product {
  id: string
  slug: string
  name: string
  description: string
  price_jpy: number
  category: ProductCategory
  image_path: string
  is_active: boolean
  stock: number
}

export interface Profile {
  id: string
  display_name: string
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  order_code: string
  status: 'demo_confirmed' | 'demo_cancelled'
  total_jpy: number
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price_jpy: number
}
