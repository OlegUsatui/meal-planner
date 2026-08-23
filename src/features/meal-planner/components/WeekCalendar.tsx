import type { RecipeSummary } from '../../recipes/types'
import { mealSlots, type MealSlot } from '../domain/meal-plan'
import type { MealPlanEntry } from '../types'
import { WeekMealCard } from './WeekMealCard'
import { CalendarDaySelector } from '../../../shared/ui/CalendarDaySelector'

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
  return <div className="week-calendar view-week">
    <CalendarDaySelector dates={props.dates} today={props.today} selectedDate={props.selectedDate} onSelect={props.onSelectDate} variant="strip" className="mobile-day-strip" />
    <WeekGrid {...props} />
  </div>
}

function WeekGrid({ dates, today, selectedDate, entries, recipes, onSelectDate, onAdd, onReplace, onRemove, onOpen }: Props) {
  return <div className="week-grid week-grid-week" role="grid" aria-label="Тижневий план">
    <CalendarDaySelector dates={dates} today={today} selectedDate={selectedDate} onSelect={onSelectDate} variant="grid" className="week-grid-day-header" />
    {mealSlots.map(({ value, label }) => <div className="week-grid-slot" key={value}><span className="week-grid-slot-label">{label}</span>{dates.map((date) => {
      const entry = entries.find((item) => item.date === date && item.slot === value)
      const recipe = entry ? recipes.get(entry.recipeId) : undefined
      const readOnly = date < today
      return <div className={`week-grid-cell ${date === selectedDate ? 'selected' : ''}`} role="gridcell" key={`${date}:${value}`}>{entry && recipe ? <WeekMealCard recipe={recipe} readOnly={readOnly} onOpen={(trigger) => onOpen(entry, recipe, trigger)} onReplace={() => onReplace(entry)} onRemove={() => onRemove(entry)} /> : entry ? <div className="missing-recipe">Рецепт недоступний</div> : <button type="button" className="empty-meal-slot" disabled={readOnly} onClick={() => onAdd(date, value)}>+ <span>Додати страву</span></button>}</div>
    })}</div>)}
  </div>
}
