import { type ReactNode, useMemo } from 'react'
import { ProductRepositoryProvider } from '../../features/products/repositories/ProductRepositoryContext'
import { RecipeRepositoryProvider } from '../../features/recipes/repositories/RecipeRepositoryContext'
import { MealPlanRepositoryProvider } from '../../features/meal-planner/repositories/MealPlanRepositoryContext'
import { ShoppingListRepositoryProvider } from '../../features/shopping-lists/repositories/ShoppingListRepositoryContext'
import { ApiClient } from '../../api/api-client'
import { ApiProductRepository } from '../../api/ApiProductRepository'
import { ApiRecipeRepository } from '../../api/ApiRecipeRepository'
import { ApiMealPlanRepository } from '../../api/ApiMealPlanRepository'
import { ApiShoppingListRepository } from '../../api/ApiShoppingListRepository'
import { ApiDashboardRepository } from '../../api/ApiDashboardRepository'
import { DashboardRepositoryProvider } from '../../features/dashboard/DashboardRepositoryContext'

export function AppProviders({ children }: { children: ReactNode }) {
  const repositories = useMemo(() => {
    const client = new ApiClient()
    return {
      productRepository: new ApiProductRepository(client),
      recipeRepository: new ApiRecipeRepository(client),
      mealPlanRepository: new ApiMealPlanRepository(client),
      shoppingListRepository: new ApiShoppingListRepository(client),
      dashboardRepository: new ApiDashboardRepository(client),
    }
  }, [])
  const { productRepository, recipeRepository, mealPlanRepository, shoppingListRepository, dashboardRepository } = repositories

  return <ProductRepositoryProvider repository={productRepository}><RecipeRepositoryProvider repository={recipeRepository}><MealPlanRepositoryProvider repository={mealPlanRepository}><ShoppingListRepositoryProvider repository={shoppingListRepository}><DashboardRepositoryProvider repository={dashboardRepository}>{children}</DashboardRepositoryProvider></ShoppingListRepositoryProvider></MealPlanRepositoryProvider></RecipeRepositoryProvider></ProductRepositoryProvider>
}
