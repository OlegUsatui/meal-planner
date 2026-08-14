import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Recipe } from '../../recipes/types'
import { useRecipeRepository } from '../../recipes/repositories/useRecipeRepository'
import { getWeekDates, parseLocalDate, shiftDate, startOfWeek, type MealSlot } from '../domain/meal-plan'
import { useMealPlanRepository } from '../repositories/useMealPlanRepository'
import type { MealPlanEntry } from '../types'
import { RecipeDetailsDialog } from '../components/RecipeDetailsDialog'
import { RecipePickerDialog } from '../components/RecipePickerDialog'
import { WeekCalendar } from '../components/WeekCalendar'

const localToday = () => new Intl.DateTimeFormat('sv-SE').format(new Date())
type PickerState = { date: string; slot: MealSlot; entry?: MealPlanEntry }
type DetailsState = { entry: MealPlanEntry; recipe: Recipe; trigger: HTMLElement }

export function MealPlannerPage() {
  const plan = useMealPlanRepository()
  const recipeRepository = useRecipeRepository()
  const today = localToday()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today))
  const [selectedDate, setSelectedDate] = useState(today)
  const [entries, setEntries] = useState<MealPlanEntry[]>([])
  const [activeRecipes, setActiveRecipes] = useState<Recipe[]>([])
  const [recipes, setRecipes] = useState<Map<string, Recipe>>(new Map())
  const [picker, setPicker] = useState<PickerState | null>(null)
  const [details, setDetails] = useState<DetailsState | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  const refresh = useCallback(async () => {
    try {
      const [nextEntries, active] = await Promise.all([plan.list(), recipeRepository.list()])
      const map = new Map(active.map((recipe) => [recipe.id, recipe]))
      const missing = [...new Set(nextEntries.map((entry) => entry.recipeId).filter((id) => !map.has(id)))]
      const historical = await Promise.all(missing.map((id) => recipeRepository.get(id).catch(() => undefined)))
      historical.forEach((recipe) => { if (recipe) map.set(recipe.id, recipe) })
      setEntries(nextEntries); setActiveRecipes(active); setRecipes(map); setState('ready')
    } catch { setState('error') }
  }, [plan, recipeRepository])
  useEffect(() => { void refresh() }, [refresh])

  const dates = useMemo(() => getWeekDates(weekStart), [weekStart])
  const rangeLabel = `${parseLocalDate(dates[0]).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })} — ${parseLocalDate(dates[6]).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })}`
  const moveWeek = (days: number) => { setWeekStart((value) => shiftDate(value, days)); setSelectedDate((value) => shiftDate(value, days)); setPicker(null); setDetails(null) }
  const goToday = () => { setWeekStart(startOfWeek(today)); setSelectedDate(today); setPicker(null); setDetails(null) }

  async function save(recipeId: string, servings: number) {
    if (!picker) return
    await plan.upsert({ date: picker.date, slot: picker.slot, recipeId, servings })
    setPicker(null)
    await refresh()
  }
  async function remove(entry: MealPlanEntry) {
    if (!window.confirm('Видалити цю страву з плану?')) return
    try { await plan.remove(entry.id); await refresh() } catch { setState('error') }
  }

  return <section className="page meal-planner-page">
    <header className="page-header planner-page-header"><div><p className="eyebrow">Тижневий календар</p><h1>План харчування</h1><p className="page-intro">Плануйте сніданки, обіди, вечері та перекуси. Клікніть страву, щоб відкрити рецепт.</p></div><Link className="button button-secondary" to="/recipes/new">+ Новий рецепт</Link></header>
    <div className="week-toolbar"><div className="week-navigation"><button type="button" className="week-arrow" aria-label="Попередній тиждень" onClick={() => moveWeek(-7)}>‹</button><button type="button" className="button button-secondary today-button" onClick={goToday}>Сьогодні</button><button type="button" className="week-arrow" aria-label="Наступний тиждень" onClick={() => moveWeek(7)}>›</button></div><strong>{rangeLabel}</strong></div>
    {state === 'loading' && <div className="loading-panel">Завантажуємо план…</div>}
    {state === 'error' && <div className="form-alert" role="alert">Не вдалося завантажити план. Оновіть сторінку та спробуйте ще раз.</div>}
    {state === 'ready' && <WeekCalendar dates={dates} today={today} selectedDate={selectedDate} entries={entries} recipes={recipes} onSelectDate={setSelectedDate} onAdd={(date, slot) => setPicker({ date, slot })} onReplace={(entry) => setPicker({ date: entry.date, slot: entry.slot, entry })} onRemove={(entry) => void remove(entry)} onOpen={(entry, recipe, trigger) => setDetails({ entry, recipe, trigger })} />}
    {picker && <RecipePickerDialog date={picker.date} slot={picker.slot} recipes={activeRecipes} initialRecipeId={picker.entry?.recipeId} initialServings={picker.entry?.servings} onClose={() => setPicker(null)} onSave={save} />}
    {details && <RecipeDetailsDialog recipe={details.recipe} entry={details.entry} returnFocus={details.trigger} onClose={() => setDetails(null)} />}
  </section>
}
