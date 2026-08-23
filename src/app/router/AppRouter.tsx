import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '../shell/AppShell'
import { PlaceholderPage } from './PlaceholderPage'

const DashboardPage = lazy(() => import('../../features/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const CookPage = lazy(() => import('../../features/recipe-suggestions/pages/CookPage').then((module) => ({ default: module.CookPage })))
const MealPlannerPage = lazy(() => import('../../features/meal-planner/pages/MealPlannerPage').then((module) => ({ default: module.MealPlannerPage })))
const MealPlanEntryPage = lazy(() => import('../../features/meal-planner/pages/MealPlanEntryPage').then((module) => ({ default: module.MealPlanEntryPage })))
const ProductEditorPage = lazy(() => import('../../features/products/pages/ProductEditorPage').then((module) => ({ default: module.ProductEditorPage })))
const ProductsPage = lazy(() => import('../../features/products/pages/ProductsPage').then((module) => ({ default: module.ProductsPage })))
const RecipeDetailPage = lazy(() => import('../../features/recipes/pages/RecipeDetailPage').then((module) => ({ default: module.RecipeDetailPage })))
const RecipeEditorPage = lazy(() => import('../../features/recipes/pages/RecipeEditorPage').then((module) => ({ default: module.RecipeEditorPage })))
const RecipesPage = lazy(() => import('../../features/recipes/pages/RecipesPage').then((module) => ({ default: module.RecipesPage })))
const ShoppingListPage = lazy(() => import('../../features/shopping-lists/pages/ShoppingListPage').then((module) => ({ default: module.ShoppingListPage })))
const SettingsPage = lazy(() => import('./SettingsPage').then((module) => ({ default: module.SettingsPage })))
const MorePage = lazy(() => import('./MorePage').then((module) => ({ default: module.MorePage })))

export const appRoutes = [
  { path: '/welcome', element: <Navigate to="/" replace /> },
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'cook', element: <CookPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/new', element: <ProductEditorPage /> },
      { path: 'products/:productId', element: <ProductEditorPage /> },
      { path: 'plan', element: <MealPlannerPage /> },
      { path: 'plan/add', element: <MealPlanEntryPage /> },
      { path: 'recipes', element: <RecipesPage /> },
      { path: 'recipes/new', element: <RecipeEditorPage /> },
      { path: 'recipes/:recipeId', element: <RecipeDetailPage /> },
      { path: 'inventory', element: <Navigate to="/products" replace /> },
      { path: 'shopping', element: <ShoppingListPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'more', element: <MorePage /> },
      { path: '*', element: <PlaceholderPage eyebrow="404" title="Сторінку не знайдено" description="Перевірте адресу або поверніться на головну." action={{ label: 'На головну', to: '/' }} /> },
    ],
  },
]

export const router = createBrowserRouter(appRoutes)
