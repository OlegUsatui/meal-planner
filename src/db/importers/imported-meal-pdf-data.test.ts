/// <reference types="node" />

import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { isIgnoredImportedIngredient, normalizeImportedIngredient } from '../../features/products/import/normalize-imported-product'

interface Ingredient { name: string; enteredQuantity: number; enteredUnit: 'g' | 'kg' | 'ml' | 'l' | 'pcs' }
interface SourceRecipe { sourcePage: number; name: string; previousNames?: string[]; image: string; preparationTimeMinMinutes: number; preparationTimeMaxMinutes: number; ingredients: Ingredient[] }

const datasets = [
  load('public/imported-recipes/breakfasts-pdf/recipes.json'),
  load('public/imported-recipes/dinners-pdf/recipes.json'),
]

describe('generated breakfast and dinner PDF data', () => {
  it('contains every unique validated source recipe and image', () => {
    expect(datasets.map((recipes) => recipes.length)).toEqual([200, 120])
    const names = datasets.flat().map((recipe) => recipe.name.trim().toLocaleLowerCase('uk-UA'))
    expect(new Set(names).size).toBe(names.length)
    for (const recipe of datasets.flat()) {
      expect(recipe.preparationTimeMinMinutes).toBeGreaterThan(0)
      expect(recipe.preparationTimeMaxMinutes).toBeGreaterThanOrEqual(recipe.preparationTimeMinMinutes)
      expect(recipe.preparationTimeMaxMinutes).toBeLessThanOrEqual(90)
      expect(existsSync(`public${recipe.image}`)).toBe(true)
    }
  })

  it('keeps only positive quantities and maps every meaningful ingredient', () => {
    for (const recipe of datasets.flat()) {
      for (const ingredient of recipe.ingredients) {
        expect(ingredient.enteredQuantity).toBeGreaterThan(0)
        const normalized = normalizeImportedIngredient(ingredient.name, ingredient.enteredQuantity, ingredient.enteredUnit)
        expect(normalized ?? isIgnoredImportedIngredient(ingredient.name)).toBeTruthy()
      }
    }
  })

  it('keeps verified titles and exact aliases for repairing previously imported OCR names', () => {
    expect(datasets[0].find((recipe) => recipe.sourcePage === 120)?.name).toBe('Боул з гречкою, яйцем і авокадо')
    expect(datasets[0].find((recipe) => recipe.sourcePage === 53)?.previousNames).toContain('Авокадо-сендвіч з хумусом лимонною ноткою р')
    expect(datasets[1].find((recipe) => recipe.sourcePage === 157)?.name).toBe('Азійський суп з фрикадельками, грибами та водоростями')
    const titles = datasets.flat().map((recipe) => recipe.name)
    expect(titles.some((name) => /ппр|орокол|соусom|г\s+г|от\s+в|(?:^|\s)арнір|(?:^|\s)ідлив|ачасником|когеап/iu.test(name))).toBe(false)
    for (const recipe of datasets.flat()) {
      expect(recipe.previousNames?.every((name) => name.trim().toLocaleLowerCase('uk-UA') !== recipe.name.trim().toLocaleLowerCase('uk-UA')) ?? true).toBe(true)
    }
    const aliases = datasets.flat().flatMap((recipe) => recipe.previousNames ?? []).map((name) => name.trim().toLocaleLowerCase('uk-UA'))
    expect(new Set(aliases).size).toBe(aliases.length)
  })
})

function load(path: string): SourceRecipe[] {
  return JSON.parse(readFileSync(path, 'utf8')) as SourceRecipe[]
}
