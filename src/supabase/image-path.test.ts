import { describe, expect, it } from 'vitest'
import { isOwnedRecipeImagePath } from './image-path'

describe('recipe image upload path ownership', () => {
  it('accepts only the current user recipe path', () => {
    expect(isOwnedRecipeImagePath('user-1', 'recipe-1', 'user-1/recipe-1.webp', 'create')).toBe(true)
    expect(isOwnedRecipeImagePath('user-1', 'recipe-1', 'user-2/recipe-1.webp', 'create')).toBe(false)
    expect(isOwnedRecipeImagePath('user-1', 'recipe-1', 'user-1/other.webp', 'create')).toBe(false)
    expect(isOwnedRecipeImagePath('user-1', 'recipe-1', 'user-1/recipe-1-1720000000000.webp', 'update')).toBe(true)
    expect(isOwnedRecipeImagePath('user-1', 'recipe-1', 'user-1/recipe-1.webp', 'update')).toBe(false)
  })
})
