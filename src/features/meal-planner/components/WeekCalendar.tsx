import type { RecipeSummary } from '../../recipes/types'
import { mealSlots, parseLocalDate, type MealSlot } from '../domain/meal-plan'
import type { MealPlanEntry } from '../types'
import { MealCard } from './MealCard'

interface Props {
  dates: string[]
  today: string
  selectedDate: string
  entries: MealPlanEntry[]
  recipes: Map<string, RecipeSummary>
  onSelectDate: (date: string) => void
  onAdd: (date: string, slot: MealSlot) => void
  onReplace: (entry: MealPlanEntry) => void
  onRemove: (entry: MealPlanEntry) => void
  onOpen: (entry: MealPlanEntry, recipe: RecipeSummary, trigger: HTMLElement) => void
}

export function WeekCalendar(props: Props) {
  return <div className="week-calendar">
    <div className="mobile-day-strip" aria-label="Дні тижня">{props.dates.map((date) => <button type="button" key={date} className={`${date === props.selectedDate ? 'selected' : ''} ${date === props.today ? 'today' : ''}`} onClick={() => props.onSelectDate(date)}><span>{parseLocalDate(date).toLocaleDateString('uk-UA', { weekday: 'short' })}</span><strong>{parseLocalDate(date).getDate()}</strong></button>)}</div>
    <div className="week-grid">{props.dates.map((date) => <DayColumn key={date} date={date} selected={date === props.selectedDate} {...props} />)}</div>
  </div>
}

function DayColumn({ date, today, selected, entries, recipes, onSelectDate, onAdd, onReplace, onRemove, onOpen }: Props & { date: string; selected: boolean }) {
  const readOnly = date < today
  return <section className={`week-day ${date === today ? 'today' : ''} ${selected ? 'selected' : ''}`} aria-label={parseLocalDate(date).toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })}>
    <button type="button" className="week-day-header" onClick={() => onSelectDate(date)}><span>{parseLocalDate(date).toLocaleDateString('uk-UA', { weekday: 'short' })}</span><strong>{parseLocalDate(date).getDate()}</strong></button>
    <div className="week-day-slots">{mealSlots.map(({ value, label }) => {
      const entry = entries.find((item) => item.date === date && item.slot === value)
      const recipe = entry ? recipes.get(entry.recipeId) : undefined
      return <div className="calendar-meal-slot" key={value}><span className="calendar-slot-label">{label}</span>{entry && recipe ? <MealCard entry={entry} recipe={recipe} readOnly={readOnly} onOpen={(trigger) => onOpen(entry, recipe, trigger)} onReplace={() => onReplace(entry)} onRemove={() => onRemove(entry)} /> : entry ? <div className="missing-recipe">Рецепт недоступний</div> : <button type="button" className="empty-meal-slot" disabled={readOnly} onClick={() => onAdd(date, value)}>+ <span>Додати страву</span></button>}</div>
    })}</div>
  </section>
}
