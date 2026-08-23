import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowUpRight, Check } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
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
import { BackLink } from '../../../shared/ui/BackLink'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { LoadingState } from '../../../shared/ui/LoadingState'
import { RetryBanner } from '../../../shared/ui/RetryBanner'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { SearchField } from '../../../shared/ui/SearchField'
import { ChipGroup } from '../../../shared/ui/ChipGroup'
import { Alert } from '../../../shared/ui/Alert'
import { Button } from '../../../shared/ui/Button'

const localToday = () => new Intl.DateTimeFormat('sv-SE').format(new Date())

export function MealPlanEntryPage() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const recipeRepository = useRecipeRepository()
  const plan = useMealPlanRepository()
  const queryClient = useQueryClient()
  const userId = useOptionalAuth()?.session?.user.id ?? 'test-session'
  const date = validDate(searchParams.get('date')) ?? localToday()
  const slot = validSlot(searchParams.get('slot')) ?? 'breakfast'
  const replacing = Boolean(searchParams.get('entryId'))
  const initialRecipeId = searchParams.get('recipeId') ?? ''
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
      await plan.upsert({ date, slot, recipeId: selectedId })
      await invalidateMealPlanData(queryClient, userId)
      navigate(`/plan?date=${encodeURIComponent(date)}`, { replace: true })
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : 'Не вдалося зберегти страву. Перевірте з’єднання та спробуйте ще раз.')
    } finally {
      setPending(false)
    }
  }

  return <section className="page meal-plan-entry-page">
    <BackLink to={`/plan?date=${encodeURIComponent(date)}`}>До плану</BackLink>
    <PageHeader className="meal-plan-entry-header" eyebrow={`${slotLabel} · ${parseLocalDate(date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}`} title={replacing ? 'Замінити страву' : 'Додати страву'} description="Оберіть рецепт і відфільтруйте категорію. Після вибору дія додавання з’явиться внизу екрана." />

    {recipesQuery.isPending && <LoadingState>Завантажуємо рецепти…</LoadingState>}
    {recipesQuery.isError && <RetryBanner hasData={Boolean(recipesQuery.data?.length)} staleMessage="Показуємо останній завантажений каталог." errorMessage="Не вдалося завантажити рецепти." onRetry={() => void recipesQuery.refetch()} pending={recipesQuery.isFetching} />}
    {!recipesQuery.isPending && !recipesQuery.isError && <form className="meal-plan-entry-form" onSubmit={save}>
      <div className="meal-plan-entry-toolbar">
        <SearchField className="meal-plan-entry-search" label="Пошук рецептів" placeholder="Знайти рецепт…" value={search} onChange={setSearch} />
        <ChipGroup ariaLabel="Підкатегорії" value={subcategory} onChange={selectSubcategory} className="recipe-subcategory-filters meal-plan-category-chips" options={[{ value: '', label: 'Усі підкатегорії' }, ...categories.map((category) => ({ value: category.subcategoryId, label: category.label }))]} />
      </div>
      {actionError && <Alert variant="error">{actionError}</Alert>}
      {!filtered.length && <EmptyState className="meal-plan-entry-empty" title="Рецептів не знайдено" description="Змініть пошук або оберіть іншу категорію." />}
      {!!filtered.length && <div className="meal-plan-entry-content">
      <div className="recipe-grid meal-plan-entry-recipes" aria-label="Рецепти">{filtered.map((recipe) => <RecipeOption key={recipe.id} recipe={recipe} slot={slot} selected={recipe.id === selectedId} onSelect={() => setSelectedId((current) => current === recipe.id ? '' : recipe.id)} detailHref={`/recipes/${encodeURIComponent(recipe.id)}?${new URLSearchParams({ planDate: date, planSlot: slot, planMode: replacing ? 'replace' : 'add', returnTo: `${location.pathname}${location.search}` }).toString()}`} />)}</div>
      </div>}
      {selectedRecipe && <div className="meal-plan-entry-actions">
        <div className="meal-plan-entry-action-copy" aria-live="polite"><span className="eyebrow">Вибрано</span><strong>{selectedRecipe.name}</strong></div>
        <Button type="submit" className="meal-plan-entry-submit" disabled={pending}>{pending ? 'Зберігаємо…' : replacing ? 'Замінити в плані' : 'Додати до плану'} <Check aria-hidden="true" /></Button>
      </div>}
    </form>}
  </section>
}

function RecipeOption({ recipe, slot, selected, onSelect, detailHref }: { recipe: RecipeSummary; slot: MealSlot; selected: boolean; onSelect: () => void; detailHref: string }) {
  return <article className={`recipe-card meal-plan-recipe-card ${selected ? 'selected' : ''}`}><button type="button" className="meal-plan-recipe-select" aria-pressed={selected} onClick={onSelect}><RecipeImage blob={recipe.image?.blob} url={recipe.image?.url} alt="" className="meal-plan-recipe-card-image" /><span className="meal-plan-recipe-copy"><span className="eyebrow">{formatPreparationTime(recipe.preparationTimeMinMinutes, recipe.preparationTimeMaxMinutes) ?? 'Час не вказано'}</span><strong>{recipe.name}</strong><span>{getRecipeLabels(recipe, slot)}</span></span>{selected && <Check aria-hidden="true" />}</button><Link className="meal-plan-recipe-open" to={detailHref}><span>Відкрити рецепт</span><ArrowUpRight aria-hidden="true" /></Link></article>
}

function getRecipeLabels(recipe: RecipeSummary, slot: MealSlot): string {
  const labels = recipe.classifications.filter((item) => item.mealType === slot).map((item) => getRecipeSubcategory(item.subcategoryId)?.label).filter(Boolean)
  return labels.length ? labels.join(' · ') : 'Без категорії'
}

function validDate(value: string | null): string | undefined { return value && /^\d{4}-\d{2}-\d{2}$/u.test(value) ? value : undefined }
function validSlot(value: string | null): MealSlot | undefined { return value && ['breakfast', 'lunch', 'dinner', 'snack'].includes(value) ? value as MealSlot : undefined }
