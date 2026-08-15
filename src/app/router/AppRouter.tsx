import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '../shell/AppShell'
import { PlaceholderPage } from './PlaceholderPage'
import { RequireOnboarding } from './RequireOnboarding'

const DashboardPage = lazy(() => import('../../features/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const MealPlannerPage = lazy(() => import('../../features/meal-planner/pages/MealPlannerPage').then((module) => ({ default: module.MealPlannerPage })))
const MealPlanEntryPage = lazy(() => import('../../features/meal-planner/pages/MealPlanEntryPage').then((module) => ({ default: module.MealPlanEntryPage })))
const OnboardingPage = lazy(() => import('../../features/onboarding/OnboardingPage').then((module) => ({ default: module.OnboardingPage })))
const ProductEditorPage = lazy(() => import('../../features/products/pages/ProductEditorPage').then((module) => ({ default: module.ProductEditorPage })))
const ProductsPage = lazy(() => import('../../features/products/pages/ProductsPage').then((module) => ({ default: module.ProductsPage })))
const RecipeDetailPage = lazy(() => import('../../features/recipes/pages/RecipeDetailPage').then((module) => ({ default: module.RecipeDetailPage })))
const RecipeEditorPage = lazy(() => import('../../features/recipes/pages/RecipeEditorPage').then((module) => ({ default: module.RecipeEditorPage })))
const RecipesPage = lazy(() => import('../../features/recipes/pages/RecipesPage').then((module) => ({ default: module.RecipesPage })))
const ShoppingListPage = lazy(() => import('../../features/shopping-lists/pages/ShoppingListPage').then((module) => ({ default: module.ShoppingListPage })))
const SettingsPage = lazy(() => import('./SettingsPage').then((module) => ({ default: module.SettingsPage })))
const MorePage = lazy(() => import('./MorePage').then((module) => ({ default: module.MorePage })))

export const router = createBrowserRouter([
  { path: '/welcome', element: <OnboardingPage /> },
  {
    path: '/',
    element: <RequireOnboarding><AppShell /></RequireOnboarding>,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/new', element: <ProductEditorPage /> },
      { path: 'products/:productId', element: <ProductEditorPage /> },
      { path: 'plan', element: <MealPlannerPage /> },
      { path: 'plan/add', element: <MealPlanEntryPage /> },
      { path: 'recipes', element: <RecipesPage /> },
      { path: 'recipes/new', element: <RecipeEditorPage /> },
      { path: 'recipes/:recipeId', element: <RecipeDetailPage /> },
      { path: 'recipes/:recipeId/edit', element: <RecipeEditorPage /> },
      { path: 'inventory', element: <Navigate to="/products" replace /> },
      { path: 'shopping', element: <ShoppingListPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'more', element: <MorePage /> },
      { path: '*', element: <PlaceholderPage eyebrow="404" title="Сторінку не знайдено" description="Перевірте адресу або поверніться на головну." action={{ label: 'На головну', to: '/' }} /> },
    ],
  },
])
