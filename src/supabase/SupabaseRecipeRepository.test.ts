import { createClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { SupabaseRecipeRepository } from './SupabaseRecipeRepository'
import type { R2Storage } from '../../api/_lib/r2'

describe('SupabaseRecipeRepository.listPage', () => {
  it('serializes JSONB classification filters as JSON', async () => {
    const urls: string[] = []
    const recipe = {
      id: 'seed:breakfast:69', owner_id: null, name: 'Benedict', normalized_name: 'benedict',
      image_path: 'system/seed-breakfast-69.webp', image_mime_type: 'image/webp', image_width: 1, image_height: 1,
      image_byte_size: 1, instructions: 'Cook', classifications: [{ mealType: 'breakfast', subcategoryId: 'eggs' }],
      archived_at: null, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
      calories_per_serving: null, protein_grams_per_serving: null, fat_grams_per_serving: null,
      carbs_grams_per_serving: null, preparation_time_min_minutes: 5, preparation_time_max_minutes: 5,
    }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input); urls.push(url)
      if (url.includes('/recipe_ingredients?')) return new Response('[]', { status: 200 })
      return new Response(JSON.stringify([recipe]), { status: 200, headers: { 'content-range': '0-0/1' } })
    })
    const storage = { imageUrl: vi.fn().mockResolvedValue('https://images.example/recipe.webp') } as unknown as R2Storage
    const repository = new SupabaseRecipeRepository(createClient('https://example.supabase.co', 'test-key'), storage)

    const result = await repository.listPage('', { page: 1, pageSize: 24, mealType: 'breakfast', uncategorized: false })

    expect(result.total).toBe(1)
    expect(result.items[0]?.id).toBe('seed:breakfast:69')
    expect(result.items[0]).not.toHaveProperty('instructions')
    expect(result.items[0]).not.toHaveProperty('ingredients')
    expect(result.items[0]).not.toHaveProperty('caloriesPerServing')
    expect(urls.some((url) => url.includes('/recipe_ingredients?'))).toBe(false)
    expect(urls.some((url) => url.includes('classifications=cs.%5B%7B%22mealType%22%3A%22breakfast%22%7D%5D'))).toBe(true)
    expect(urls.some((url) => url.includes('[object+Object]'))).toBe(false)
    fetchMock.mockRestore()
  })

  it('returns only system recipe summaries when requested', async () => {
    const urls: string[] = []
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      urls.push(String(input))
      return new Response('[]', { status: 200, headers: { 'content-range': '*/0' } })
    })
    const repository = new SupabaseRecipeRepository(
      createClient('https://example.supabase.co', 'test-key'),
      { imageUrl: vi.fn() } as unknown as R2Storage,
    )

    await repository.listPage('', { page: 1, pageSize: 24, systemOnly: true })

    expect(urls.some((url) => url.includes('owner_id=is.null'))).toBe(true)
    fetchMock.mockRestore()
  })
})
