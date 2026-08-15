import { useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { X } from 'lucide-react'
import type { RecipeSummary } from '../../recipes/types'
import type { MealSlot } from '../domain/meal-plan'
import { mealSlots, parseLocalDate } from '../domain/meal-plan'
import { RecipeImage } from './RecipeImage'
import { useDialogFocus } from './useDialogFocus'
import { getRecipeSubcategory, recipeAvailableForMealType, recipeSubcategories } from '../../recipes/domain/recipe-taxonomy'

interface Props {
  date: string
  slot: MealSlot
  recipes: RecipeSummary[]
  initialRecipeId?: string
  initialServings?: number
  onClose: () => void
  onSave: (recipeId: string, servings: number) => Promise<void>
}

export function RecipePickerDialog({ date, slot, recipes, initialRecipeId, initialServings = 1, onClose, onSave }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const eligible = useMemo(() => recipes.filter((recipe) => recipeAvailableForMealType(recipe.classifications, slot)), [recipes, slot])
  const initial = eligible.some((recipe) => recipe.id === initialRecipeId) ? initialRecipeId! : eligible[0]?.id ?? ''
  const [selectedId, setSelectedId] = useState(initial)
  const [servings, setServings] = useState(initialServings)
  const [query, setQuery] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [pending, setPending] = useState(false)
  const filtered = useMemo(() => eligible.filter((recipe) => recipe.name.toLocaleLowerCase('uk-UA').includes(query.trim().toLocaleLowerCase('uk-UA')) && (!subcategory || recipe.classifications.some((item) => item.mealType === slot && item.subcategoryId === subcategory))), [eligible, query, slot, subcategory])
  const categories = recipeSubcategories.filter((item) => item.mealType === slot)
  useDialogFocus(dialogRef, onClose)
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!selectedId || !Number.isInteger(servings) || servings < 1 || servings > 99) return
    setPending(true)
    try { await onSave(selectedId, servings) } finally { setPending(false) }
  }
  const backdrop = (event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose() }
  const slotLabel = mealSlots.find((item) => item.value === slot)?.label
  return <div className="planner-dialog-backdrop" onMouseDown={backdrop}><div className="planner-dialog picker-dialog" role="dialog" aria-modal="true" aria-labelledby="picker-title" ref={dialogRef}>
    <form onSubmit={submit}><header className="planner-dialog-header"><div><p className="eyebrow">{slotLabel} · {parseLocalDate(date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}</p><h2 id="picker-title">{initialRecipeId ? 'Замінити страву' : 'Додати страву'}</h2></div><button type="button" className="dialog-close" aria-label="Закрити" onClick={onClose}><X aria-hidden="true" /></button></header>
      {eligible.length ? <><div className="picker-filter-row"><label className="picker-search"><span className="sr-only">Пошук рецептів</span><input type="search" placeholder="Знайти рецепт…" value={query} onChange={(event) => setQuery(event.target.value)} /></label><div className="recipe-subcategory-filters picker-category-chips" role="group" aria-label="Підкатегорії"><button type="button" className={!subcategory ? 'active' : ''} aria-pressed={!subcategory} onClick={() => setSubcategory('')}>Усі підкатегорії</button>{categories.map((item) => <button type="button" key={item.subcategoryId} className={subcategory === item.subcategoryId ? 'active' : ''} aria-pressed={subcategory === item.subcategoryId} onClick={() => setSubcategory(item.subcategoryId)}>{item.label}</button>)}</div></div><div className="picker-recipes">{filtered.map((recipe) => <button type="button" key={recipe.id} className={`picker-recipe ${selectedId === recipe.id ? 'selected' : ''}`} aria-pressed={selectedId === recipe.id} onClick={() => setSelectedId(recipe.id)}><RecipeImage blob={recipe.image?.blob} url={recipe.image?.url} alt="" className="picker-recipe-image" /><span><strong>{recipe.name}</strong><small>{recipe.classifications.length ? recipe.classifications.filter((item) => item.mealType === slot).map((item) => getRecipeSubcategory(item.subcategoryId)?.label).filter(Boolean).join(' · ') : 'Без категорії'}</small></span></button>)}</div>{!filtered.length && <p className="picker-empty">За цим запитом рецептів немає.</p>}<div className="picker-footer"><label>Кількість порцій<input type="number" min="1" max="99" value={servings} onChange={(event) => setServings(Number(event.target.value))} /></label><button className="button button-primary" disabled={pending || !selectedId}>{pending ? 'Зберігаємо…' : initialRecipeId ? 'Замінити в плані' : 'Додати до плану'}</button></div></> : <div className="picker-empty"><h3>Немає рецептів для цього прийому їжі</h3><p>Додайте відповідну категорію до рецепту або створіть новий.</p></div>}
    </form></div></div>
}
