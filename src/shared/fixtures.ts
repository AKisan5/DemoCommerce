import { PRODUCTS } from './products'
import type { Order, OrderItem } from './types'

export const TEST_BUYERS = [
  { key: 'A', email: 'buyer-a@example.test', displayName: 'テストユーザー A' },
  { key: 'B', email: 'buyer-b@example.test', displayName: 'テストユーザー B' },
] as const

/** Refuse fixtures unless the operator names a local or dedicated synthetic target. */
export function validateFixtureTarget(environment: Record<string, string | undefined>): string {
  const rawUrl = environment.SUPABASE_URL
  if (!rawUrl) throw new Error('SUPABASE_URL is required for fixture setup.')
  let url: URL
  try { url = new URL(rawUrl) } catch { throw new Error('SUPABASE_URL must be a valid URL.') }
  if (url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) {
    throw new Error('SUPABASE_URL must be an origin without credentials, a path or query.')
  }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (environment.APP_ENV === 'local' && loopback && ['http:', 'https:'].includes(url.protocol)) {
    return url.origin
  }
  const dedicatedLab = environment.APP_ENV === 'lab'
    && environment.LAB_ENABLED === 'true'
    && environment.FIXTURES_ALLOW_REMOTE === 'true'
    && environment.FIXTURES_SYNTHETIC_ONLY === 'true'
    && environment.FIXTURES_ALLOWED_SUPABASE_URL === url.origin
    && url.protocol === 'https:'
    && /^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)
    && !url.port
  if (dedicatedLab) return url.origin
  throw new Error('Fixture writes require APP_ENV=local with a loopback Supabase URL, or an explicitly allowlisted dedicated synthetic lab project.')
}

/** Stable order IDs allow future explicitly authorized inspection to be repeated. */
export function buyerFixtures(buyer: 'A' | 'B', userId: string): { orders: Order[]; items: OrderItem[] } {
  const owner = buyer === 'A' ? 'a' : 'b'
  const selections = buyer === 'A' ? [[0, 1], [3, 4]] : [[2, 6], [7, 9]]
  const orders: Order[] = []
  const items: OrderItem[] = []
  for (const [index, productIndexes] of selections.entries()) {
    const suffix = String(index + 1).padStart(12, '0')
    const orderId = `2000000${owner}-0000-4000-8000-${suffix}`
    const selected = productIndexes.map((productIndex) => PRODUCTS[productIndex]!)
    orders.push({
      id: orderId, user_id: userId, order_code: `DEMO_ONLY_ORDER_${buyer}_${index + 1}`,
      status: 'demo_confirmed', total_jpy: selected.reduce((total, product) => total + product.price_jpy, 0),
      created_at: `2026-10-${String(16 - index * 3).padStart(2, '0')}T03:00:00.000Z`,
    })
    for (const [itemIndex, product] of selected.entries()) {
      items.push({
        id: `3000000${owner}-0000-4000-8000-${String(index * 2 + itemIndex + 1).padStart(12, '0')}`,
        order_id: orderId, product_id: product.id, quantity: 1, unit_price_jpy: product.price_jpy,
      })
    }
  }
  return { orders, items }
}
