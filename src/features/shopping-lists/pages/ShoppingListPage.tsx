import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, Printer, Share2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { formatShoppingQuantity } from '../../../shared/formatting/format'
import { mealSlots, shiftDate } from '../../meal-planner/domain/meal-plan'
import { applyShoppingServingOverrides, shoppingSourceKey, type ShoppingListItem, type ShoppingServingOverrides } from '../domain/shopping-list'
import { useShoppingListRepository } from '../repositories/useShoppingListRepository'
import type { ShoppingListRange } from '../types'
import { cacheTimes, queryKeys } from '../../../app/query/query-client'
import { useOptionalAuth } from '../../auth/useAuth'
import { readShoppingChecks, shoppingChecksStorageKey, writeShoppingChecks } from '../domain/shopping-checks'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { RetryBanner } from '../../../shared/ui/RetryBanner'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { Button } from '../../../shared/ui/Button'
import { SegmentedControl } from '../../../shared/ui/SegmentedControl'
import { ButtonLink } from '../../../shared/ui/ButtonLink'

const localToday = () => new Intl.DateTimeFormat('sv-SE').format(new Date())
const presets = [{ value: 'today', label: 'Сьогодні', days: 1 }, { value: '7', label: '7 днів', days: 7 }, { value: '14', label: '14 днів', days: 14 }, { value: 'all', label: 'Увесь план' }, { value: 'custom', label: 'Власний діапазон' }] as const

export function ShoppingListPage() {
  const repository = useShoppingListRepository()
  const userId = useOptionalAuth()?.session?.user.id ?? 'test-session'
  const [searchParams, setSearchParams] = useSearchParams()
  const preset = presets.some((item) => item.value === searchParams.get('range')) ? searchParams.get('range')! : '7'
  const range = useMemo(() => rangeFor(preset, searchParams), [preset, searchParams])
  const [notice, setNotice] = useState('')
  const [servingOverrides, setServingOverrides] = useState<ShoppingServingOverrides>({})
  const itemsQuery = useQuery({
    queryKey: queryKeys.shoppingList(userId, range.from, range.to),
    queryFn: ({ signal }) => repository.list(range, signal),
    staleTime: cacheTimes.dynamicStale,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  })
  const lastItems = useRef<ShoppingListItem[]>([])
  if (itemsQuery.data !== undefined) lastItems.current = itemsQuery.data
  const items = itemsQuery.data ?? (itemsQuery.isError ? lastItems.current : [])
  const adjustedItems = useMemo(() => applyShoppingServingOverrides(items, servingOverrides), [items, servingOverrides])
  const groups = useMemo(() => groupItems(adjustedItems), [adjustedItems])
  useEffect(() => setServingOverrides({}), [range.from, range.to])
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
  const text = useMemo(() => shoppingText(adjustedItems, range), [adjustedItems, range])

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: 'Список покупок', text })
      else { await navigator.clipboard.writeText(text); setNotice('Список скопійовано') }
    } catch { setNotice('Не вдалося поділитися списком') }
  }
  function exportCsv() {
    const csv = ['Категорія,Продукт,Кількість', ...adjustedItems.map((item) => [item.category, item.productName, formatShoppingQuantity(item.quantityBase, item.baseUnit)].map(csvCell).join(','))].join('\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a')
    link.href = url; link.download = `shopping-${range.from}${range.to ? `-${range.to}` : ''}.csv`; link.click(); URL.revokeObjectURL(url)
  }

  return <section className="page shopping-page">
    <PageHeader eyebrow="Автоматично з плану" title="Покупки" description="Позначайте придбане, друкуйте або діліться списком. Позначки зберігаються на цьому пристрої." actions={<ButtonLink variant="secondary" to={`/plan?date=${range.from}`}>Відкрити план</ButtonLink>} />
    <div className="shopping-toolbar"><div><SegmentedControl value={preset as typeof presets[number]['value']} ariaLabel="Період списку" options={presets.map(({ value, label }) => ({ value, label }))} onChange={choosePreset} className="range-presets" />{preset === 'custom' && <div className="custom-date-range"><label>Від<input type="date" value={range.from} max={range.to} onChange={(event) => changeCustomDate('from', event.target.value)} /></label><label>До<input type="date" value={range.to ?? range.from} min={range.from} onChange={(event) => changeCustomDate('to', event.target.value)} /></label></div>}</div><div className="shopping-actions"><button type="button" className="icon-action" onClick={() => window.print()}><Printer aria-hidden="true" /> Друк</button><button type="button" className="icon-action" onClick={() => void share()}><Share2 aria-hidden="true" /> Поділитися</button><button type="button" className="icon-action" onClick={exportCsv}><Download aria-hidden="true" /> CSV</button></div></div>
    {notice && <p className="toast-inline" role="status">{notice}</p>}
    {itemsQuery.isPending && <div className="shopping-skeleton" role="status">Завантажуємо список на обраний період…</div>}
    {itemsQuery.isError && <RetryBanner hasData={items.length > 0} staleMessage="Показуємо останній завантажений список." errorMessage="Не вдалося завантажити список." onRetry={() => void itemsQuery.refetch()} pending={itemsQuery.isFetching} />}
    {!itemsQuery.isPending && !items.length && <EmptyState title="На цей період покупок немає" description="Додайте рецепт у конкретний слот плану — список перерахується автоматично." action={<ButtonLink to={`/plan?date=${range.from}`}>Запланувати страву</ButtonLink>} />}
    {!!adjustedItems.length && <ShoppingChecklist key={shoppingChecksStorageKey(userId, range)} groups={groups} storageKey={shoppingChecksStorageKey(userId, range)} onServingsChange={(source, servings) => setServingOverrides((current) => ({ ...current, [shoppingSourceKey(source)]: servings }))} />}
  </section>
}

function ShoppingChecklist({ groups, storageKey, onServingsChange }: { groups: Array<[string, ShoppingListItem[]]>; storageKey: string; onServingsChange: (source: Pick<ShoppingListItem['sources'][number], 'date' | 'slot' | 'recipeId'>, servings: number) => void }) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => readShoppingChecks(storageKey))
  const items = groups.flatMap(([, categoryItems]) => categoryItems)
  const itemIds = new Set(items.map((item) => item.productId))
  const visibleCheckedIds = new Set([...checkedIds].filter((productId) => itemIds.has(productId)))

  function toggle(productId: string, checked: boolean) {
    const next = new Set(visibleCheckedIds)
    if (checked) next.add(productId)
    else next.delete(productId)
    setCheckedIds(next)
    writeShoppingChecks(storageKey, next)
  }

  function reset() {
    setCheckedIds(new Set())
    writeShoppingChecks(storageKey, [])
  }

  return <>
    <div className="shopping-progress-bar">
      <p className="shopping-progress" role="status" aria-label="Прогрес покупок">Куплено {visibleCheckedIds.size} з {items.length}</p>
      <Button type="button" variant="ghost" onClick={reset} disabled={visibleCheckedIds.size === 0}>Скинути позначки</Button>
    </div>
    <div className="shopping-groups">{groups.map(([category, categoryItems]) => <section className="shopping-group" key={category}><h2>{category}</h2><div>{categoryItems.map((item) => <ShoppingRow item={item} checked={visibleCheckedIds.has(item.productId)} onToggle={toggle} onServingsChange={onServingsChange} key={item.productId} />)}</div></section>)}</div>
  </>
}

function ShoppingRow({ item, checked, onToggle, onServingsChange }: { item: ShoppingListItem; checked: boolean; onToggle: (productId: string, checked: boolean) => void; onServingsChange: (source: Pick<ShoppingListItem['sources'][number], 'date' | 'slot' | 'recipeId'>, servings: number) => void }) {
  const [open, setOpen] = useState(false)
  return <article className={`shopping-item ${checked ? 'is-checked' : ''}`}><div className="shopping-item-main"><label className="shopping-check"><input type="checkbox" aria-label={`Куплено: ${item.productName}`} checked={checked} onChange={(event) => onToggle(item.productId, event.target.checked)} /><span aria-hidden="true" /></label><button type="button" className="shopping-item-summary" aria-expanded={open} onClick={() => setOpen((value) => !value)}><span>{item.productName}<small>{item.sources.length} {item.sources.length === 1 ? 'джерело' : 'джерела'}</small></span><strong>{formatShoppingQuantity(item.quantityBase, item.baseUnit)}</strong></button></div>{open && <ul className="shopping-sources">{item.sources.map((source, index) => <li key={`${source.date}:${source.slot}:${source.recipeId}:${index}`}><div><span>{new Date(`${source.date}T12:00:00`).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })} · {mealSlots.find((slot) => slot.value === source.slot)?.label} · {source.recipeName}</span><div className="shopping-source-servings"><button type="button" aria-label={`Зменшити порції для ${source.recipeName}`} disabled={source.servings <= 1} onClick={() => onServingsChange(source, source.servings - 1)}>−</button><span>{source.servings} порц.</span><button type="button" aria-label={`Збільшити порції для ${source.recipeName}`} disabled={source.servings >= 99} onClick={() => onServingsChange(source, source.servings + 1)}>+</button></div></div><strong>{formatShoppingQuantity(source.quantityBase, item.baseUnit)}</strong></li>)}</ul>}</article>
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
