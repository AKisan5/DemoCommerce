import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buyerFixtures, TEST_BUYERS, validateFixtureTarget } from '../../src/shared/fixtures'
import { PRODUCTS } from '../../src/shared/products'

describe('synthetic fixture contracts', () => {
  it('keeps all ten catalog records synchronized with the SQL seed and local images', () => {
    const seed = readFileSync(new URL('../../supabase/seed.sql', import.meta.url), 'utf8')
    expect(PRODUCTS).toHaveLength(10)
    expect(new Set(PRODUCTS.map((product) => product.id)).size).toBe(10)
    expect(new Set(PRODUCTS.map((product) => product.slug)).size).toBe(10)
    for (const product of PRODUCTS) {
      expect(product.price_jpy).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(product.price_jpy)).toBe(true)
      expect(product.image_path).toBe(`/products/${product.slug}.svg`)
      const sqlString = (value: string) => `'${value.replaceAll("'", "''")}'`
      expect(seed).toContain(`(${[
        sqlString(product.id), sqlString(product.slug), sqlString(product.name), sqlString(product.description),
        product.price_jpy, sqlString(product.category), sqlString(product.image_path), product.is_active, product.stock,
      ].join(', ')})`)
      expect(readFileSync(new URL(`../../public${product.image_path}`, import.meta.url), 'utf8')).toContain('<svg')
    }
  })

  it('creates disjoint stable A/B orders with totals calculated from catalog prices', () => {
    const a = buyerFixtures('A', '90000000-0000-4000-8000-00000000000a')
    const b = buyerFixtures('B', '90000000-0000-4000-8000-00000000000b')
    expect(TEST_BUYERS.map((buyer) => buyer.email)).toEqual(['buyer-a@example.test', 'buyer-b@example.test'])
    expect(a).toEqual(buyerFixtures('A', '90000000-0000-4000-8000-00000000000a'))
    expect(new Set([...a.orders, ...b.orders].map((order) => order.id)).size).toBe(4)
    expect(new Set([...a.items, ...b.items].map((item) => item.id)).size).toBe(8)
    for (const fixture of [a, b]) {
      expect(fixture.orders).toHaveLength(2)
      for (const order of fixture.orders) {
        expect(order.order_code).toContain('DEMO_ONLY_ORDER_')
        const items = fixture.items.filter((item) => item.order_id === order.id)
        expect(items).toHaveLength(2)
        expect(order.total_jpy).toBe(items.reduce((sum, item) => sum + item.quantity * item.unit_price_jpy, 0))
        for (const item of items) {
          expect(item.unit_price_jpy).toBe(PRODUCTS.find((product) => product.id === item.product_id)?.price_jpy)
          expect(item.quantity).toBeGreaterThanOrEqual(1)
          expect(item.quantity).toBeLessThanOrEqual(10)
        }
      }
    }
    expect(a.orders.every((order) => order.order_code.includes('DEMO_ONLY_ORDER_A'))).toBe(true)
  })
})

describe('fixture destination guard', () => {
  it.each(['http://127.0.0.1:54321', 'http://localhost:54321', 'http://[::1]:54321'])('allows explicit local target %s', (url) => {
    expect(validateFixtureTarget({ APP_ENV: 'local', SUPABASE_URL: url })).toBe(url)
  })

  it.each([
    {},
    { APP_ENV: 'production', SUPABASE_URL: 'http://127.0.0.1:54321' },
    { APP_ENV: 'local', SUPABASE_URL: 'https://untrusted.example.test' },
    { APP_ENV: 'local', SUPABASE_URL: 'http://localhost.evil.test:54321' },
    { APP_ENV: 'local', SUPABASE_URL: 'http://secret@localhost:54321' },
    { APP_ENV: 'local', SUPABASE_URL: 'http://localhost:54321/other' },
    { APP_ENV: 'local', SUPABASE_URL: 'http://localhost:54321?query=1' },
    { APP_ENV: 'lab', SUPABASE_URL: 'https://synthetic.supabase.co' },
    { APP_ENV: 'lab', SUPABASE_URL: 'https://synthetic.supabase.co', LAB_ENABLED: 'true', FIXTURES_ALLOW_REMOTE: 'true', FIXTURES_SYNTHETIC_ONLY: 'true', FIXTURES_ALLOWED_SUPABASE_URL: 'https://other.supabase.co' },
  ])('rejects an unapproved target without making a network request', (environment) => {
    expect(() => validateFixtureTarget(environment)).toThrow()
  })

  it('requires every remote-dedicated-lab guard and an exact HTTPS origin', () => {
    const allowed = {
      APP_ENV: 'lab', LAB_ENABLED: 'true', FIXTURES_ALLOW_REMOTE: 'true', FIXTURES_SYNTHETIC_ONLY: 'true',
      SUPABASE_URL: 'https://synthetic.supabase.co', FIXTURES_ALLOWED_SUPABASE_URL: 'https://synthetic.supabase.co',
    }
    expect(validateFixtureTarget(allowed)).toBe(allowed.SUPABASE_URL)
    for (const key of ['APP_ENV', 'LAB_ENABLED', 'FIXTURES_ALLOW_REMOTE', 'FIXTURES_SYNTHETIC_ONLY', 'FIXTURES_ALLOWED_SUPABASE_URL']) {
      expect(() => validateFixtureTarget({ ...allowed, [key]: undefined })).toThrow()
    }
  })
})
