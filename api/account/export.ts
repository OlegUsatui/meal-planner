import type { AccountExportManifestV1 } from '../../src/features/account/types.js'
import { R2Storage } from '../_lib/r2.js'
import { authorized } from '../_lib/routes.js'
import type { ApiRequest, ApiResponse } from '../_lib/http.js'

interface RecipeRow { id: string; owner_id: string | null; name: string; image_path: string | null }
interface ProductRow { id: string; owner_id: string | null; name: string }
interface IngredientRow { recipe_id: string; product_id: string }
interface PlanRow { recipe_id: string }

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  await authorized(request, response, async ({ client, user }) => {
    const [profile, recipesResult, productsResult, ingredientsResult, planResult] = await Promise.all([
      client.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      client.from('recipes').select('*'),
      client.from('products').select('*'),
      client.from('recipe_ingredients').select('*'),
      client.from('meal_plan_entries').select('*').eq('owner_id', user.id),
    ])
    if (profile.error || recipesResult.error || productsResult.error || ingredientsResult.error || planResult.error) throw new Error('Не вдалося підготувати експорт')
    const recipes = (recipesResult.data ?? []) as unknown as RecipeRow[]; const products = (productsResult.data ?? []) as unknown as ProductRow[]
    const ingredients = (ingredientsResult.data ?? []) as unknown as IngredientRow[]; const plan = (planResult.data ?? []) as unknown as PlanRow[]
    const personalRecipes = recipes.filter((recipe) => recipe.owner_id === user.id); const personalProducts = products.filter((product) => product.owner_id === user.id)
    const personalRecipeIds = new Set(personalRecipes.map((recipe) => recipe.id)); const relevantIngredients = ingredients.filter((item) => personalRecipeIds.has(item.recipe_id))
    const referencedRecipeIds = new Set(plan.map((entry) => entry.recipe_id)); const referencedProductIds = new Set(relevantIngredients.map((item) => item.product_id))
    const storage = new R2Storage()
    const images = (await Promise.all(personalRecipes.flatMap((recipe) => recipe.image_path ? [{ recipe, promise: storage.imageUrl(recipe.image_path, 300) }] : []).map(async ({ recipe, promise }) => { const signedUrl = await promise; return signedUrl && recipe.image_path ? { path: recipe.image_path, fileName: `images/${safeFileName(recipe.id)}.webp`, signedUrl } : undefined }))).filter((item): item is NonNullable<typeof item> => Boolean(item))
    const manifest: AccountExportManifestV1 = { version: 1, exportedAt: new Date().toISOString(), account: { id: user.id, email: user.email ?? null }, data: { profile: profile.data, recipes: personalRecipes, products: personalProducts, recipeIngredients: relevantIngredients, mealPlanEntries: plan }, references: { recipes: recipes.filter((recipe) => recipe.owner_id === null && referencedRecipeIds.has(recipe.id)).map(({ id, name }) => ({ id, name })), products: products.filter((product) => product.owner_id === null && referencedProductIds.has(product.id)).map(({ id, name }) => ({ id, name })) }, images }
    return manifest
  }, 200, ['GET'])
}

function safeFileName(value: string): string { return value.replace(/[^a-zA-Z0-9_-]/gu, '_') }
