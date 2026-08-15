import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { formatQuantity } from '../../../shared/formatting/format'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import { PermanentDeleteDialog } from '../../../shared/ui/PermanentDeleteDialog'
import { useOptionalAuth } from '../../auth/useAuth'
import type { MealSlot } from '../../meal-planner/domain/meal-plan'
import { useMealPlanRepository } from '../../meal-planner/repositories/useMealPlanRepository'
import { formatPreparationTime, scaleIngredientQuantity } from '../domain/recipe'
import { getRecipeSubcategory, recipeMealTypes } from '../domain/recipe-taxonomy'
import { useRecipeRepository } from '../repositories/useRecipeRepository'
import { cacheTimes, queryKeys } from '../../../app/query/query-client'
import { invalidateMealPlanData, invalidateRecipeData } from '../../../app/query/invalidation'

export function RecipeDetailPage() {
  const { recipeId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const repository = useRecipeRepository()
  const queryClient = useQueryClient()
  const mealPlan = useMealPlanRepository()
  const [searchParams] = useSearchParams()
  const auth = useOptionalAuth()
  const userId = auth?.session?.user.id ?? 'test-session'
  const isAdmin = auth?.isAdmin ?? false
  const planDate = validDate(searchParams.get('planDate'))
  const planSlot = validMealSlot(searchParams.get('planSlot'))
  const planMode = searchParams.get('planMode') === 'replace' ? 'replace' : searchParams.get('planMode') === 'add' ? 'add' : undefined
  const planServings = parseServings(searchParams.get('planServings'))
  const planContext = planDate && planSlot && planMode ? { date: planDate, slot: planSlot, mode: planMode } : undefined
  const plannedView = planDate && planSlot ? { date: planDate, slot: planSlot } : undefined
  const returnTo = safeReturnTo(searchParams.get('returnTo'))
  const successMessage = searchParams.get('created') === '1' ? 'Рецепт створено.' : searchParams.get('saved') === '1' ? 'Зміни збережено.' : undefined
  const [servings, setServings] = useState(planServings ?? 1)
  const [url, setUrl] = useState('')
  const [imageError, setImageError] = useState(false)
  const [actionError, setActionError] = useState('')
  const [savingToPlan, setSavingToPlan] = useState(false)
  const [showPermanentDelete, setShowPermanentDelete] = useState(false)
  const [showArchive, setShowArchive] = useState(false)

  const recipeQuery = useQuery({
    queryKey: queryKeys.recipe(userId, recipeId ?? 'missing'),
    queryFn: () => repository.get(recipeId!),
    staleTime: cacheTimes.catalogueStale,
    refetchOnWindowFocus: false,
    enabled: Boolean(recipeId),
  })
  const recipe = recipeQuery.data

  useEffect(() => {
    setImageError(false)
    setServings(planServings ?? 1)
    const nextUrl = recipe?.image?.url ?? (recipe?.image?.blob ? URL.createObjectURL(recipe.image.blob) : '')
    setUrl(nextUrl)
    return () => { if (nextUrl.startsWith('blob:')) URL.revokeObjectURL(nextUrl) }
  }, [planServings, recipe])

  if (recipeQuery.isPending) return <div className="loading-panel">Завантажуємо рецепт…</div>
  if (recipeQuery.isError || !recipe) return <div className="form-alert" role="alert">Не вдалося завантажити рецепт.<button type="button" className="button button-secondary" onClick={() => void recipeQuery.refetch()}>Повторити</button></div>

  const canManage = !recipe.isSystem || isAdmin
  const backHref = returnTo ?? (planContext ? `/recipes?${searchParams.toString()}` : '/recipes')
  const archive = async () => {
    setActionError('')
    try { await repository.archive(recipe.id); await invalidateRecipeData(queryClient, userId, recipe.id); navigate('/recipes') }
    catch (error: unknown) { setShowArchive(false); setActionError(errorMessage(error)) }
  }
  const removePermanently = async () => {
    if (!repository.remove) return
    setActionError('')
    try { await repository.remove(recipe.id); await invalidateRecipeData(queryClient, userId, recipe.id); navigate('/recipes') }
    catch (error: unknown) { setShowPermanentDelete(false); setActionError(errorMessage(error)) }
  }
  const addToPlan = async () => {
    if (!planContext) return
    setSavingToPlan(true)
    setActionError('')
    try {
      await mealPlan.upsert({ date: planContext.date, slot: planContext.slot, recipeId: recipe.id, servings })
      await invalidateMealPlanData(queryClient, userId)
      navigate(`/plan?date=${encodeURIComponent(planContext.date)}`)
    } catch (error: unknown) {
      setActionError(errorMessage(error))
      setSavingToPlan(false)
    }
  }

  return (
    <section className="page recipe-detail">
      <Link className="back-link" to={backHref}><ArrowLeft aria-hidden="true" /> {plannedView ? 'Назад до плану' : 'До рецептів'}</Link>
      {successMessage && <p className="toast-inline" role="status">{successMessage}</p>}
      <header className="page-header">
        <div>
          <p className="eyebrow">{plannedView ? 'Запланована страва' : `${recipe.isSystem ? 'Системний рецепт' : 'Ваш рецепт'} · Харчова цінність на 1 порцію`}</p>
          <h1>{recipe.name}</h1>
          <div className="recipe-category-badges">
            {recipe.classifications.length ? recipe.classifications.map((item) => <span key={`${item.mealType}:${item.subcategoryId}`}>{recipeMealTypes.find((type) => type.value === item.mealType)?.label}: {getRecipeSubcategory(item.subcategoryId)?.label}</span>) : <span>Без категорії</span>}
          </div>
          <p className="recipe-meta">{formatPreparationTime(recipe.preparationTimeMinMinutes, recipe.preparationTimeMaxMinutes) ? `${formatPreparationTime(recipe.preparationTimeMinMinutes, recipe.preparationTimeMaxMinutes)} приготування` : 'Час приготування не вказано'}</p>
        </div>
        {(canManage || planContext) && <div className="editor-actions">
          {planContext && <button className="button button-primary" disabled={savingToPlan || !Number.isInteger(servings) || servings < 1 || servings > 99} onClick={() => void addToPlan()}>{savingToPlan ? 'Зберігаємо…' : planContext.mode === 'replace' ? 'Замінити в плані' : 'Додати до плану'}</button>}
          {canManage && <>
            <Link className="button button-secondary" to={`/recipes/${recipe.id}/edit?returnTo=${encodeURIComponent(`${location.pathname}${location.search}`)}`}>Редагувати</Link>
            {!recipe.archivedAt && <button className="button button-danger-ghost" onClick={() => setShowArchive(true)}>Архівувати</button>}
            {isAdmin && <button className="button button-danger-ghost" onClick={() => setShowPermanentDelete(true)}>Видалити назавжди</button>}
          </>}
        </div>}
      </header>
      {actionError && <div className="form-alert" role="alert">{actionError}</div>}
      <div className="recipe-detail-grid">
        {url && !imageError ? <img className="recipe-hero" src={url} alt={`Фото страви ${recipe.name}`} onError={() => setImageError(true)} /> : <div className="recipe-image-placeholder recipe-hero" role="img" aria-label="Фото недоступне">Страва без фото</div>}
        <div>
          <label className="field">Порцій<input inputMode="numeric" min="1" value={servings} onChange={(event) => setServings(Number(event.target.value))} /></label>
          <p className="nutrition-summary">{recipe.caloriesPerServing ?? '—'} ккал · Б {recipe.proteinGramsPerServing ?? '—'} г · Ж {recipe.fatGramsPerServing ?? '—'} г · В {recipe.carbsGramsPerServing ?? '—'} г</p>
          <h2>Інгредієнти</h2>
          <ul className="ingredient-list">{recipe.ingredients.map((item) => <li key={item.id}><span>{item.productName}</span><strong>{formatQuantity(scaleIngredientQuantity(item.quantityBase, servings), item.productBaseUnit)}</strong></li>)}</ul>
          <h2>Спосіб приготування</h2>
          <p className="recipe-instructions">{recipe.instructions}</p>
        </div>
      </div>
      {showArchive && <ConfirmDialog title={`Архівувати «${recipe.name}»?`} description="Рецепт зникне з вибору нових страв, але залишиться читабельним у попередніх планах." confirmLabel="Архівувати рецепт" danger onCancel={() => setShowArchive(false)} onConfirm={() => void archive()} />}
      {showPermanentDelete && <PermanentDeleteDialog name={recipe.name} entityLabel="рецепт" onCancel={() => setShowPermanentDelete(false)} onConfirm={() => void removePermanently()} />}
    </section>
  )
}

function validDate(value: string | null): string | undefined { return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined }
function validMealSlot(value: string | null): MealSlot | undefined { return value && ['breakfast', 'lunch', 'dinner', 'snack'].includes(value) ? value as MealSlot : undefined }
function parseServings(value: string | null): number | undefined { const servings = Number(value); return Number.isInteger(servings) && servings >= 1 && servings <= 99 ? servings : undefined }
function safeReturnTo(value: string | null): string | undefined { return value?.startsWith('/') && !value.startsWith('//') ? value : undefined }
function errorMessage(error: unknown): string { return error instanceof Error ? error.message : 'Не вдалося виконати дію. Спробуйте ще раз.' }
