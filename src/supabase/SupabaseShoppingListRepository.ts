import type { SupabaseClient } from '@supabase/supabase-js'
import { buildShoppingList, type ShoppingListItem } from '../features/shopping-lists/domain/shopping-list.js'
import type { ShoppingListRepository } from '../features/shopping-lists/types.js'
import { currentUserId } from './common.js'

interface ProductRow { id: string; name: string; category: string; base_unit: 'g' | 'ml' | 'pcs' }
interface RecipeRow { id: string; name: string }
interface IngredientRow { recipe_id: string; product_id: string; quantity_base: number | string }
interface PlanRow { date: string; slot: 'breakfast' | 'lunch' | 'dinner' | 'snack'; recipe_id: string; servings: number }

export class SupabaseShoppingListRepository implements ShoppingListRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) { this.client = client }

  async list(today = new Intl.DateTimeFormat('sv-SE').format(new Date())): Promise<ShoppingListItem[]> {
    const ownerId = await currentUserId(this.client)
    const [{ data: products, error: productsError }, { data: recipes, error: recipesError }, { data: ingredients, error: ingredientsError }, { data: entries, error: entriesError }] = await Promise.all([
      this.client.from('products').select('*'),
      this.client.from('recipes').select('id,name'),
      this.client.from('recipe_ingredients').select('recipe_id,product_id,quantity_base'),
      this.client.from('meal_plan_entries').select('date,slot,recipe_id,servings').eq('owner_id', ownerId).gte('date', today),
    ])
    if (productsError || recipesError || ingredientsError || entriesError) throw new Error('Не вдалося завантажити список покупок.')
    const productRows = products as unknown as ProductRow[]; const recipeRows = recipes as unknown as RecipeRow[]
    const ingredientRows = ingredients as unknown as IngredientRow[]; const entryRows = entries as unknown as PlanRow[]
    const recipeViews = recipeRows.map((recipe) => ({ id: recipe.id, name: recipe.name, ingredients: ingredientRows.filter((ingredient) => ingredient.recipe_id === recipe.id).flatMap((ingredient) => { const product = productRows.find((item) => item.id === ingredient.product_id); return product ? [{ productId: product.id, quantityBase: Number(ingredient.quantity_base) }] : [] }) }))
    return buildShoppingList(entryRows.map((entry) => ({ id: `${entry.date}:${entry.slot}`, date: entry.date, slot: entry.slot, recipeId: entry.recipe_id, servings: entry.servings, createdAt: '', updatedAt: '' })), recipeViews, productRows.map((product) => ({ id: product.id, name: product.name, normalizedName: product.name.toLocaleLowerCase('uk-UA'), category: product.category, baseUnit: product.base_unit, archivedAt: null, createdAt: '', updatedAt: '' })), today)
  }
}
