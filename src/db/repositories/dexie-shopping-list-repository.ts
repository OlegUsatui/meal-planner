import type { MealPlannerDatabase } from '../database'
import { buildShoppingList, type ShoppingListItem } from '../../features/shopping-lists/domain/shopping-list'
import type { ShoppingListRepository } from '../../features/shopping-lists/types'

export class DexieShoppingListRepository implements ShoppingListRepository {
  private readonly database: MealPlannerDatabase

  constructor(database: MealPlannerDatabase) {
    this.database = database
  }

  async list(today = new Intl.DateTimeFormat('sv-SE').format(new Date())): Promise<ShoppingListItem[]> {
    const [products, recipes, ingredients, entries] = await Promise.all([
      this.database.products.toArray(),
      this.database.recipes.toArray(),
      this.database.recipeIngredients.toArray(),
      this.database.mealPlanEntries.toArray(),
    ])
    const productMap = new Map(products.map((product) => [product.id, product]))
    const recipeViews = recipes.map((recipe) => ({
      id: recipe.id,
      name: recipe.name,
      ingredients: ingredients.filter((ingredient) => ingredient.recipeId === recipe.id).flatMap((ingredient) => {
        const product = productMap.get(ingredient.productId)
        return product ? [{ productId: product.id, quantityBase: ingredient.quantityBase }] : []
      }),
    }))
    return buildShoppingList(entries, recipeViews, products, today)
  }
}
