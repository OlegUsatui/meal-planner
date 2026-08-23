import { createClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { SupabaseRecipeRepository } from './SupabaseRecipeRepository'
import type { R2Storage } from '../../api/_lib/r2'

describe('SupabaseRecipeRepository.listByProductIds', () => {
  it('finds matching active recipe summaries and orders them by name', async () => {
    const urls: string[] = []
    const ingredientRows = [{ recipe_id: 'recipe-1' }, { recipe_id: 'recipe-1' }, { recipe_id: 'recipe-2' }]
    const recipes = [
      { id: 'recipe-2', owner_id: null, name: 'Борщ', image_path: null, image_mime_type: null, image_width: null, image_height: null, image_byte_size: null, preparation_time_min_minutes: 20, preparation_time_max_minutes: 20, classifications: [], archived_at: null },
      { id: 'recipe-1', owner_id: 'user-1', name: 'Омлет', image_path: null, image_mime_type: null, image_width: null, image_height: null, image_byte_size: null, preparation_time_min_minutes: 5, preparation_time_max_minutes: 5, classifications: [], archived_at: null },
    ]
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input)
      urls.push(url)
      if (url.includes('/products?')) return new Response(JSON.stringify([{ id: 'product-2' }, { id: 'product-1' }]), { status: 200 })
      if (url.includes('/recipe_ingredients?')) return new Response(JSON.stringify(ingredientRows), { status: 200 })
      return new Response(JSON.stringify(recipes), { status: 200 })
    })
    const repository = new SupabaseRecipeRepository(
      createClient('https://example.supabase.co', 'test-key'),
      { imageUrl: vi.fn() } as unknown as R2Storage,
    )

    const result = await repository.listByProductIds(['product-2', 'product-1'])

    expect(result.map((recipe) => recipe.name)).toEqual(['Борщ', 'Омлет'])
    expect(urls.some((url) => url.includes('product_id=in.%28product-2%2Cproduct-1%29'))).toBe(true)
    expect(urls.some((url) => url.includes('archived_at=is.null') && url.includes('/products?'))).toBe(true)
    expect(urls.some((url) => url.includes('archived_at=is.null'))).toBe(true)
    fetchMock.mockRestore()
  })

  it('returns no requests for recipes when no ingredient matches', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }))
    const repository = new SupabaseRecipeRepository(
      createClient('https://example.supabase.co', 'test-key'),
      { imageUrl: vi.fn() } as unknown as R2Storage,
    )

    expect(await repository.listByProductIds(['missing-product'])).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    fetchMock.mockRestore()
  })
})
