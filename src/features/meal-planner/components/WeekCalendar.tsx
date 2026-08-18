import type { RecipeSummary } from '../../recipes/types'
import { mealSlots, parseLocalDate, type MealSlot } from '../domain/meal-plan'
import type { MealPlanEntry } from '../types'
import { DayMealCard } from './DayMealCard'
import { WeekMealCard } from './WeekMealCard'
import { CalendarDaySelector } from '../../../shared/ui/CalendarDaySelector'

export type CalendarViewMode = 'day' | 'week'

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
  onServingsChange: (entry: MealPlanEntry, servings: number) => Promise<void> | void
  onOpen: (entry: MealPlanEntry, recipe: RecipeSummary, trigger: HTMLElement) => void
  viewMode: CalendarViewMode
}

export function WeekCalendar(props: Props) {
  return <div className={`week-calendar view-${props.viewMode}`}>
    <CalendarDaySelector dates={props.dates} today={props.today} selectedDate={props.selectedDate} onSelect={props.onSelectDate} variant="strip" className="mobile-day-strip" />
    {props.viewMode === 'week' ? <WeekGrid {...props} /> : <div className="week-grid week-grid-day"><DayColumn date={props.selectedDate} selected {...props} /></div>}
  </div>
}

function WeekGrid({ dates, today, selectedDate, entries, recipes, onSelectDate, onAdd, onReplace, onRemove, onServingsChange, onOpen }: Props) {
  return <div className="week-grid week-grid-week" role="grid" aria-label="Тижневий план">
    <CalendarDaySelector dates={dates} today={today} selectedDate={selectedDate} onSelect={onSelectDate} variant="grid" className="week-grid-day-header" />
    {mealSlots.map(({ value, label }) => <div className="week-grid-slot" key={value}><span className="week-grid-slot-label">{label}</span>{dates.map((date) => {
      const entry = entries.find((item) => item.date === date && item.slot === value)
      const recipe = entry ? recipes.get(entry.recipeId) : undefined
      const readOnly = date < today
      return <div className="week-grid-cell" role="gridcell" key={`${date}:${value}`}>{entry && recipe ? <WeekMealCard entry={entry} recipe={recipe} readOnly={readOnly} onOpen={(trigger) => onOpen(entry, recipe, trigger)} onReplace={() => onReplace(entry)} onRemove={() => onRemove(entry)} onServingsChange={(servings) => onServingsChange(entry, servings)} /> : entry ? <div className="missing-recipe">Рецепт недоступний</div> : <button type="button" className="empty-meal-slot" disabled={readOnly} onClick={() => onAdd(date, value)}>+ <span>Додати страву</span></button>}</div>
    })}</div>)}
  </div>
}

function DayColumn({ date, today, selected, entries, recipes, onSelectDate, onAdd, onReplace, onRemove, onServingsChange, onOpen }: Props & { date: string; selected: boolean }) {
  const readOnly = date < today
  return <section className={`week-day ${date === today ? 'today' : ''} ${selected ? 'selected' : ''}`} aria-label={parseLocalDate(date).toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })}>
    <CalendarDaySelector dates={[date]} today={today} selectedDate={selected ? date : undefined} onSelect={onSelectDate} variant="day" className="week-day-header" />
    <div className="week-day-slots">{mealSlots.map(({ value, label }) => {
      const entry = entries.find((item) => item.date === date && item.slot === value)
      const recipe = entry ? recipes.get(entry.recipeId) : undefined
      return <div className="calendar-meal-slot" key={value}><span className="calendar-slot-label">{label}</span>{entry && recipe ? <DayMealCard entry={entry} recipe={recipe} readOnly={readOnly} onOpen={(trigger) => onOpen(entry, recipe, trigger)} onReplace={() => onReplace(entry)} onRemove={() => onRemove(entry)} onServingsChange={(servings) => onServingsChange(entry, servings)} /> : entry ? <div className="missing-recipe">Рецепт недоступний</div> : <button type="button" className="empty-meal-slot" disabled={readOnly} onClick={() => onAdd(date, value)}>+ <span>Додати страву</span></button>}</div>
    })}</div>
  </section>
}
