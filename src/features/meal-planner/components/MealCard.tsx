import { useState, type MouseEvent } from 'react'
import { MoreHorizontal } from 'lucide-react'
import type { RecipeSummary } from '../../recipes/types'
import type { MealPlanEntry } from '../types'
import { RecipeImage } from './RecipeImage'

export function MealCard({ entry, recipe, readOnly, onOpen, onReplace, onRemove }: { entry: MealPlanEntry; recipe: RecipeSummary; readOnly: boolean; onOpen: (trigger: HTMLElement) => void; onReplace: () => void; onRemove: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const openMenu = (event: MouseEvent<HTMLButtonElement>) => { event.stopPropagation(); setMenuOpen((value) => !value) }
  return <article className="meal-card">
    <button className="meal-card-main" type="button" onClick={(event) => onOpen(event.currentTarget)} aria-label={`Відкрити рецепт ${recipe.name}`}>
      <RecipeImage blob={recipe.image?.blob} url={recipe.image?.url} alt="" className="meal-card-image" />
      <span className="meal-card-copy"><strong>{recipe.name}</strong><small>{entry.servings} {entry.servings === 1 ? 'порція' : 'порції'}</small></span>
    </button>
    {!readOnly && <div className="meal-card-menu-wrap"><button type="button" className="meal-menu-trigger" aria-label={`Дії для ${recipe.name}`} aria-expanded={menuOpen} onClick={openMenu}><MoreHorizontal aria-hidden="true" /></button>{menuOpen && <div className="meal-card-menu"><button type="button" onClick={() => { setMenuOpen(false); onReplace() }}>Замінити</button><button type="button" className="danger" onClick={() => { setMenuOpen(false); onRemove() }}>Видалити</button></div>}</div>}
  </article>
}
