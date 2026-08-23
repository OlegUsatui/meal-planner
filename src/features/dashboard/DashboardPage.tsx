import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CalendarPlus, ShoppingBasket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDashboardRepository } from './DashboardRepositoryContext'
import type { DashboardSummary } from './types'
import { cacheTimes, queryKeys } from '../../app/query/query-client'
import { useOptionalAuth } from '../auth/useAuth'
import { PageHeader } from '../../shared/ui/PageHeader'
import { ButtonLink } from '../../shared/ui/ButtonLink'
import { SectionHeading } from '../../shared/ui/SectionHeading'
import { RetryBanner } from '../../shared/ui/RetryBanner'
import { TodayMeals } from './TodayMeals'
import { DailyNutritionCard } from './DailyNutritionCard'
import { useTodayRecipes } from './useTodayRecipes'

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
  const todayRecipes = useTodayRecipes(summary?.todayEntries ?? [])

  return <section className="page today-page">
    <PageHeader className="today-page-header" eyebrow={new Date(`${today}T12:00:00`).toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })} title="Сьогодні" description="Ваші страви, найближчий план і покупки — в одному місці." actions={<ButtonLink to={`/plan?date=${today}`}><CalendarPlus aria-hidden="true" /> Відкрити план</ButtonLink>} />
    {summaryQuery.isPending && <div className="dashboard-skeleton" role="status">Готуємо огляд дня…</div>}
    {summaryQuery.isError && <RetryBanner hasData={Boolean(summary)} staleMessage="Показуємо останній огляд дня." errorMessage="Не вдалося завантажити огляд дня." onRetry={() => void summaryQuery.refetch()} pending={summaryQuery.isFetching} />}
    {summary && <>
      {!summary.hasPlanEntries && <section className="first-step-card"><p className="eyebrow">Перший крок</p><h2>Заплануйте одну страву</h2><p>Оберіть готовий системний рецепт — власні продукти та рецепти створювати не обов’язково.</p><ButtonLink to={`/plan?date=${today}`}>Запланувати страву</ButtonLink></section>}
      <div className="today-grid"><section className="today-meals"><SectionHeading eyebrow="Розклад" title="Страви на сьогодні" /><TodayMeals today={today} entries={summary.todayEntries} recipes={todayRecipes.recipes} recipesLoading={todayRecipes.loading} /></section>
        <aside className="today-aside"><DailyNutritionCard entries={summary.todayEntries} recipes={todayRecipes.recipes} loading={todayRecipes.loading} /><Link className="shopping-preview-card" to="/shopping?range=7"><ShoppingBasket aria-hidden="true" /><span><small>Покупки на 7 днів</small><strong>{summary.sevenDayShoppingCount} продуктів</strong></span><ArrowRight aria-hidden="true" /></Link></aside>
      </div>
    </>}
  </section>
}
