import { type ReactNode } from 'react'
import { ProductRepositoryProvider } from '../../features/products/repositories/ProductRepositoryContext'
import { RecipeRepositoryProvider } from '../../features/recipes/repositories/RecipeRepositoryContext'
import { MealPlanRepositoryProvider } from '../../features/meal-planner/repositories/MealPlanRepositoryContext'
import { ShoppingListRepositoryProvider } from '../../features/shopping-lists/repositories/ShoppingListRepositoryContext'
import { ApiClient } from '../../api/api-client'
import { ApiProductRepository } from '../../api/ApiProductRepository'
import { ApiRecipeRepository } from '../../api/ApiRecipeRepository'
import { ApiMealPlanRepository } from '../../api/ApiMealPlanRepository'
import { ApiShoppingListRepository } from '../../api/ApiShoppingListRepository'

export function AppProviders({ children }: { children: ReactNode }) {
  const client = new ApiClient()
  const productRepository = new ApiProductRepository(client)
  const recipeRepository = new ApiRecipeRepository(client)
  const mealPlanRepository = new ApiMealPlanRepository(client)
  const shoppingListRepository = new ApiShoppingListRepository(client)
  return <ProductRepositoryProvider repository={productRepository}><RecipeRepositoryProvider repository={recipeRepository}><MealPlanRepositoryProvider repository={mealPlanRepository}><ShoppingListRepositoryProvider repository={shoppingListRepository}>{children}</ShoppingListRepositoryProvider></MealPlanRepositoryProvider></RecipeRepositoryProvider></ProductRepositoryProvider>
}
