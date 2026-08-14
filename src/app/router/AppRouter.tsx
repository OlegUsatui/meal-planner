import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProductEditorPage } from '../../features/products/pages/ProductEditorPage'
import { ProductsPage } from '../../features/products/pages/ProductsPage'
import { RecipesPage } from '../../features/recipes/pages/RecipesPage'
import { RecipeEditorPage } from '../../features/recipes/pages/RecipeEditorPage'
import { RecipeDetailPage } from '../../features/recipes/pages/RecipeDetailPage'
import { AppShell } from '../shell/AppShell'
import { DashboardPage } from './DashboardPage'
import { PlaceholderPage } from './PlaceholderPage'
import { MealPlannerPage } from '../../features/meal-planner/pages/MealPlannerPage'
import { ShoppingListPage } from '../../features/shopping-lists/pages/ShoppingListPage'
import { SettingsPage } from './SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/new', element: <ProductEditorPage /> },
      { path: 'products/:productId', element: <ProductEditorPage /> },
      { path: 'plan', element: <MealPlannerPage /> },
      { path: 'recipes', element: <RecipesPage /> },
      { path: 'recipes/new', element: <RecipeEditorPage /> },
      { path: 'recipes/:recipeId', element: <RecipeDetailPage /> },
      { path: 'recipes/:recipeId/edit', element: <RecipeEditorPage /> },
      { path: 'inventory', element: <Navigate to="/products" replace /> },
      { path: 'shopping', element: <ShoppingListPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <PlaceholderPage eyebrow="404" title="Сторінку не знайдено" description="Перевірте адресу або поверніться на головну." action={{ label: 'На головну', to: '/' }} /> },
    ],
  },
])
