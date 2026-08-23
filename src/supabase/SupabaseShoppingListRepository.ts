import type { SupabaseClient } from '@supabase/supabase-js'
import { buildShoppingList, type ShoppingListItem } from '../features/shopping-lists/domain/shopping-list.js'
import type { ShoppingListRange, ShoppingListRepository } from '../features/shopping-lists/types.js'
import { currentUserId } from './common.js'

interface ProductRow { id: string; name: string; category: string; base_unit: 'g' | 'ml' | 'pcs' }
interface RecipeRow { id: string; name: string }
interface IngredientRow { recipe_id: string; product_id: string; quantity_base: number | string }
interface PlanRow { date: string; slot: 'breakfast' | 'lunch' | 'dinner' | 'snack'; recipe_id: string }

export class SupabaseShoppingListRepository implements ShoppingListRepository {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient) { this.client = client }

  async list(range: ShoppingListRange): Promise<ShoppingListItem[]> {
    const ownerId = await currentUserId(this.client)
    let entriesQuery = this.client.from('meal_plan_entries').select('date,slot,recipe_id').eq('owner_id', ownerId).gte('date', range.from)
    if (range.to) entriesQuery = entriesQuery.lte('date', range.to)
    const { data: entries, error: entriesError } = await entriesQuery
    if (entriesError) throw new Error('Не вдалося завантажити список покупок.')
    const entryRows = (entries ?? []) as unknown as PlanRow[]
    if (!entryRows.length) return []
    const recipeIds = [...new Set(entryRows.map((entry) => entry.recipe_id))]
    const [{ data: recipes, error: recipesError }, { data: ingredients, error: ingredientsError }] = await Promise.all([
      this.client.from('recipes').select('id,name').in('id', recipeIds),
      this.client.from('recipe_ingredients').select('recipe_id,product_id,quantity_base').in('recipe_id', recipeIds),
    ])
    if (recipesError || ingredientsError) throw new Error('Не вдалося завантажити список покупок.')
    const recipeRows = (recipes ?? []) as unknown as RecipeRow[]
    const ingredientRows = (ingredients ?? []) as unknown as IngredientRow[]
    const productIds = [...new Set(ingredientRows.map((ingredient) => ingredient.product_id))]
    if (!productIds.length) return []
    const { data: products, error: productsError } = await this.client.from('products').select('*').in('id', productIds)
    if (productsError) throw new Error('Не вдалося завантажити список покупок.')
    const productRows = (products ?? []) as unknown as ProductRow[]
    const recipeViews = recipeRows.map((recipe) => ({ id: recipe.id, name: recipe.name, ingredients: ingredientRows.filter((ingredient) => ingredient.recipe_id === recipe.id).flatMap((ingredient) => { const product = productRows.find((item) => item.id === ingredient.product_id); return product ? [{ productId: product.id, quantityBase: Number(ingredient.quantity_base) }] : [] }) }))
    return buildShoppingList(entryRows.map((entry) => ({ id: `${entry.date}:${entry.slot}`, date: entry.date, slot: entry.slot, recipeId: entry.recipe_id, createdAt: '', updatedAt: '' })), recipeViews, productRows.map((product) => ({ id: product.id, name: product.name, normalizedName: product.name.toLocaleLowerCase('uk-UA'), category: product.category, baseUnit: product.base_unit, archivedAt: null, createdAt: '', updatedAt: '' })), range.from, new Date())
  }
}
