import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useShoppingListRepository } from '../repositories/useShoppingListRepository'
import type { ShoppingListItem } from '../domain/shopping-list'
import { formatQuantity } from '../../../shared/formatting/format'

export function ShoppingListPage() {
  const repository = useShoppingListRepository()
  const [items, setItems] = useState<ShoppingListItem[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => { void repository.list().then((result) => { setItems(result); setState('ready') }).catch(() => setState('error')) }, [repository])
  return <section className="page"><header className="page-header"><div><p className="eyebrow">Автоматично з плану</p><h1>Покупки</h1><p>Список продуктів для всіх майбутніх рецептів. Він оновлюється разом із планом.</p></div><Link className="button button-secondary" to="/plan">Відкрити план</Link></header>{state === 'loading' && <p>Завантаження…</p>}{state === 'error' && <p className="form-error" role="alert">Не вдалося завантажити список.</p>}{state === 'ready' && items.length === 0 && <div className="empty-state"><h2>Список поки порожній</h2><p>Він з’явиться після додавання рецептів у план.</p><Link className="button button-primary" to="/plan">Додати до плану</Link></div>}{state === 'ready' && items.length > 0 && <div className="shopping-list">{items.map((item) => <article className="shopping-item" key={item.productId}><div><h2>{item.productName}</h2><p>{item.category} · {item.sources.map((source) => `${source.recipeName}, ${source.date}`).join(' · ')}</p></div><strong>{formatQuantity(item.quantityBase, item.baseUnit)}</strong></article>)}</div>}</section>
}
