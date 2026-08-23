import { useNavigate } from 'react-router-dom'
import { LoadingState } from '../../shared/ui/LoadingState'
import { mealSlots } from '../meal-planner/domain/meal-plan'
import { DayMealCard } from '../meal-planner/components/DayMealCard'
import type { Recipe } from '../recipes/types'
import type { DashboardMeal } from './types'

export function TodayMeals({ today, entries, recipes, recipesLoading }: { today: string; entries: DashboardMeal[]; recipes: Map<string, Recipe>; recipesLoading: boolean }) {
  const navigate = useNavigate()

  const openDetails = (entry: DashboardMeal, recipe: Recipe) => {
    const query = new URLSearchParams({ planDate: entry.date, planSlot: entry.slot, returnTo: '/' })
    navigate(`/recipes/${recipe.id}?${query.toString()}`)
  }
  const openAdd = (slot: DashboardMeal['slot']) => navigate(`/plan/add?date=${encodeURIComponent(today)}&slot=${encodeURIComponent(slot)}`)

  return <>
    {recipesLoading && <LoadingState>Завантажуємо страви…</LoadingState>}
    <div className="today-slots">{mealSlots.map(({ value, label }) => {
      const entry = entries.find((item) => item.slot === value)
      const recipe = entry ? recipes.get(entry.recipeId) : undefined
      return <div className="today-slot-item" key={value}><span className="today-slot-label">{label}</span>{entry && recipe ? <DayMealCard recipe={recipe} onOpen={() => openDetails(entry, recipe)} /> : entry ? <div className="missing-recipe">Рецепт недоступний</div> : <button type="button" className="empty-meal-slot" onClick={() => openAdd(value)}>+ <span>Додати страву</span></button>}</div>
    })}</div>
  </>
}
