import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import { Download, Printer, Share2 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { formatShoppingQuantity } from '../../../shared/formatting/format'
import { mealSlots, shiftDate } from '../../meal-planner/domain/meal-plan'
import type { ShoppingListItem } from '../domain/shopping-list'
import { useShoppingListRepository } from '../repositories/useShoppingListRepository'
import type { ShoppingListRange } from '../types'
import { cacheTimes, queryKeys } from '../../../app/query/query-client'
import { useOptionalAuth } from '../../auth/useAuth'

const localToday = () => new Intl.DateTimeFormat('sv-SE').format(new Date())
const presets = [{ value: 'today', label: 'Сьогодні', days: 1 }, { value: '7', label: '7 днів', days: 7 }, { value: '14', label: '14 днів', days: 14 }, { value: 'all', label: 'Увесь план' }, { value: 'custom', label: 'Власний діапазон' }] as const

export function ShoppingListPage() {
  const repository = useShoppingListRepository()
  const userId = useOptionalAuth()?.session?.user.id ?? 'test-session'
  const [searchParams, setSearchParams] = useSearchParams()
  const preset = presets.some((item) => item.value === searchParams.get('range')) ? searchParams.get('range')! : '7'
  const range = useMemo(() => rangeFor(preset, searchParams), [preset, searchParams])
  const [notice, setNotice] = useState('')
  const itemsQuery = useQuery({
    queryKey: queryKeys.shoppingList(userId, range.from, range.to),
    queryFn: ({ signal }) => repository.list(range, signal),
    staleTime: cacheTimes.dynamicStale,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  })
  const lastItems = useRef<ShoppingListItem[]>([])
  if (itemsQuery.data !== undefined) lastItems.current = itemsQuery.data
  const items = itemsQuery.data ?? lastItems.current
  const groups = useMemo(() => groupItems(items), [items])
  const choosePreset = (value: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('range', value)
    if (value === 'custom') {
      const today = localToday()
      if (!next.get('from')) next.set('from', today)
      if (!next.get('to')) next.set('to', shiftDate(today, 6))
    }
    setSearchParams(next)
  }
  const changeCustomDate = (key: 'from' | 'to', value: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('range', 'custom')
    next.set(key, value)
    setSearchParams(next)
  }
  const text = useMemo(() => shoppingText(items, range), [items, range])

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: 'Список покупок', text })
      else { await navigator.clipboard.writeText(text); setNotice('Список скопійовано') }
    } catch { setNotice('Не вдалося поділитися списком') }
  }
  function exportCsv() {
    const csv = ['Категорія,Продукт,Кількість', ...items.map((item) => [item.category, item.productName, formatShoppingQuantity(item.quantityBase, item.baseUnit)].map(csvCell).join(','))].join('\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a')
    link.href = url; link.download = `shopping-${range.from}${range.to ? `-${range.to}` : ''}.csv`; link.click(); URL.revokeObjectURL(url)
  }

  return <section className="page shopping-page">
    <header className="page-header"><div><p className="eyebrow">Автоматично з плану</p><h1>Покупки</h1><p>Читайте список, друкуйте або діліться ним. Позначки й ручні позиції не зберігаються.</p></div><Link className="button button-secondary" to={`/plan?date=${range.from}`}>Відкрити план</Link></header>
    <div className="shopping-toolbar"><div><div className="range-presets" aria-label="Період списку">{presets.map((item) => <button key={item.value} type="button" aria-pressed={preset === item.value} onClick={() => choosePreset(item.value)}>{item.label}</button>)}</div>{preset === 'custom' && <div className="custom-date-range"><label>Від<input type="date" value={range.from} max={range.to} onChange={(event) => changeCustomDate('from', event.target.value)} /></label><label>До<input type="date" value={range.to ?? range.from} min={range.from} onChange={(event) => changeCustomDate('to', event.target.value)} /></label></div>}</div><div className="shopping-actions"><button type="button" className="icon-action" onClick={() => window.print()}><Printer aria-hidden="true" /> Друк</button><button type="button" className="icon-action" onClick={() => void share()}><Share2 aria-hidden="true" /> Поділитися</button><button type="button" className="icon-action" onClick={exportCsv}><Download aria-hidden="true" /> CSV</button></div></div>
    {notice && <p className="toast-inline" role="status">{notice}</p>}
    {itemsQuery.isPending && <div className="shopping-skeleton" role="status">Завантажуємо список на обраний період…</div>}
    {itemsQuery.isError && <div className="form-alert stale-banner" role="alert"><span>{items.length ? 'Показуємо останній завантажений список.' : 'Не вдалося завантажити список.'}</span><button className="button button-secondary" type="button" onClick={() => void itemsQuery.refetch()}>Повторити</button></div>}
    {!itemsQuery.isPending && !items.length && <div className="empty-state"><h2>На цей період покупок немає</h2><p>Додайте рецепт у конкретний слот плану — список перерахується автоматично.</p><Link className="button button-primary" to={`/plan?date=${range.from}`}>Запланувати страву</Link></div>}
    {!!items.length && <div className="shopping-groups">{groups.map(([category, categoryItems]) => <section className="shopping-group" key={category}><h2>{category}</h2><div>{categoryItems.map((item) => <ShoppingRow item={item} key={item.productId} />)}</div></section>)}</div>}
  </section>
}

function ShoppingRow({ item }: { item: ShoppingListItem }) {
  const [open, setOpen] = useState(false)
  return <article className="shopping-item"><button type="button" className="shopping-item-summary" aria-expanded={open} onClick={() => setOpen((value) => !value)}><span>{item.productName}<small>{item.sources.length} {item.sources.length === 1 ? 'джерело' : 'джерела'}</small></span><strong>{formatShoppingQuantity(item.quantityBase, item.baseUnit)}</strong></button>{open && <ul className="shopping-sources">{item.sources.map((source, index) => <li key={`${source.date}:${source.slot}:${source.recipeId}:${index}`}><span>{new Date(`${source.date}T12:00:00`).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })} · {mealSlots.find((slot) => slot.value === source.slot)?.label} · {source.recipeName} · {source.servings} порц.</span><strong>{formatShoppingQuantity(source.quantityBase, item.baseUnit)}</strong></li>)}</ul>}</article>
}

function rangeFor(preset: string, params: URLSearchParams): ShoppingListRange {
  const today = localToday()
  if (preset === 'custom') {
    const from = validDate(params.get('from')) ?? today
    const requestedTo = validDate(params.get('to')) ?? shiftDate(from, 6)
    return { from, to: requestedTo < from ? from : requestedTo }
  }
  const selected = presets.find((item) => item.value === preset)
  const days = selected && 'days' in selected ? selected.days : undefined
  return { from: today, to: days ? shiftDate(today, days - 1) : undefined }
}
function validDate(value: string | null): string | undefined { return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined }
function groupItems(items: ShoppingListItem[]): Array<[string, ShoppingListItem[]]> { const grouped = new Map<string, ShoppingListItem[]>(); items.forEach((item) => grouped.set(item.category, [...(grouped.get(item.category) ?? []), item])); return [...grouped].sort(([a], [b]) => a.localeCompare(b, 'uk-UA')) }
function shoppingText(items: ShoppingListItem[], range: ShoppingListRange): string { return [`Список покупок від ${range.from}${range.to ? ` до ${range.to}` : ''}`, ...items.map((item) => `${item.productName}: ${formatShoppingQuantity(item.quantityBase, item.baseUnit)}`)].join('\n') }
function csvCell(value: string): string { return `"${value.replaceAll('"', '""')}"` }
