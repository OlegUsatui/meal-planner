import { type ReactNode } from 'react'
import { ProductRepositoryProvider } from '../../features/products/repositories/ProductRepositoryContext'
import { RecipeRepositoryProvider } from '../../features/recipes/repositories/RecipeRepositoryContext'
import { MealPlanRepositoryProvider } from '../../features/meal-planner/repositories/MealPlanRepositoryContext'
import { ShoppingListRepositoryProvider } from '../../features/shopping-lists/repositories/ShoppingListRepositoryContext'
import { requireSupabase } from '../../lib/supabase'
import { SupabaseProductRepository } from '../../supabase/SupabaseProductRepository'
import { SupabaseRecipeRepository } from '../../supabase/SupabaseRecipeRepository'
import { SupabaseMealPlanRepository } from '../../supabase/SupabaseMealPlanRepository'
import { SupabaseShoppingListRepository } from '../../supabase/SupabaseShoppingListRepository'

export function AppProviders({ children }: { children: ReactNode }) {
  const client = requireSupabase()
  const productRepository = new SupabaseProductRepository(client)
  const recipeRepository = new SupabaseRecipeRepository(client)
  const mealPlanRepository = new SupabaseMealPlanRepository(client)
  const shoppingListRepository = new SupabaseShoppingListRepository(client)
  return <ProductRepositoryProvider repository={productRepository}><RecipeRepositoryProvider repository={recipeRepository}><MealPlanRepositoryProvider repository={mealPlanRepository}><ShoppingListRepositoryProvider repository={shoppingListRepository}>{children}</ShoppingListRepositoryProvider></MealPlanRepositoryProvider></RecipeRepositoryProvider></ProductRepositoryProvider>
}
