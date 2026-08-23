import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import type { RecipeSummary } from '../../recipes/types'
import { useRecipeRepository } from '../../recipes/repositories/useRecipeRepository'
import { WeekCalendar } from '../components/WeekCalendar'
import { getWeekDates, parseLocalDate, shiftDate, startOfWeek } from '../domain/meal-plan'
import { useMealPlanRepository } from '../repositories/useMealPlanRepository'
import type { MealPlanEntry } from '../types'
import { cacheTimes, queryKeys } from '../../../app/query/query-client'
import { invalidateMealPlanData } from '../../../app/query/invalidation'
import { useOptionalAuth } from '../../auth/useAuth'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { RetryBanner } from '../../../shared/ui/RetryBanner'
import { Alert } from '../../../shared/ui/Alert'
import { Button } from '../../../shared/ui/Button'

const localToday = () => new Intl.DateTimeFormat('sv-SE').format(new Date())

export function MealPlannerPage() {
  const plan = useMealPlanRepository()
  const recipeRepository = useRecipeRepository()
  const queryClient = useQueryClient()
  const userId = useOptionalAuth()?.session?.user.id ?? 'test-session'
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const today = localToday()
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
  })
  const catalogueQuery = useQuery({
    queryKey: queryKeys.recipes(userId, {}),
    queryFn: () => recipeRepository.list(),
    staleTime: cacheTimes.catalogueStale,
    refetchOnWindowFocus: false,
  })
  const entries = planQuery.data ?? []
  const catalogue = catalogueQuery.data ?? []
  // Week cards use lightweight summaries. Loading full recipes there creates a
  // transient request while the catalogue is still pending, which is then
  // aborted as soon as the summaries arrive.
  const recipes = useMemo(() => new Map<string, RecipeSummary>(catalogue.map((recipe) => [recipe.id, recipe])), [catalogue])
  const loading = planQuery.isPending || catalogueQuery.isPending
  const stale = planQuery.isError || catalogueQuery.isError

  const selectDate = useCallback((date: string) => {
    setSelectedDate(date)
    const next = new URLSearchParams(searchParams); next.set('date', date); setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])
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
  const openDetails = (entry: MealPlanEntry, recipe: RecipeSummary) => {
    const query = new URLSearchParams({ planDate: entry.date, planSlot: entry.slot, returnTo: `/plan?date=${entry.date}` })
    navigate(`/recipes/${recipe.id}?${query.toString()}`)
  }

  return <section className="page meal-planner-page">
    <PageHeader className="planner-page-header" eyebrow="Тижневий календар" title="План харчування" description="Плануйте сніданки, обіди, вечері та перекуси. Відкрийте порожній слот, щоб додати страву." />
    <div className="week-toolbar"><div className="week-navigation"><button type="button" className="week-arrow" aria-label="Попередній тиждень" onClick={() => moveWeek(-7)}><ChevronLeft aria-hidden="true" /></button><Button variant="secondary" type="button" className="today-button" onClick={goToday}>Сьогодні</Button><button type="button" className="week-arrow" aria-label="Наступний тиждень" onClick={() => moveWeek(7)}><ChevronRight aria-hidden="true" /></button></div><strong>{rangeLabel}</strong></div>
    {loading && <LoadingState>Завантажуємо план…</LoadingState>}
    {stale && <RetryBanner hasData={entries.length > 0} staleMessage="Показуємо останній завантажений план." errorMessage="Не вдалося завантажити план." onRetry={() => { void planQuery.refetch(); void catalogueQuery.refetch() }} pending={planQuery.isFetching || catalogueQuery.isFetching} />}
    {actionError && <Alert variant="error">{actionError}</Alert>}
    {!loading && <WeekCalendar dates={dates} today={today} selectedDate={selectedDate} entries={entries} recipes={recipes} onSelectDate={selectDate} onAdd={(date, slot) => navigate(`/plan/add?date=${encodeURIComponent(date)}&slot=${encodeURIComponent(slot)}`)} onReplace={(entry) => navigate(`/plan/add?date=${encodeURIComponent(entry.date)}&slot=${encodeURIComponent(entry.slot)}&entryId=${encodeURIComponent(entry.id)}&recipeId=${encodeURIComponent(entry.recipeId)}`)} onRemove={setRemoving} onOpen={(entry, recipe) => openDetails(entry, recipe)} />}
    {removing && <ConfirmDialog title="Видалити страву з плану?" description="Слот стане порожнім. Рецепт залишиться у вашому каталозі." confirmLabel="Видалити з плану" pending={removePending} danger onCancel={() => setRemoving(undefined)} onConfirm={() => void confirmRemove()} />}
  </section>
}

function validDate(value: string | null): string | undefined {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined
}
