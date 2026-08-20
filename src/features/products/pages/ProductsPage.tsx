import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Carrot, Plus } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { ProductList } from '../components/ProductList'
import { useProductRepository } from '../repositories/useProductRepository'
import type { ProductPage } from '../repositories/product-repository'
import { Pagination } from '../../../shared/ui/Pagination'
import { productCategories } from '../domain/product'
import { cacheTimes, queryKeys } from '../../../app/query/query-client'
import { useOptionalAuth } from '../../auth/useAuth'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { RetryBanner } from '../../../shared/ui/RetryBanner'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { SearchField } from '../../../shared/ui/SearchField'
import { Button } from '../../../shared/ui/Button'
import { ButtonLink } from '../../../shared/ui/ButtonLink'

const PAGE_SIZE = 24

export function ProductsPage() {
  const repository = useProductRepository()
  const userId = useOptionalAuth()?.session?.user.id ?? 'test-session'
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const page = parsePage(searchParams.get('page'))
  const showArchived = searchParams.get('archived') === 'true'
  const category = searchParams.get('category') ?? ''
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const serverPaginated = Boolean(repository.listPage)

  const updateUrl = (updates: { query?: string; page?: number; archived?: boolean; category?: string }, replace = true) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (updates.query !== undefined) setOrDelete(next, 'q', updates.query)
      if (updates.page !== undefined) {
        if (updates.page > 1) next.set('page', String(updates.page))
        else next.delete('page')
      }
      if (updates.archived !== undefined) {
        if (updates.archived) next.set('archived', 'true')
        else next.delete('archived')
      }
      if (updates.category !== undefined) setOrDelete(next, 'category', updates.category)
      return next
    }, { replace })
  }

  useEffect(() => { const timeout = window.setTimeout(() => setDebouncedQuery(query), 300); return () => window.clearTimeout(timeout) }, [query])

  const options = useMemo(() => ({ includeArchived: showArchived, query: debouncedQuery, ...(category ? { category } : {}) }), [category, debouncedQuery, showArchived])
  const productsQuery = useQuery<ProductPage>({
    queryKey: queryKeys.products(userId, { ...options, page, pageSize: PAGE_SIZE }),
    queryFn: ({ signal }) => repository.listPage
      ? repository.listPage({ ...options, page, pageSize: PAGE_SIZE }, signal)
      : repository.list(options, signal).then((products) => ({ items: products, page: 1, pageSize: products.length || PAGE_SIZE, total: products.length, hasNext: false })),
    staleTime: cacheTimes.catalogueStale,
    refetchOnWindowFocus: false,
  })
  const lastPage = useRef<ProductPage | undefined>(undefined)
  if (productsQuery.data !== undefined) lastPage.current = productsQuery.data
  const pageInfo = productsQuery.data ?? (productsQuery.isError ? lastPage.current : undefined) ?? { items: [], page: 1, pageSize: PAGE_SIZE, total: 0, hasNext: false }

  useEffect(() => {
    if (!productsQuery.isPending && pageInfo.total > 0) {
      const lastPage = Math.max(1, Math.ceil(pageInfo.total / PAGE_SIZE))
      if (page > lastPage) updateUrl({ page: lastPage })
    }
  }, [page, pageInfo.total, productsQuery.isPending])

  return (
    <section className="page products-page">
      <PageHeader eyebrow="Каталог інгредієнтів" title="Продукти" description="Назви, категорії та одиниці для ваших рецептів і списку покупок." actions={<ButtonLink to="/products/new"><Plus aria-hidden="true" /> Новий продукт</ButtonLink>} />

      <div className="toolbar" role="search">
        <SearchField label="Пошук продуктів" placeholder="Пошук продуктів…" value={query} onChange={(value) => updateUrl({ query: value, page: 1 })} />
        <label className="category-filter"><span className="sr-only">Категорія продуктів</span><select value={category} onChange={(event) => updateUrl({ category: event.target.value, page: 1 })}><option value="">Усі категорії</option>{productCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="check-label"><input type="checkbox" checked={showArchived} onChange={(event) => updateUrl({ archived: event.target.checked, page: 1 })} /> Показати архів</label>
      </div>

      {productsQuery.isPending && <LoadingState>Завантажуємо продукти…</LoadingState>}
      {productsQuery.isError && <RetryBanner hasData={pageInfo.items.length > 0} staleMessage="Показуємо останній завантажений каталог." errorMessage="Не вдалося завантажити продукти." onRetry={() => void productsQuery.refetch()} pending={productsQuery.isFetching} />}
      {!productsQuery.isPending && pageInfo.items.length > 0 && <ProductList products={pageInfo.items} />}
      {!productsQuery.isPending && !productsQuery.isError && pageInfo.items.length === 0 && (
        <EmptyState illustration={<Carrot />} eyebrow="Почнімо з основи" title={query ? 'Нічого не знайдено' : 'Створіть перший продукт'} description={query ? 'Спробуйте іншу назву або очистіть пошук.' : 'Продукти потрібні, щоб складати рецепти й формувати список покупок.'} action={query ? <Button variant="secondary" onClick={() => updateUrl({ query: '', page: 1 })}>Очистити пошук</Button> : <ButtonLink to="/products/new">Створити продукт</ButtonLink>} />
      )}
      {!productsQuery.isPending && serverPaginated && <Pagination ariaLabel="Пагінація продуктів" page={pageInfo.page} pageSize={pageInfo.pageSize} total={pageInfo.total} hasNext={pageInfo.hasNext} onPageChange={(nextPage) => updateUrl({ page: nextPage }, false)} />}
    </section>
  )
}

function parsePage(value: string | null): number {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function setOrDelete(params: URLSearchParams, key: string, value: string) {
  if (value) params.set(key, value)
  else params.delete(key)
}
