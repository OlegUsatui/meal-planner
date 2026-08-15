import { keepPreviousData, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import type { RecipeSummary } from '../../recipes/types'
import { useRecipeRepository } from '../../recipes/repositories/useRecipeRepository'
import { WeekCalendar, type CalendarViewMode } from '../components/WeekCalendar'
import { getWeekDates, parseLocalDate, shiftDate, startOfWeek } from '../domain/meal-plan'
import { useMealPlanRepository } from '../repositories/useMealPlanRepository'
import type { MealPlanEntry } from '../types'
import { cacheTimes, queryKeys } from '../../../app/query/query-client'
import { invalidateMealPlanData } from '../../../app/query/invalidation'
import { useOptionalAuth } from '../../auth/useAuth'

const localToday = () => new Intl.DateTimeFormat('sv-SE').format(new Date())

export function MealPlannerPage() {
  const plan = useMealPlanRepository()
  const recipeRepository = useRecipeRepository()
  const queryClient = useQueryClient()
  const userId = useOptionalAuth()?.session?.user.id ?? 'test-session'
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const today = localToday()
  const viewMode: CalendarViewMode = searchParams.get('view') === 'week' ? 'week' : 'day'
  const initialDate = validDate(searchParams.get('date')) ?? today
  const [weekStart, setWeekStart] = useState(() => startOfWeek(initialDate))
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const dates = useMemo(() => getWeekDates(weekStart), [weekStart])
  const [actionError, setActionError] = useState('')
  const [removing, setRemoving] = useState<MealPlanEntry>()
  const [removePending, setRemovePending] = useState(false)

  const planQuery = useQuery({
    queryKey: queryKeys.mealPlan(userId, dates[0], dates[6]),
    queryFn: ({ signal }) => plan.list({ from: dates[0], to: dates[6] }, signal),
    staleTime: cacheTimes.dynamicStale,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  })
  const catalogueQuery = useQuery({
    queryKey: queryKeys.recipes(userId, {}),
    queryFn: () => recipeRepository.list(),
    staleTime: cacheTimes.catalogueStale,
    refetchOnWindowFocus: false,
  })
  const entries = planQuery.data ?? []
  const catalogue = catalogueQuery.data ?? []
  const recipeIdsToLoad = useMemo(() => [...new Set(entries.map((entry) => entry.recipeId).filter((id) => viewMode === 'day' || !catalogue.some((recipe) => recipe.id === id)))], [catalogue, entries, viewMode])
  const detailQueries = useQueries({ queries: recipeIdsToLoad.map((recipeId) => ({ queryKey: queryKeys.recipe(userId, recipeId), queryFn: ({ signal }: { signal: AbortSignal }) => recipeRepository.get(recipeId, signal), staleTime: cacheTimes.catalogueStale, retry: false })) })
  const recipes = useMemo(() => {
    const map = new Map<string, RecipeSummary>(catalogue.map((recipe) => [recipe.id, recipe]))
    detailQueries.forEach((query) => { if (query.data) map.set(query.data.id, query.data) })
    return map
  }, [catalogue, detailQueries])
  const loading = planQuery.isPending || catalogueQuery.isPending
  const stale = planQuery.isError || catalogueQuery.isError

  const selectDate = useCallback((date: string) => {
    setSelectedDate(date)
    const next = new URLSearchParams(searchParams); next.set('date', date); setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])
  const selectViewMode = (next: CalendarViewMode) => {
    const params = new URLSearchParams(searchParams)
    params.set('view', next)
    setSearchParams(params, { replace: true })
  }
  const moveWeek = (days: number) => { const next = shiftDate(selectedDate, days); setWeekStart(startOfWeek(next)); selectDate(next) }
  const goToday = () => { setWeekStart(startOfWeek(today)); selectDate(today) }
  const rangeLabel = `${parseLocalDate(dates[0]).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })} — ${parseLocalDate(dates[6]).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })}`

  async function confirmRemove() {
    if (!removing) return
    setRemovePending(true); setActionError('')
    try { await plan.remove(removing.id); setRemoving(undefined); await invalidateMealPlanData(queryClient, userId) }
    catch { setActionError('Не вдалося видалити страву. Спробуйте ще раз.') }
    finally { setRemovePending(false) }
  }
  async function updateServings(entry: MealPlanEntry, servings: number) {
    if (servings === entry.servings || servings < 1 || servings > 99) return
    setActionError('')
    try {
      await plan.upsert({ date: entry.date, slot: entry.slot, recipeId: entry.recipeId, servings })
      await invalidateMealPlanData(queryClient, userId)
    } catch {
      setActionError('Не вдалося змінити кількість порцій. Спробуйте ще раз.')
    }
  }
  const openDetails = (entry: MealPlanEntry, recipe: RecipeSummary) => {
    const query = new URLSearchParams({ planDate: entry.date, planSlot: entry.slot, planServings: String(entry.servings), returnTo: `/plan?date=${entry.date}` })
    navigate(`/recipes/${recipe.id}?${query.toString()}`)
  }

  return <section className="page meal-planner-page">
    <header className="page-header planner-page-header"><div><p className="eyebrow">Тижневий календар</p><h1>План харчування</h1><p className="page-intro">Плануйте сніданки, обіди, вечері та перекуси. Відкрийте порожній слот, щоб додати страву.</p></div><Link className="button button-secondary" to="/recipes/new"><Plus size={18} aria-hidden="true" /> Новий рецепт</Link></header>
    <div className="week-toolbar"><div className="week-navigation"><button type="button" className="week-arrow" aria-label="Попередній тиждень" onClick={() => moveWeek(-7)}><ChevronLeft aria-hidden="true" /></button><button type="button" className="button button-secondary today-button" onClick={goToday}>Сьогодні</button><button type="button" className="week-arrow" aria-label="Наступний тиждень" onClick={() => moveWeek(7)}><ChevronRight aria-hidden="true" /></button></div><strong>{rangeLabel}</strong><div className="planner-view-toggle" role="group" aria-label="Режим календаря"><button type="button" className={viewMode === 'day' ? 'active' : ''} aria-pressed={viewMode === 'day'} onClick={() => selectViewMode('day')}>День</button><button type="button" className={viewMode === 'week' ? 'active' : ''} aria-pressed={viewMode === 'week'} onClick={() => selectViewMode('week')}>Тиждень</button></div></div>
    {loading && <div className="loading-panel" role="status">Завантажуємо план…</div>}
    {stale && <div className="form-alert stale-banner" role="alert"><span>{entries.length ? 'Показуємо останній завантажений план.' : 'Не вдалося завантажити план.'}</span><button type="button" className="button button-secondary" onClick={() => { void planQuery.refetch(); void catalogueQuery.refetch() }}>Повторити</button></div>}
    {actionError && <div className="form-alert" role="alert">{actionError}</div>}
    {!loading && <WeekCalendar dates={dates} today={today} selectedDate={selectedDate} entries={entries} recipes={recipes} onSelectDate={selectDate} onAdd={(date, slot) => navigate(`/plan/add?date=${encodeURIComponent(date)}&slot=${encodeURIComponent(slot)}`)} onReplace={(entry) => navigate(`/plan/add?date=${encodeURIComponent(entry.date)}&slot=${encodeURIComponent(entry.slot)}&entryId=${encodeURIComponent(entry.id)}&recipeId=${encodeURIComponent(entry.recipeId)}&servings=${entry.servings}`)} onRemove={setRemoving} onServingsChange={updateServings} onOpen={(entry, recipe) => openDetails(entry, recipe)} viewMode={viewMode} />}
    {removing && <ConfirmDialog title="Видалити страву з плану?" description="Слот стане порожнім. Рецепт залишиться у вашому каталозі." confirmLabel="Видалити з плану" pending={removePending} danger onCancel={() => setRemoving(undefined)} onConfirm={() => void confirmRemove()} />}
  </section>
}

function validDate(value: string | null): string | undefined {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined
}
