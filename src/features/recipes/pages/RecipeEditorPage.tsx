import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { RecipeForm } from '../components/RecipeForm'
import { useRecipeRepository } from '../repositories/useRecipeRepository'
import { useProductRepository } from '../../products/repositories/useProductRepository'
import { useOptionalAuth } from '../../auth/useAuth'
import { cacheTimes, queryKeys } from '../../../app/query/query-client'
import { invalidateRecipeData } from '../../../app/query/invalidation'

export function RecipeEditorPage() {
  const { recipeId } = useParams(); const navigate = useNavigate(); const [searchParams] = useSearchParams(); const recipes = useRecipeRepository(); const productsRepo = useProductRepository(); const auth = useOptionalAuth(); const isAdmin = auth?.isAdmin ?? false; const userId = auth?.session?.user.id ?? 'test-session'; const queryClient = useQueryClient(); const editing = Boolean(recipeId)
  const productsQuery = useQuery({ queryKey: queryKeys.products(userId, { includeArchived: isAdmin }), queryFn: ({ signal }) => productsRepo.list({ includeArchived: isAdmin }, signal), staleTime: cacheTimes.catalogueStale, refetchOnWindowFocus: false })
  const recipeQuery = useQuery({ queryKey: queryKeys.recipe(userId, recipeId ?? 'new'), queryFn: ({ signal }) => recipes.get(recipeId!, signal), staleTime: cacheTimes.catalogueStale, refetchOnWindowFocus: false, enabled: editing })
  const recipe = recipeQuery.data
  const error = recipeQuery.isError ? 'Не вдалося знайти рецепт' : productsQuery.isError ? 'Не вдалося завантажити продукти' : undefined
  const save = async (input: Parameters<typeof recipes.create>[0] | Parameters<typeof recipes.update>[1]) => {
    if (recipeId) {
      const updated = await recipes.update(recipeId, input)
      queryClient.setQueryData(queryKeys.recipe(userId, recipeId), updated)
      await invalidateRecipeData(queryClient, userId, recipeId)
      navigate(safeReturnTo(searchParams.get('returnTo')) ?? `/recipes/${recipeId}?saved=1`, { replace: true })
    } else {
      const created = await recipes.create(input as Parameters<typeof recipes.create>[0])
      queryClient.setQueryData(queryKeys.recipe(userId, created.id), created)
      await invalidateRecipeData(queryClient, userId, created.id)
      navigate(`/recipes/${created.id}?created=1`, { replace: true })
    }
  }
  if ((editing && recipeQuery.isPending) || productsQuery.isPending) return <div className="loading-panel">Завантажуємо рецепт…</div>
  const products = productsQuery.data ?? []
  return <section className="page editor-page"><Link className="back-link" to="/recipes"><ArrowLeft aria-hidden="true" /> До рецептів</Link><header className="editor-header"><p className="eyebrow">{editing ? 'Редагування' : 'Нова страва'}</p><h1>{editing ? recipe?.name : 'Створити рецепт'}</h1></header>{products.length ? <RecipeForm products={products} recipe={recipe} onSubmit={save} error={error} /> : error ? <div className="form-alert" role="alert">{error}</div> : <div className="empty-state"><h2>Спершу додайте продукти</h2><Link className="button button-primary" to="/products">Відкрити продукти</Link></div>}</section>
}

function safeReturnTo(value: string | null): string | undefined { return value?.startsWith('/') && !value.startsWith('//') ? value : undefined }
