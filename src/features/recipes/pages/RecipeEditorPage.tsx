import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { RecipeForm } from '../components/RecipeForm'
import { useRecipeRepository } from '../repositories/useRecipeRepository'
import { useProductRepository } from '../../products/repositories/useProductRepository'
import { useOptionalAuth } from '../../auth/useAuth'
import { cacheTimes, queryKeys } from '../../../app/query/query-client'
import { invalidateRecipeData } from '../../../app/query/invalidation'

export function RecipeEditorPage() {
  const navigate = useNavigate(); const recipes = useRecipeRepository(); const productsRepo = useProductRepository(); const auth = useOptionalAuth(); const isAdmin = auth?.isAdmin ?? false; const userId = auth?.session?.user.id ?? 'test-session'; const queryClient = useQueryClient()
  const productsQuery = useQuery({ queryKey: queryKeys.products(userId, { includeArchived: isAdmin }), queryFn: ({ signal }) => productsRepo.list({ includeArchived: isAdmin }, signal), staleTime: cacheTimes.catalogueStale, refetchOnWindowFocus: false })
  const error = productsQuery.isError ? 'Не вдалося завантажити продукти' : undefined
  const save = async (input: Parameters<typeof recipes.create>[0]) => {
    const created = await recipes.create(input)
    queryClient.setQueryData(queryKeys.recipe(userId, created.id), created)
    await invalidateRecipeData(queryClient, userId, created.id)
    navigate(`/recipes/${created.id}?created=1`, { replace: true })
  }
  if (productsQuery.isPending) return <div className="loading-panel">Завантажуємо продукти…</div>
  const products = productsQuery.data ?? []
  return <section className="page editor-page"><Link className="back-link" to="/recipes"><ArrowLeft aria-hidden="true" /> До рецептів</Link><header className="editor-header"><p className="eyebrow">Нова страва</p><h1>Створити рецепт</h1></header>{products.length ? <RecipeForm products={products} onSubmit={save} error={error} /> : error ? <div className="form-alert" role="alert">{error}</div> : <div className="empty-state"><h2>Спершу додайте продукти</h2><Link className="button button-primary" to="/products">Відкрити продукти</Link></div>}</section>
}
