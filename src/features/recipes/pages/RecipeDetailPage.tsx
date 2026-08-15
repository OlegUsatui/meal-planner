import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { formatQuantity } from '../../../shared/formatting/format'
import { PermanentDeleteDialog } from '../../../shared/ui/PermanentDeleteDialog'
import { formatPreparationTime, scaleIngredientQuantity } from '../domain/recipe'
import { getRecipeSubcategory, recipeMealTypes } from '../domain/recipe-taxonomy'
import { useRecipeRepository } from '../repositories/useRecipeRepository'
import type { Recipe } from '../types'
import { useOptionalAuth } from '../../auth/useAuth'
import { useMealPlanRepository } from '../../meal-planner/repositories/useMealPlanRepository'
import type { MealSlot } from '../../meal-planner/domain/meal-plan'

export function RecipeDetailPage() {
  const { recipeId } = useParams()
  const navigate = useNavigate()
  const repository = useRecipeRepository()
  const mealPlan = useMealPlanRepository()
  const [searchParams] = useSearchParams()
  const auth = useOptionalAuth()
  const isAdmin = auth?.isAdmin ?? false
  const planDate = validDate(searchParams.get('planDate'))
  const planSlot = validMealSlot(searchParams.get('planSlot'))
  const planMode = searchParams.get('planMode') === 'replace' ? 'replace' : searchParams.get('planMode') === 'add' ? 'add' : undefined
  const planServings = parseServings(searchParams.get('planServings'))
  const planContext = planDate && planSlot && planMode ? { date: planDate, slot: planSlot, mode: planMode } : undefined
  const [recipe, setRecipe] = useState<Recipe>()
  const [servings, setServings] = useState(planServings ?? 1)
  const [url, setUrl] = useState('')
  const [imageError, setImageError] = useState(false)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [reloadKey, setReloadKey] = useState(0)
  const [actionError, setActionError] = useState('')
  const [savingToPlan, setSavingToPlan] = useState(false)
  const [showPermanentDelete, setShowPermanentDelete] = useState(false)

  useEffect(() => {
    let active = true
    setState('loading'); setRecipe(undefined); setImageError(false)
    if (!recipeId) { setState('error'); return () => { active = false } }
    void repository.get(recipeId).then((value) => { if (active) { setRecipe(value); setServings(planServings ?? 1); setUrl(value.image.url ?? (value.image.blob ? URL.createObjectURL(value.image.blob) : '')); setState('ready') } }).catch(() => active && setState('error'))
    return () => { active = false }
  }, [planServings, recipeId, repository, reloadKey])
  useEffect(() => () => { if (url.startsWith('blob:')) URL.revokeObjectURL(url) }, [url])
  if (state === 'loading') return <div className="loading-panel">Завантажуємо рецепт…</div>
  if (state === 'error' || !recipe) return <div className="form-alert" role="alert">Не вдалося завантажити рецепт.<button type="button" className="button button-secondary" onClick={() => setReloadKey((value) => value + 1)}>Повторити</button></div>

  const canManage = !recipe.isSystem || isAdmin
  const archive = async () => { if (!window.confirm(`Архівувати «${recipe.name}»?`)) return; setActionError(''); try { await repository.archive(recipe.id); navigate('/recipes') } catch (error: unknown) { setActionError(errorMessage(error)) } }
  const removePermanently = async () => { if (!repository.remove) return; setActionError(''); try { await repository.remove(recipe.id); navigate('/recipes') } catch (error: unknown) { setShowPermanentDelete(false); setActionError(errorMessage(error)) } }
  const addToPlan = async () => {
    if (!planContext) return
    setSavingToPlan(true); setActionError('')
    try { await mealPlan.upsert({ date: planContext.date, slot: planContext.slot, recipeId: recipe.id, servings }); navigate(`/plan?date=${encodeURIComponent(planContext.date)}`) } catch (error: unknown) { setActionError(errorMessage(error)); setSavingToPlan(false) }
  }
  const backHref = planContext ? `/recipes?${searchParams.toString()}` : '/recipes'
  return <section className="page recipe-detail"><Link className="back-link" to={backHref}>{planContext ? '← До вибору рецепту' : '← До рецептів'}</Link><header className="page-header"><div><p className="eyebrow">{planContext ? 'План харчування' : `${recipe.isSystem ? 'Системний рецепт' : 'Ваш рецепт'} · Харчова цінність на 1 порцію`}</p><h1>{recipe.name}</h1><div className="recipe-category-badges">{recipe.classifications.length ? recipe.classifications.map((item) => <span key={`${item.mealType}:${item.subcategoryId}`}>{recipeMealTypes.find((type) => type.value === item.mealType)?.label}: {getRecipeSubcategory(item.subcategoryId)?.label}</span>) : <span>Без категорії</span>}</div><p className="recipe-meta">{formatPreparationTime(recipe.preparationTimeMinMinutes, recipe.preparationTimeMaxMinutes) ? `${formatPreparationTime(recipe.preparationTimeMinMinutes, recipe.preparationTimeMaxMinutes)} приготування` : 'Час приготування не вказано'}</p></div>{(canManage || planContext) && <div className="editor-actions">{planContext && <button className="button button-primary" disabled={savingToPlan || !Number.isInteger(servings) || servings < 1 || servings > 99} onClick={() => void addToPlan()}>{savingToPlan ? 'Зберігаємо…' : planContext.mode === 'replace' ? 'Замінити в плані' : 'Додати до плану'}</button>}{canManage && <><Link className="button button-secondary" to={`/recipes/${recipe.id}/edit`}>Редагувати</Link>{!recipe.archivedAt && <button className="button button-danger-ghost" onClick={() => void archive()}>Архівувати</button>}{isAdmin && <button className="button button-danger-ghost" onClick={() => setShowPermanentDelete(true)}>Видалити назавжди</button>}</>}</div>}</header>{actionError && <div className="form-alert" role="alert">{actionError}</div>}<div className="recipe-detail-grid">{url && !imageError ? <img className="recipe-hero" src={url} alt={`Фото страви ${recipe.name}`} onError={() => setImageError(true)} /> : <div className="recipe-image-placeholder recipe-hero" role="img" aria-label="Фото недоступне">🍲</div>}<div><label className="field">Порцій<input inputMode="numeric" min="1" value={servings} onChange={(e) => setServings(Number(e.target.value))} /></label><p className="nutrition-summary">{recipe.caloriesPerServing ?? '—'} ккал · Б {recipe.proteinGramsPerServing ?? '—'} г · Ж {recipe.fatGramsPerServing ?? '—'} г · В {recipe.carbsGramsPerServing ?? '—'} г</p><h2>Інгредієнти</h2><ul className="ingredient-list">{recipe.ingredients.map((item) => <li key={item.id}><span>{item.productName}</span><strong>{formatQuantity(scaleIngredientQuantity(item.quantityBase, servings), item.productBaseUnit)}</strong></li>)}</ul><h2>Спосіб приготування</h2><p className="recipe-instructions">{recipe.instructions}</p></div></div>{showPermanentDelete && <PermanentDeleteDialog name={recipe.name} entityLabel="рецепт" onCancel={() => setShowPermanentDelete(false)} onConfirm={() => void removePermanently()} />}</section>
}

function validDate(value: string | null): string | undefined { return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined }
function validMealSlot(value: string | null): MealSlot | undefined { return value && ['breakfast', 'lunch', 'dinner', 'snack'].includes(value) ? value as MealSlot : undefined }
function parseServings(value: string | null): number | undefined { const servings = Number(value); return Number.isInteger(servings) && servings >= 1 && servings <= 99 ? servings : undefined }
function errorMessage(error: unknown): string { return error instanceof Error ? error.message : 'Не вдалося виконати дію. Спробуйте ще раз.' }
