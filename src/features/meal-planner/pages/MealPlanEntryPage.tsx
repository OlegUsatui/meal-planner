import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, Search } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { cacheTimes, queryKeys } from '../../../app/query/query-client'
import { invalidateMealPlanData } from '../../../app/query/invalidation'
import { useOptionalAuth } from '../../auth/useAuth'
import { getRecipeSubcategory, recipeAvailableForMealType, recipeSubcategories } from '../../recipes/domain/recipe-taxonomy'
import { formatPreparationTime } from '../../recipes/domain/recipe'
import { useRecipeRepository } from '../../recipes/repositories/useRecipeRepository'
import type { RecipeSummary } from '../../recipes/types'
import { RecipeImage } from '../components/RecipeImage'
import { mealSlots, parseLocalDate, type MealSlot } from '../domain/meal-plan'
import { useMealPlanRepository } from '../repositories/useMealPlanRepository'

const localToday = () => new Intl.DateTimeFormat('sv-SE').format(new Date())

export function MealPlanEntryPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const recipeRepository = useRecipeRepository()
  const plan = useMealPlanRepository()
  const queryClient = useQueryClient()
  const userId = useOptionalAuth()?.session?.user.id ?? 'test-session'
  const date = validDate(searchParams.get('date')) ?? localToday()
  const slot = validSlot(searchParams.get('slot')) ?? 'breakfast'
  const replacing = Boolean(searchParams.get('entryId'))
  const initialRecipeId = searchParams.get('recipeId') ?? ''
  const servings = parseServings(searchParams.get('servings')) ?? 2
  const [selectedId, setSelectedId] = useState(initialRecipeId)
  const [search, setSearch] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [pending, setPending] = useState(false)
  const [actionError, setActionError] = useState('')

  const recipesQuery = useQuery({
    queryKey: queryKeys.recipes(userId, {}),
    queryFn: () => recipeRepository.list(),
    staleTime: cacheTimes.catalogueStale,
    refetchOnWindowFocus: false,
  })
  const eligible = useMemo(
    () => (recipesQuery.data ?? []).filter((recipe) => recipeAvailableForMealType(recipe.classifications, slot)),
    [recipesQuery.data, slot],
  )
  const categories = useMemo(() => recipeSubcategories.filter((item) => item.mealType === slot), [slot])
  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('uk-UA')
    return eligible.filter((recipe) => recipe.name.toLocaleLowerCase('uk-UA').includes(normalizedSearch) && (!subcategory || recipe.classifications.some((item) => item.mealType === slot && item.subcategoryId === subcategory)))
  }, [eligible, search, slot, subcategory])
  const slotLabel = mealSlots.find((item) => item.value === slot)?.label ?? slot
  const selectedRecipe = eligible.find((recipe) => recipe.id === selectedId)

  function selectSubcategory(next: string) {
    if (next !== subcategory) setSelectedId('')
    setSubcategory(next)
  }

  useEffect(() => {
    if (!selectedId || eligible.some((recipe) => recipe.id === selectedId)) return
    setSelectedId('')
  }, [eligible, selectedId])

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!selectedId) return
    setPending(true)
    setActionError('')
    try {
      await plan.upsert({ date, slot, recipeId: selectedId, servings })
      await invalidateMealPlanData(queryClient, userId)
      navigate(`/plan?date=${encodeURIComponent(date)}`, { replace: true })
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : 'Не вдалося зберегти страву. Перевірте з’єднання та спробуйте ще раз.')
    } finally {
      setPending(false)
    }
  }

  return <section className="page meal-plan-entry-page">
    <Link className="back-link" to={`/plan?date=${encodeURIComponent(date)}`}><ArrowLeft aria-hidden="true" /> До плану</Link>
    <header className="page-header meal-plan-entry-header">
      <div>
        <p className="eyebrow">{slotLabel} · {parseLocalDate(date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}</p>
        <h1>{replacing ? 'Замінити страву' : 'Додати страву'}</h1>
        <p className="page-intro">Оберіть рецепт і відфільтруйте категорію. Після вибору дія додавання з’явиться внизу екрана.</p>
      </div>
    </header>

    {recipesQuery.isPending && <div className="loading-panel" role="status">Завантажуємо рецепти…</div>}
    {recipesQuery.isError && <div className="form-alert" role="alert"><span>Не вдалося завантажити рецепти.</span><button type="button" className="button button-secondary" onClick={() => void recipesQuery.refetch()}>Повторити</button></div>}
    {!recipesQuery.isPending && !recipesQuery.isError && <form className="meal-plan-entry-form" onSubmit={save}>
      <div className="meal-plan-entry-toolbar">
        <label className="search-field meal-plan-entry-search"><Search aria-hidden="true" /><span className="sr-only">Пошук рецептів</span><input type="search" placeholder="Знайти рецепт…" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <div className="recipe-subcategory-filters meal-plan-category-chips" role="group" aria-label="Підкатегорії">
          <button type="button" className={!subcategory ? 'active' : ''} aria-pressed={!subcategory} onClick={() => selectSubcategory('')}>Усі підкатегорії</button>
          {categories.map((category) => <button type="button" key={category.subcategoryId} className={subcategory === category.subcategoryId ? 'active' : ''} aria-pressed={subcategory === category.subcategoryId} onClick={() => selectSubcategory(category.subcategoryId)}>{category.label}</button>)}
        </div>
      </div>
      {actionError && <p className="form-alert" role="alert">{actionError}</p>}
      {!filtered.length && <div className="empty-state meal-plan-entry-empty"><h2>Рецептів не знайдено</h2><p>Змініть пошук або оберіть іншу категорію.</p></div>}
      {!!filtered.length && <div className="meal-plan-entry-content">
        <div className="recipe-grid meal-plan-entry-recipes" aria-label="Рецепти">{filtered.map((recipe) => <RecipeOption key={recipe.id} recipe={recipe} slot={slot} selected={recipe.id === selectedId} onSelect={() => setSelectedId((current) => current === recipe.id ? '' : recipe.id)} />)}</div>
      </div>}
      {selectedRecipe && <div className="meal-plan-entry-actions">
        <div className="meal-plan-entry-action-copy" aria-live="polite"><span className="eyebrow">Вибрано</span><strong>{selectedRecipe.name}</strong></div>
        <button type="submit" className="button button-primary meal-plan-entry-submit" disabled={pending}>{pending ? 'Зберігаємо…' : replacing ? 'Замінити в плані' : 'Додати до плану'} <Check aria-hidden="true" /></button>
      </div>}
    </form>}
  </section>
}

function RecipeOption({ recipe, slot, selected, onSelect }: { recipe: RecipeSummary; slot: MealSlot; selected: boolean; onSelect: () => void }) {
  return <button type="button" className={`recipe-card meal-plan-recipe-card ${selected ? 'selected' : ''}`} aria-pressed={selected} onClick={onSelect}><RecipeImage blob={recipe.image?.blob} url={recipe.image?.url} alt="" className="meal-plan-recipe-card-image" /><div><p className="eyebrow">{formatPreparationTime(recipe.preparationTimeMinMinutes, recipe.preparationTimeMaxMinutes) ?? 'Час не вказано'}</p><h2>{recipe.name}</h2><p>{getRecipeLabels(recipe, slot)}</p></div>{selected && <Check aria-hidden="true" />}</button>
}

function getRecipeLabels(recipe: RecipeSummary, slot: MealSlot): string {
  const labels = recipe.classifications.filter((item) => item.mealType === slot).map((item) => getRecipeSubcategory(item.subcategoryId)?.label).filter(Boolean)
  return labels.length ? labels.join(' · ') : 'Без категорії'
}

function validDate(value: string | null): string | undefined { return value && /^\d{4}-\d{2}-\d{2}$/u.test(value) ? value : undefined }
function validSlot(value: string | null): MealSlot | undefined { return value && ['breakfast', 'lunch', 'dinner', 'snack'].includes(value) ? value as MealSlot : undefined }
function parseServings(value: string | null): number | undefined { const servings = Number(value); return Number.isInteger(servings) && servings >= 1 && servings <= 99 ? servings : undefined }
