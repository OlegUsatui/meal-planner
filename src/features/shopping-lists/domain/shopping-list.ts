import type { BaseUnit } from '../../products/domain/product.js'
import type { MealPlanEntry } from '../../meal-planner/types.js'
import { scaleRecipeQuantity, type MealSlot } from '../../meal-planner/domain/meal-plan.js'

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

export function buildShoppingList(
  entries: Pick<MealPlanEntry, 'id' | 'date' | 'slot' | 'recipeId' | 'servings'>[],
  recipes: ShoppingRecipe[],
  products: ShoppingProduct[],
  today: string,
): ShoppingListItem[] {
  const recipesById = new Map(recipes.map((recipe) => [recipe.id, recipe]))
  const productsById = new Map(products.map((product) => [product.id, product]))
  const grouped = new Map<string, ShoppingListItem>()

  for (const entry of entries.filter((item) => item.date >= today).sort((left, right) => left.date.localeCompare(right.date))) {
    const recipe = recipesById.get(entry.recipeId)
    if (!recipe) continue
    for (const ingredient of recipe.ingredients) {
      const product = productsById.get(ingredient.productId)
      if (!product) continue
      const quantityBase = scaleRecipeQuantity(ingredient.quantityBase, entry.servings)
      const current = grouped.get(product.id) ?? {
        productId: product.id,
        productName: product.name,
        category: product.category,
        baseUnit: product.baseUnit,
        quantityBase: 0,
        sources: [],
      }
      current.quantityBase = Math.round((current.quantityBase + quantityBase) * 1000) / 1000
      current.sources.push({ date: entry.date, slot: entry.slot, recipeId: recipe.id, recipeName: recipe.name, quantityBase })
      grouped.set(product.id, current)
    }
  }

  return [...grouped.values()].sort((left, right) => left.category.localeCompare(right.category, 'uk-UA') || left.productName.localeCompare(right.productName, 'uk-UA'))
}
