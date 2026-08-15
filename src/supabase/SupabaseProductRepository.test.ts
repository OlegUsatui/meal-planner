import { createClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { SupabaseProductRepository } from './SupabaseProductRepository'

describe('SupabaseProductRepository.list', () => {
  it('loads visible ingredient usage without putting every product id in the request URL', async () => {
    const urls: string[] = []
    const products = [
      productRow('product-1', 'Apple'),
      productRow('product-2', 'Banana'),
    ]
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input)
      urls.push(url)
      if (url.includes('/recipe_ingredients?')) {
        return new Response(JSON.stringify([{ product_id: 'product-1' }, { product_id: 'product-1' }]), { status: 200 })
      }
      return new Response(JSON.stringify(products), { status: 200 })
    })
    const repository = new SupabaseProductRepository(createClient('https://example.supabase.co', 'test-key'))

    const result = await repository.list()

    expect(result.map((product) => product.recipeUsageCount)).toEqual([2, 0])
    expect(urls.find((url) => url.includes('/recipe_ingredients?'))).not.toContain('product_id=in.')
    fetchMock.mockRestore()
  })
})

function productRow(id: string, name: string) {
  return {
    id,
    owner_id: null,
    name,
    normalized_name: name.toLowerCase(),
    category: 'Fruit',
    base_unit: 'g',
    archived_at: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  }
}
