import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CalendarPlus, ShoppingBasket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { mealSlots } from '../meal-planner/domain/meal-plan'
import { useDashboardRepository } from './DashboardRepositoryContext'
import type { DashboardSummary } from './types'
import { cacheTimes, queryKeys } from '../../app/query/query-client'
import { useOptionalAuth } from '../auth/useAuth'
import { PageHeader } from '../../shared/ui/PageHeader'
import { ButtonLink } from '../../shared/ui/ButtonLink'
import { SectionHeading } from '../../shared/ui/SectionHeading'
import { RetryBanner } from '../../shared/ui/RetryBanner'

const localToday = () => new Intl.DateTimeFormat('sv-SE').format(new Date())

export function DashboardPage() {
  const repository = useDashboardRepository()
  const userId = useOptionalAuth()?.session?.user.id ?? 'test-session'
  const today = localToday()
  const summaryQuery = useQuery<DashboardSummary>({
    queryKey: queryKeys.dashboard(userId, today),
    queryFn: () => repository.get(today),
    staleTime: cacheTimes.dynamicStale,
    refetchOnWindowFocus: true,
  })
  const summary = summaryQuery.data

  return <section className="page today-page">
    <PageHeader className="today-page-header" eyebrow={new Date(`${today}T12:00:00`).toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })} title="Сьогодні" description="Ваші страви, найближчий план і покупки — в одному місці." actions={<ButtonLink to={`/plan?date=${today}`}><CalendarPlus aria-hidden="true" /> Відкрити план</ButtonLink>} />
    {summaryQuery.isPending && <div className="dashboard-skeleton" role="status">Готуємо огляд дня…</div>}
    {summaryQuery.isError && <RetryBanner hasData={Boolean(summary)} staleMessage="Показуємо останній огляд дня." errorMessage="Не вдалося завантажити огляд дня." onRetry={() => void summaryQuery.refetch()} pending={summaryQuery.isFetching} />}
    {summary && <>
      {!summary.hasPlanEntries && <section className="first-step-card"><p className="eyebrow">Перший крок</p><h2>Заплануйте одну страву</h2><p>Оберіть готовий системний рецепт — власні продукти та рецепти створювати не обов’язково.</p><ButtonLink to={`/plan?date=${today}`}>Запланувати страву</ButtonLink></section>}
      <div className="today-grid"><section className="today-meals"><SectionHeading eyebrow="Розклад" title="Страви на сьогодні" /><div className="today-slots">{mealSlots.map((slot) => { const meal = summary.todayEntries.find((entry) => entry.slot === slot.value); return meal ? <Link className="today-slot filled" key={slot.value} to={`/recipes/${meal.recipeId}?planDate=${meal.date}&planSlot=${meal.slot}&planServings=${meal.servings}&returnTo=%2F`}><span>{slot.label}</span><strong>{meal.recipeName}</strong><small>{meal.servings} порц.</small><ArrowRight aria-hidden="true" /></Link> : <Link className="today-slot empty" key={slot.value} aria-label={`Запланувати: ${slot.label}`} to={`/plan?date=${today}`}><span>{slot.label}</span><strong>Порожній слот</strong><small>Запланувати</small><CalendarPlus aria-hidden="true" /></Link> })}</div></section>
        <aside className="today-aside"><section className="next-meal-card"><p className="eyebrow">Найближча страва</p>{summary.nextEntry ? <><h2>{summary.nextEntry.recipeName}</h2><p>{summary.nextEntry.date === today ? 'Сьогодні' : new Date(`${summary.nextEntry.date}T12:00:00`).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })} · {mealSlots.find((slot) => slot.value === summary.nextEntry?.slot)?.label}</p></> : <><h2>План вільний</h2><p>Додайте страву, коли будете готові.</p></>}</section><Link className="shopping-preview-card" to="/shopping?range=7"><ShoppingBasket aria-hidden="true" /><span><small>Покупки на 7 днів</small><strong>{summary.sevenDayShoppingCount} продуктів</strong></span><ArrowRight aria-hidden="true" /></Link></aside>
      </div>
    </>}
  </section>
}
