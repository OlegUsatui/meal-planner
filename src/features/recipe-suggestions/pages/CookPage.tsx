import { useQuery } from '@tanstack/react-query'
import { ChefHat, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { cacheTimes, queryKeys } from '../../../app/query/query-client'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { FoodIllustration } from '../../../shared/ui/FoodIllustration'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { MediaPlaceholder } from '../../../shared/ui/MediaPlaceholder'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { RetryBanner } from '../../../shared/ui/RetryBanner'
import { SearchField } from '../../../shared/ui/SearchField'
import { useOptionalAuth } from '../../auth/useAuth'
import { getRecipeSubcategory } from '../../recipes/domain/recipe-taxonomy'
import { formatPreparationTime } from '../../recipes/domain/recipe'
import type { RecipeSummary } from '../../recipes/types'
import { useProductRepository } from '../../products/repositories/useProductRepository'
import type { Product } from '../../products/types'
import { normalizeProductIds } from '../domain/recipe-suggestions'
import { useRecipeSuggestionRepository } from '../repositories/useRecipeSuggestionRepository'

export function CookPage() {
  const productRepository = useProductRepository()
  const suggestionRepository = useRecipeSuggestionRepository()
  const userId = useOptionalAuth()?.session?.user.id ?? 'test-session'
  const [searchParams, setSearchParams] = useSearchParams()
  const [productQuery, setProductQuery] = useState('')
  const selectedProductIds = selectedIds(searchParams.get('productIds'))
  const productsQuery = useQuery({
    queryKey: queryKeys.products(userId, { includeArchived: false }),
    queryFn: ({ signal }) => productRepository.list({ includeArchived: false }, signal),
    staleTime: cacheTimes.catalogueStale,
    refetchOnWindowFocus: false,
  })
  const suggestionsQuery = useQuery({
    queryKey: queryKeys.recipeSuggestions(userId, selectedProductIds),
    queryFn: ({ signal }) => suggestionRepository.listByProductIds(selectedProductIds, signal),
    enabled: selectedProductIds.length > 0,
    staleTime: cacheTimes.catalogueStale,
    refetchOnWindowFocus: false,
  })
  const products = useMemo(
    () => (productsQuery.data ?? []).filter((product) => product.archivedAt === null),
    [productsQuery.data],
  )
  const visibleProducts = useMemo(() => {
    const query = productQuery.trim().toLocaleLowerCase('uk-UA')
    return query ? products.filter((product) => product.normalizedName.includes(query) || selectedProductIds.includes(product.id)) : products
  }, [productQuery, products, selectedProductIds])
  const selectedProducts = useMemo(
    () => selectedProductIds.map((id) => products.find((product) => product.id === id)).filter((product): product is Product => Boolean(product)),
    [products, selectedProductIds],
  )
  const updateSelection = (productId: string, checked: boolean) => {
    const next = checked
      ? [...selectedProductIds, productId]
      : selectedProductIds.filter((selectedId) => selectedId !== productId)
    setSearchParams((current) => {
      const updated = new URLSearchParams(current)
      if (next.length) updated.set('productIds', next.join(','))
      else updated.delete('productIds')
      return updated
    }, { replace: true })
  }
  const clearSelection = () => setSearchParams((current) => {
    const updated = new URLSearchParams(current)
    updated.delete('productIds')
    return updated
  }, { replace: true })
  const returnTo = searchParams.toString() ? '/cook?' + searchParams.toString() : '/cook'

  return (
    <section className="page cook-page">
      <PageHeader eyebrow="Підбір страв" title="Що приготувати?" description="Виберіть продукти, які вже є у холодильнику, і знайдіть рецепти для них." />
      <div className="cook-layout">
        <section className="cook-picker" aria-labelledby="cook-picker-title">
          <div className="cook-picker-heading">
            <div>
              <p className="eyebrow">Ваші продукти</p>
              <h2 id="cook-picker-title">Виберіть продукти</h2>
            </div>
            {selectedProductIds.length > 0 && <button className="text-button cook-clear-button" type="button" onClick={clearSelection}>Очистити вибір <X aria-hidden="true" size={16} /></button>}
          </div>
          <SearchField label="Пошук продуктів" placeholder="Знайти продукт…" value={productQuery} onChange={setProductQuery} disabled={productsQuery.isPending || productsQuery.isError} />
          {selectedProducts.length > 0 && <div className="cook-selected-products" aria-label="Вибрані продукти">{selectedProducts.map((product) => <button key={product.id} type="button" className="cook-selected-chip" onClick={() => updateSelection(product.id, false)}>{product.name}<X aria-hidden="true" size={14} /></button>)}</div>}
          {productsQuery.isPending && <LoadingState>Завантажуємо продукти…</LoadingState>}
          {productsQuery.isError && <RetryBanner hasData={products.length > 0} staleMessage="Показуємо останній завантажений список продуктів." errorMessage="Не вдалося завантажити продукти." onRetry={() => void productsQuery.refetch()} pending={productsQuery.isFetching} />}
          {!productsQuery.isPending && !productsQuery.isError && products.length === 0 && <EmptyState illustration={<ChefHat />} title="Додайте перший продукт" description="Створіть продукт у каталозі, щоб використовувати його для підбору страв." action={<Link className="button" to="/products/new">Створити продукт</Link>} />}
          {!productsQuery.isPending && !productsQuery.isError && products.length > 0 && visibleProducts.length === 0 && <p className="cook-picker-empty">За цим пошуком продуктів не знайдено.</p>}
          {!productsQuery.isPending && !productsQuery.isError && visibleProducts.length > 0 && <div className="cook-product-list">{visibleProducts.map((product) => <label className="cook-product-option" key={product.id}><input aria-label={product.name} type="checkbox" checked={selectedProductIds.includes(product.id)} onChange={(event) => updateSelection(product.id, event.target.checked)} /><span>{product.name}</span><small>{product.category}</small></label>)}</div>}
        </section>
        <section className="cook-results" aria-labelledby="cook-results-title">
          <div className="cook-results-heading"><div><p className="eyebrow">Рекомендації</p><h2 id="cook-results-title">Страви з ваших продуктів</h2></div>{selectedProductIds.length > 0 && <span className="cook-result-count">{suggestionsQuery.data?.length ?? 0}</span>}</div>
          {selectedProductIds.length === 0 && <EmptyState illustration={<FoodIllustration variant="planner" />} title="Оберіть продукти у холодильнику" description="Після вибору продуктів тут з’являться рецепти, у яких вони використовуються." />}
          {selectedProductIds.length > 0 && suggestionsQuery.isPending && <LoadingState>Шукаємо страви…</LoadingState>}
          {selectedProductIds.length > 0 && suggestionsQuery.isError && <RetryBanner hasData={Boolean(suggestionsQuery.data?.length)} staleMessage="Показуємо останні знайдені страви." errorMessage="Не вдалося знайти страви." onRetry={() => void suggestionsQuery.refetch()} pending={suggestionsQuery.isFetching} />}
          {selectedProductIds.length > 0 && !suggestionsQuery.isPending && !suggestionsQuery.isError && suggestionsQuery.data?.length === 0 && <EmptyState illustration={<FoodIllustration variant="meal" />} title="Рецептів не знайдено" description="Спробуйте вибрати інші продукти або додайте новий рецепт до книги." action={<Link className="button button-secondary" to="/recipes/new">Додати рецепт</Link>} />}
          {selectedProductIds.length > 0 && !suggestionsQuery.isPending && !suggestionsQuery.isError && Boolean(suggestionsQuery.data?.length) && <div className="recipe-grid cook-recipe-grid">{suggestionsQuery.data?.map((recipe) => <SuggestionRecipeCard key={recipe.id} recipe={recipe} returnTo={returnTo} />)}</div>}
        </section>
      </div>
    </section>
  )
}

function SuggestionRecipeCard({ recipe, returnTo }: { recipe: RecipeSummary; returnTo: string }) {
  const labels = recipe.classifications.map((item) => getRecipeSubcategory(item.subcategoryId)?.label).filter(Boolean)
  const detailHref = '/recipes/' + encodeURIComponent(recipe.id) + '?returnTo=' + encodeURIComponent(returnTo)
  return <Link className="recipe-card" to={detailHref}><MediaPlaceholder src={recipe.image?.url} alt="" fallback={<FoodIllustration variant="meal" />} fallbackLabel="Фото недоступне" loading="lazy" decoding="async" className="recipe-image-placeholder recipe-media-4x3" /><div><p className="eyebrow">{formatPreparationTime(recipe.preparationTimeMinMinutes, recipe.preparationTimeMaxMinutes) ?? 'Час не вказано'}</p><h3>{recipe.name}</h3><p>{labels.length ? labels.slice(0, 2).join(' · ') : 'Без категорії'}</p></div></Link>
}

function selectedIds(value: string | null): string[] {
  if (!value) return []
  try { return normalizeProductIds(value.split(',')) } catch { return [] }
}
