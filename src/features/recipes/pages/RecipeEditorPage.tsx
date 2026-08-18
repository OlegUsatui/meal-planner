import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { RecipeForm } from '../components/RecipeForm'
import { useRecipeRepository } from '../repositories/useRecipeRepository'
import { useProductRepository } from '../../products/repositories/useProductRepository'
import { useOptionalAuth } from '../../auth/useAuth'
import { cacheTimes, queryKeys } from '../../../app/query/query-client'
import { invalidateRecipeData } from '../../../app/query/invalidation'
import { BackLink } from '../../../shared/ui/BackLink'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { ButtonLink } from '../../../shared/ui/ButtonLink'
import { Alert } from '../../../shared/ui/Alert'

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
  if (productsQuery.isPending) return <LoadingState>Завантажуємо продукти…</LoadingState>
  const products = productsQuery.data ?? []
  return <section className="page editor-page"><BackLink to="/recipes">До рецептів</BackLink><PageHeader className="editor-page-header" eyebrow="Нова страва" title="Створити рецепт" />{products.length ? <RecipeForm products={products} onSubmit={save} error={error} /> : error ? <Alert variant="error">{error}</Alert> : <EmptyState title="Спершу додайте продукти" action={<ButtonLink to="/products">Відкрити продукти</ButtonLink>} />}</section>
}
