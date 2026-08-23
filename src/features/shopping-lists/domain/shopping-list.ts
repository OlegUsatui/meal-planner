import type { BaseUnit } from '../../products/domain/product.js'
import type { MealPlanEntry } from '../../meal-planner/types.js'
import { type MealSlot } from '../../meal-planner/domain/meal-plan.js'

export interface ShoppingRecipeIngredient {
  productId: string
  quantityBase: number
}

export interface ShoppingRecipe {
  id: string
  name: string
  ingredients: ShoppingRecipeIngredient[]
}

export interface ShoppingProduct {
  id: string
  name: string
  category: string
  baseUnit: BaseUnit
}

export interface ShoppingSource {
  date: string
  slot: MealSlot
  recipeId: string
  recipeName: string
  servings: number
  quantityBase: number
}

export interface ShoppingListItem {
  productId: string
  productName: string
  category: string
  baseUnit: BaseUnit
  quantityBase: number
  sources: ShoppingSource[]
}

export type ShoppingServingOverrides = Record<string, number>

export function shoppingSourceKey(source: Pick<ShoppingSource, 'date' | 'slot' | 'recipeId'>): string {
  return `${source.date}:${source.slot}:${source.recipeId}`
}

export function applyShoppingServingOverrides(items: ShoppingListItem[], overrides: ShoppingServingOverrides): ShoppingListItem[] {
  return items.map((item) => {
    const sources = item.sources.map((source) => {
      const servings = overrides[shoppingSourceKey(source)] ?? source.servings
      const quantityBase = Math.round((source.quantityBase / source.servings * servings) * 1000) / 1000
      return { ...source, servings, quantityBase }
    })
    return { ...item, quantityBase: Math.round(sources.reduce((total, source) => total + source.quantityBase, 0) * 1000) / 1000, sources }
  })
}

export function buildShoppingList(
  entries: Pick<MealPlanEntry, 'id' | 'date' | 'slot' | 'recipeId'>[],
  recipes: ShoppingRecipe[],
  products: ShoppingProduct[],
  today: string,
  currentDateTime?: Date,
): ShoppingListItem[] {
  const recipesById = new Map(recipes.map((recipe) => [recipe.id, recipe]))
  const productsById = new Map(products.map((product) => [product.id, product]))
  const grouped = new Map<string, ShoppingListItem>()

  for (const entry of entries.filter((item) => isShoppingEntryRelevant(item.date, item.slot, today, currentDateTime)).sort((left, right) => left.date.localeCompare(right.date))) {
    const recipe = recipesById.get(entry.recipeId)
    if (!recipe) continue
    for (const ingredient of recipe.ingredients) {
      const product = productsById.get(ingredient.productId)
      if (!product) continue
      const quantityBase = ingredient.quantityBase
      const current = grouped.get(product.id) ?? {
        productId: product.id,
        productName: product.name,
        category: product.category,
        baseUnit: product.baseUnit,
        quantityBase: 0,
        sources: [],
      }
      current.quantityBase = Math.round((current.quantityBase + quantityBase) * 1000) / 1000
      current.sources.push({ date: entry.date, slot: entry.slot, recipeId: recipe.id, recipeName: recipe.name, servings: 1, quantityBase })
      grouped.set(product.id, current)
    }
  }

  return [...grouped.values()].sort((left, right) => left.category.localeCompare(right.category, 'uk-UA') || left.productName.localeCompare(right.productName, 'uk-UA'))
}

/** Excludes meals that have already passed today; future dates remain fully included. */
export function isShoppingEntryRelevant(date: string, slot: MealSlot, today: string, currentDateTime?: Date): boolean {
  if (date < today) return false
  if (date > today || !currentDateTime) return true
  const localToday = new Intl.DateTimeFormat('sv-SE').format(currentDateTime)
  if (date !== localToday) return true
  const minutes = currentDateTime.getHours() * 60 + currentDateTime.getMinutes()
  const cutoff = slot === 'breakfast' ? 9 * 60 : slot === 'lunch' ? 13 * 60 : slot === 'dinner' ? 18 * 60 : undefined
  return cutoff === undefined || minutes < cutoff
}
