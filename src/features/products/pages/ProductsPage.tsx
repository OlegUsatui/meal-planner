import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProductList } from '../components/ProductList'
import { useProductRepository } from '../repositories/useProductRepository'
import type { Product } from '../types'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; products: Product[] }

export function ProductsPage() {
  const repository = useProductRepository()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [query, setQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    let active = true
    setState({ status: 'loading' })
    repository
      .list({ includeArchived: showArchived, query })
      .then((products) => active && setState({ status: 'ready', products }))
      .catch(() => active && setState({ status: 'error', message: 'Не вдалося завантажити продукти' }))
    return () => { active = false }
  }, [repository, query, showArchived])

  return (
    <section className="page products-page">
      <header className="page-header">
        <div><p className="eyebrow">Каталог інгредієнтів</p><h1>Продукти</h1><p className="page-intro">Назви, категорії та одиниці для ваших рецептів і списку покупок.</p></div>
        <Link className="button button-primary" to="/products/new">+ Новий продукт</Link>
      </header>

      <div className="toolbar" role="search">
        <label className="search-field"><span className="sr-only">Пошук продуктів</span><input type="search" placeholder="Пошук продуктів…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="check-label"><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} /> Показати архів</label>
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
          {query ? <button className="button button-secondary" onClick={() => setQuery('')}>Очистити пошук</button> : <Link className="button button-primary" to="/products/new">Створити продукт</Link>}
        </div>
      )}
    </section>
  )
}
