import type { Recipe } from '../recipes/types'
import { calculateDailyNutrition } from './domain/daily-nutrition'
import type { DashboardMeal } from './types'

const metrics = [['Ккал', 'calories'], ['Б', 'proteinGrams'], ['Ж', 'fatGrams'], ['В', 'carbsGrams']] as const

export function DailyNutritionCard({ entries, recipes, loading }: { entries: DashboardMeal[]; recipes: Map<string, Recipe>; loading: boolean }) {
  const summary = calculateDailyNutrition(entries.map((entry) => ({ recipe: recipes.get(entry.recipeId) })))
  return <section className="daily-nutrition-card" aria-labelledby="daily-nutrition-title">
    <p className="eyebrow">Підсумок дня</p><h2 id="daily-nutrition-title">Харчова цінність</h2>
    {summary.mealCount === 0 ? <p className="daily-nutrition-empty">Заплануйте страви, щоб побачити підсумок.</p> : <><div className="daily-nutrition-grid">{metrics.map(([label, key]) => <div className="daily-nutrition-metric" key={key}><strong>{formatMetric(summary[key])}</strong><span>{label}{key === 'calories' ? '' : ' г'}</span></div>)}</div><p className="daily-nutrition-meta">{summary.mealCount} {pluralize(summary.mealCount, 'страва', 'страви', 'страв')}</p>{loading && <span className="daily-nutrition-status" role="status">Оновлюємо дані…</span>}</>}
  </section>
}

function formatMetric(value: number | null): string { return value === null ? '—' : new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 }).format(value) }
function pluralize(value: number, one: string, few: string, many: string): string { const remainder = value % 100; if (remainder >= 11 && remainder <= 14) return many; switch (value % 10) { case 1: return one; case 2: case 3: case 4: return few; default: return many } }
