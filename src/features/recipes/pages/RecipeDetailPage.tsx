import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Archive, ArrowLeft, Clock3, Minus, Pencil, Plus, Soup, Trash2 } from 'lucide-react'
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

  if (recipeQuery.isPending) return <section className="page recipe-detail" aria-busy="true"><div className="recipe-detail-skeleton" role="status"><span className="sr-only">Завантажуємо рецепт…</span><div className="skeleton-block recipe-detail-skeleton-media" /><div className="recipe-detail-skeleton-copy"><div className="skeleton-block skeleton-eyebrow" /><div className="skeleton-block skeleton-title" /><div className="skeleton-block skeleton-line" /><div className="skeleton-block skeleton-line short" /></div></div></section>
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

  const adjustServings = (delta: number) => setServings((current) => Math.min(99, Math.max(1, current + delta)))
  const nutrition = [
    { label: 'Калорії', value: recipe.caloriesPerServing == null ? '—' : `${recipe.caloriesPerServing} ккал` },
    { label: 'Білки', value: recipe.proteinGramsPerServing == null ? '—' : `${recipe.proteinGramsPerServing} г` },
    { label: 'Жири', value: recipe.fatGramsPerServing == null ? '—' : `${recipe.fatGramsPerServing} г` },
    { label: 'Вуглеводи', value: recipe.carbsGramsPerServing == null ? '—' : `${recipe.carbsGramsPerServing} г` },
  ]

  return (
    <section className={`page recipe-detail${planContext ? ' has-plan-context' : ''}`}>
      <div className="recipe-detail-topbar"><Link className="back-link" to={backHref}><ArrowLeft aria-hidden="true" /> {plannedView ? 'Назад до плану' : 'До рецептів'}</Link>{plannedView && <span className="recipe-context-pill">{planContext ? 'Додайте в план' : 'У плані'}</span>}</div>
      {successMessage && <p className="toast-inline" role="status">{successMessage}</p>}
      {actionError && <div className="form-alert" role="alert">{actionError}</div>}
      <div className="recipe-detail-hero">
        <div className="recipe-detail-hero-media">{url && !imageError ? <img className="recipe-hero" src={url} alt={`Фото страви ${recipe.name}`} onError={() => setImageError(true)} /> : <div className="recipe-image-placeholder recipe-hero" role="img" aria-label="Фото недоступне"><Soup aria-hidden="true" /><span>Страва без фото</span></div>}</div>
        <div className="recipe-detail-hero-copy">
          <p className="eyebrow">{plannedView ? 'Запланована страва' : recipe.isSystem ? 'Системний рецепт' : 'Ваш рецепт'}</p>
          <h1>{recipe.name}</h1>
          <div className="recipe-category-badges">
            {recipe.classifications.length ? recipe.classifications.map((item) => <span key={`${item.mealType}:${item.subcategoryId}`}>{recipeMealTypes.find((type) => type.value === item.mealType)?.label}: {getRecipeSubcategory(item.subcategoryId)?.label}</span>) : <span>Без категорії</span>}
          </div>
          <div className="recipe-meta-row"><span><Clock3 aria-hidden="true" /> {formatPreparationTime(recipe.preparationTimeMinMinutes, recipe.preparationTimeMaxMinutes) ?? 'Час не вказано'}</span><span>На 1 порцію</span></div>
          {canManage && <div className="recipe-detail-manage-actions">
            <Link className="button button-secondary" to={`/recipes/${recipe.id}/edit?returnTo=${encodeURIComponent(`${location.pathname}${location.search}`)}`}><Pencil aria-hidden="true" /> Редагувати</Link>
            <details className="recipe-detail-more"><summary className="button button-ghost">Інші дії</summary><div className="recipe-detail-more-menu">{!recipe.archivedAt && <button type="button" onClick={() => setShowArchive(true)}><Archive aria-hidden="true" /> Архівувати</button>}{isAdmin && <button type="button" className="danger" onClick={() => setShowPermanentDelete(true)}><Trash2 aria-hidden="true" /> Видалити назавжди</button>}</div></details>
          </div>}
          {planContext && <div className="recipe-detail-plan-action"><button className="button button-primary" disabled={savingToPlan || !Number.isInteger(servings) || servings < 1 || servings > 99} onClick={() => void addToPlan()}>{savingToPlan ? 'Зберігаємо…' : planContext.mode === 'replace' ? 'Замінити в плані' : 'Додати до плану'} <Plus aria-hidden="true" /></button></div>}
        </div>
      </div>
      <div className="recipe-detail-body">
        <section className="recipe-detail-panel recipe-nutrition-panel" aria-labelledby="nutrition-title"><div className="section-heading"><div><p className="eyebrow">Харчова цінність</p><h2 id="nutrition-title">На одну порцію</h2></div><span className="recipe-detail-panel-note">Орієнтовно</span></div><div className="nutrition-cards">{nutrition.map((item) => <div className="nutrition-card" key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div></section>
        <section className="recipe-detail-panel recipe-ingredients-panel" aria-labelledby="ingredients-title"><div className="section-heading"><div><p className="eyebrow">Підготовка продуктів</p><h2 id="ingredients-title">Інгредієнти</h2></div><span className="recipe-detail-panel-note">{recipe.ingredients.length} {recipe.ingredients.length === 1 ? 'продукт' : 'продуктів'}</span></div><div className="recipe-servings-control"><span id="servings-label">Кількість порцій</span><div className="servings-stepper" role="group" aria-labelledby="servings-label"><button type="button" aria-label="Зменшити кількість порцій" disabled={servings <= 1} onClick={() => adjustServings(-1)}><Minus aria-hidden="true" /></button><input aria-label="Порцій" inputMode="numeric" min="1" max="99" value={servings} onChange={(event) => setServings(Number(event.target.value))} /><button type="button" aria-label="Збільшити кількість порцій" disabled={servings >= 99} onClick={() => adjustServings(1)}><Plus aria-hidden="true" /></button></div></div><ul className="ingredient-list">{recipe.ingredients.length ? recipe.ingredients.map((item) => <li key={item.id}><span>{item.productName}</span><strong>{formatQuantity(scaleIngredientQuantity(item.quantityBase, servings), item.productBaseUnit)}</strong></li>) : <li className="ingredient-list-empty">Інгредієнти ще не додані.</li>}</ul></section>
        <section className="recipe-detail-panel recipe-instructions-panel" aria-labelledby="instructions-title"><div className="section-heading"><div><p className="eyebrow">Крок за кроком</p><h2 id="instructions-title">Спосіб приготування</h2></div></div><p className="recipe-instructions">{recipe.instructions}</p></section>
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
