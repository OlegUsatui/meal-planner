import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ProductList } from '../components/ProductList'
import { useProductRepository } from '../repositories/useProductRepository'
import type { ProductPage } from '../repositories/product-repository'
import type { Product } from '../types'
import { Pagination } from '../../../shared/ui/Pagination'

const PAGE_SIZE = 24

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; products: Product[] }

export function ProductsPage() {
  const repository = useProductRepository()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [pageInfo, setPageInfo] = useState<ProductPage>({ items: [], page: 1, pageSize: PAGE_SIZE, total: 0, hasNext: false })
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const page = parsePage(searchParams.get('page'))
  const showArchived = searchParams.get('archived') === 'true'
  const serverPaginated = Boolean(repository.listPage)

  const updateUrl = (updates: { query?: string; page?: number; archived?: boolean }, replace = true) => {
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
      return next
    }, { replace })
  }

  useEffect(() => {
    let active = true
    setState({ status: 'loading' })
    const options = { includeArchived: showArchived, query }
    const request = repository.listPage
      ? repository.listPage({ ...options, page, pageSize: PAGE_SIZE })
      : repository.list(options).then((products) => ({ items: products, page: 1, pageSize: products.length || PAGE_SIZE, total: products.length, hasNext: false }))
    request
      .then((result) => { if (active) { setPageInfo(result); setState({ status: 'ready', products: result.items }) } })
      .catch(() => active && setState({ status: 'error', message: 'Не вдалося завантажити продукти' }))
    return () => { active = false }
  }, [repository, query, page, showArchived])

  useEffect(() => {
    if (state.status === 'ready' && pageInfo.total > 0) {
      const lastPage = Math.max(1, Math.ceil(pageInfo.total / PAGE_SIZE))
      if (page > lastPage) updateUrl({ page: lastPage })
    }
  }, [page, pageInfo.total, state.status])

  return (
    <section className="page products-page">
      <header className="page-header">
        <div><p className="eyebrow">Каталог інгредієнтів</p><h1>Продукти</h1><p className="page-intro">Назви, категорії та одиниці для ваших рецептів і списку покупок.</p></div>
        <Link className="button button-primary" to="/products/new">+ Новий продукт</Link>
      </header>

      <div className="toolbar" role="search">
        <label className="search-field"><span className="sr-only">Пошук продуктів</span><input type="search" placeholder="Пошук продуктів…" value={query} onChange={(event) => updateUrl({ query: event.target.value, page: 1 })} /></label>
        <label className="check-label"><input type="checkbox" checked={showArchived} onChange={(event) => updateUrl({ archived: event.target.checked, page: 1 })} /> Показати архів</label>
      </div>

      {state.status === 'loading' && <div className="loading-panel" aria-live="polite">Завантажуємо продукти…</div>}
      {state.status === 'error' && <div className="form-alert" role="alert">{state.message}</div>}
      {state.status === 'ready' && state.products.length > 0 && <ProductList products={state.products} />}
      {state.status === 'ready' && state.products.length === 0 && (
        <div className="empty-state">
          <div className="empty-illustration" aria-hidden="true">🥕</div>
          <p className="eyebrow">Почнімо з основи</p>
          <h2>{query ? 'Нічого не знайдено' : 'Створіть перший продукт'}</h2>
          <p>{query ? 'Спробуйте іншу назву або очистіть пошук.' : 'Продукти потрібні, щоб складати рецепти й формувати список покупок.'}</p>
          {query ? <button className="button button-secondary" onClick={() => updateUrl({ query: '', page: 1 })}>Очистити пошук</button> : <Link className="button button-primary" to="/products/new">Створити продукт</Link>}
        </div>
      )}
      {state.status === 'ready' && serverPaginated && <Pagination ariaLabel="Пагінація продуктів" page={pageInfo.page} pageSize={pageInfo.pageSize} total={pageInfo.total} hasNext={pageInfo.hasNext} onPageChange={(nextPage) => updateUrl({ page: nextPage }, false)} />}
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
