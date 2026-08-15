import { useState, type MouseEvent } from 'react'
import { MoreHorizontal } from 'lucide-react'
import type { RecipeSummary } from '../../recipes/types'
import type { MealPlanEntry } from '../types'
import { RecipeImage } from './RecipeImage'

const servingOptions = Array.from({ length: 99 }, (_, index) => index + 1)

export function WeekMealCard({ entry, recipe, readOnly, onOpen, onReplace, onRemove, onServingsChange }: { entry: MealPlanEntry; recipe: RecipeSummary; readOnly: boolean; onOpen: (trigger: HTMLElement) => void; onReplace: () => void; onRemove: () => void; onServingsChange: (servings: number) => Promise<void> | void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [servingsPending, setServingsPending] = useState(false)
  const openMenu = (event: MouseEvent<HTMLButtonElement>) => { event.stopPropagation(); setMenuOpen((value) => !value) }
  const updateServings = async (servings: number) => {
    setServingsPending(true)
    try { await onServingsChange(servings) } finally { setServingsPending(false) }
  }
  return <article className="meal-card">
    <button className="meal-card-main" type="button" title={recipe.name} data-tooltip={recipe.name} onClick={(event) => onOpen(event.currentTarget)} aria-label={`Відкрити рецепт ${recipe.name}`}>
      <RecipeImage blob={recipe.image?.blob} url={recipe.image?.url} alt="" className="meal-card-image" />
    </button>
    <div className={`meal-card-servings ${readOnly ? 'read-only' : ''}`}>
      <span>Порції</span>
      {readOnly ? <strong>{entry.servings}</strong> : <select aria-label={`Кількість порцій для ${recipe.name}`} value={entry.servings} disabled={servingsPending} onChange={(event) => void updateServings(Number(event.target.value))}>{servingOptions.map((servings) => <option key={servings} value={servings}>{servings}</option>)}</select>}
    </div>
    {!readOnly && <div className="meal-card-menu-wrap"><button type="button" className="meal-menu-trigger" aria-label={`Дії для ${recipe.name}`} aria-expanded={menuOpen} onClick={openMenu}><MoreHorizontal aria-hidden="true" /></button>{menuOpen && <div className="meal-card-menu"><button type="button" onClick={() => { setMenuOpen(false); onReplace() }}>Замінити</button><button type="button" className="danger" onClick={() => { setMenuOpen(false); onRemove() }}>Видалити</button></div>}</div>}
  </article>
}
