import { useCallback, useState, type MouseEvent } from 'react'
import type { RecipeSummary } from '../../recipes/types'
import { mealSlots, type MealSlot } from '../domain/meal-plan'
import type { MealPlanEntry } from '../types'
import { WeekMealCard } from './WeekMealCard'
import { CalendarDaySelector } from '../../../shared/ui/CalendarDaySelector'
import { MealPlanContextMenu, type MealPlanContextMenuItem } from './MealPlanContextMenu'
import { ActionMenu } from '../../../shared/ui/ActionMenu'

interface Props {
  dates: string[]
  today: string
  selectedDate: string
  entries: MealPlanEntry[]
  recipes: Map<string, RecipeSummary>
  clipboardRecipeId?: string
  onSelectDate: (date: string) => void
  onAdd: (date: string, slot: MealSlot) => void
  onCopy: (recipeId: string) => void
  onPaste: (date: string, slot: MealSlot) => void
  onMove: (entry: MealPlanEntry, date: string, slot: MealSlot) => void
  onReplace: (entry: MealPlanEntry) => void
  onRemove: (entry: MealPlanEntry) => void
  onOpen: (entry: MealPlanEntry, recipe: RecipeSummary, trigger: HTMLElement) => void
}

interface ContextTarget {
  x: number
  y: number
  date: string
  slot: MealSlot
  entry?: MealPlanEntry
  recipe?: RecipeSummary
}

export function WeekCalendar(props: Props) {
  const [contextTarget, setContextTarget] = useState<ContextTarget>()
  const openContextMenu = useCallback((event: MouseEvent<HTMLElement>, date: string, slot: MealSlot, entry?: MealPlanEntry, recipe?: RecipeSummary) => {
    event.preventDefault()
    if (date < props.today) return
    setContextTarget({ x: Math.max(8, Math.min(event.clientX, window.innerWidth - 190)), y: Math.max(8, Math.min(event.clientY, window.innerHeight - 190)), date, slot, entry, recipe })
  }, [props.today])
  const closeContextMenu = useCallback(() => setContextTarget(undefined), [])
  const contextItems: MealPlanContextMenuItem[] = contextTarget ? [
    ...(contextTarget.recipe ? [{ label: 'Копіювати', onSelect: () => props.onCopy(contextTarget.recipe!.id) }] : []),
    ...(props.clipboardRecipeId ? [{ label: 'Вставити', onSelect: () => props.onPaste(contextTarget.date, contextTarget.slot) }] : []),
    ...(contextTarget.entry && contextTarget.recipe ? [{ label: 'Замінити', onSelect: () => props.onReplace(contextTarget.entry!) }] : []),
    ...(contextTarget.entry && contextTarget.recipe ? [{ label: 'Видалити', onSelect: () => props.onRemove(contextTarget.entry!), danger: true }] : []),
  ] : []

  return <div className="week-calendar view-week">
    <CalendarDaySelector dates={props.dates} today={props.today} selectedDate={props.selectedDate} onSelect={props.onSelectDate} variant="strip" className="mobile-day-strip" />
    <WeekGrid {...props} onContextMenu={openContextMenu} />
    {contextTarget && contextItems.length > 0 && <MealPlanContextMenu x={contextTarget.x} y={contextTarget.y} label={`Дії для ${contextTarget.recipe?.name ?? 'слоту'}`} items={contextItems} onClose={closeContextMenu} />}
  </div>
}

function WeekGrid({ dates, today, selectedDate, entries, recipes, clipboardRecipeId, onSelectDate, onAdd, onCopy, onPaste, onMove, onReplace, onRemove, onOpen, onContextMenu }: Props & { onContextMenu: (event: MouseEvent<HTMLElement>, date: string, slot: MealSlot, entry?: MealPlanEntry, recipe?: RecipeSummary) => void }) {
  const [draggingId, setDraggingId] = useState<string>()
  const [dragOverKey, setDragOverKey] = useState<string>()
  const findEntry = (date: string, slot: MealSlot) => entries.find((item) => item.date === date && item.slot === slot)
  const clearDrag = () => { setDraggingId(undefined); setDragOverKey(undefined) }
  const dropOn = (date: string, slot: MealSlot) => {
    const source = entries.find((item) => item.id === draggingId)
    if (source) onMove(source, date, slot)
    clearDrag()
  }

  return <div className="week-grid week-grid-week" role="grid" aria-label="Тижневий план">
    <CalendarDaySelector dates={dates} today={today} selectedDate={selectedDate} onSelect={onSelectDate} variant="grid" className="week-grid-day-header" />
    {mealSlots.map(({ value, label }) => <div className="week-grid-slot" key={value}><span className="week-grid-slot-label">{label}</span>{dates.map((date) => {
      const entry = findEntry(date, value)
      const recipe = entry ? recipes.get(entry.recipeId) : undefined
      const readOnly = date < today
      const cellKey = `${date}:${value}`
      const canDrop = Boolean(draggingId) && !readOnly
      return <div className={`week-grid-cell ${date === selectedDate ? 'selected' : ''} ${dragOverKey === cellKey ? 'drag-over' : ''}`} role="gridcell" key={cellKey} onContextMenu={(event) => onContextMenu(event, date, value, entry, recipe)} onDragOver={(event) => { if (canDrop) { event.preventDefault(); setDragOverKey(cellKey) } }} onDragLeave={() => { if (dragOverKey === cellKey) setDragOverKey(undefined) }} onDrop={(event) => { event.preventDefault(); if (canDrop) dropOn(date, value) }}>
        {entry && recipe ? <WeekMealCard recipe={recipe} readOnly={readOnly} onOpen={(trigger) => onOpen(entry, recipe, trigger)} onCopy={() => onCopy(recipe.id)} onPaste={clipboardRecipeId ? () => onPaste(date, value) : undefined} onReplace={() => onReplace(entry)} onRemove={() => onRemove(entry)} onContextMenu={(event) => onContextMenu(event, date, value, entry, recipe)} onDragStart={() => setDraggingId(entry.id)} onDragEnd={clearDrag} /> : entry ? <div className="missing-recipe">Рецепт недоступний</div> : <div className="empty-meal-slot-wrap"><button type="button" className="empty-meal-slot" disabled={readOnly} onClick={() => onAdd(date, value)}>+ <span>Додати страву</span></button>{clipboardRecipeId && !readOnly && <ActionMenu label={`Дії для ${label}, ${date}`} items={[{ label: 'Вставити', onSelect: () => onPaste(date, value) }]} className="empty-slot-menu-wrap" triggerClassName="empty-slot-menu-trigger" />}</div>}
      </div>
    })}</div>)}
  </div>
}
