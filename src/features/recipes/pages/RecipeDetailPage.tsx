import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Archive, Plus, Trash2 } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import { PermanentDeleteDialog } from '../../../shared/ui/PermanentDeleteDialog'
import { useOptionalAuth } from '../../auth/useAuth'
import type { MealSlot } from '../../meal-planner/domain/meal-plan'
import { useMealPlanRepository } from '../../meal-planner/repositories/useMealPlanRepository'
import { useRecipeRepository } from '../repositories/useRecipeRepository'
import { cacheTimes, queryKeys } from '../../../app/query/query-client'
import { invalidateMealPlanData, invalidateRecipeData } from '../../../app/query/invalidation'
import { useProductRepository } from '../../products/repositories/useProductRepository'
import { RecipeHeroBlock } from '../components/RecipeHeroBlock'
import { RecipeNutritionBlock } from '../components/RecipeNutritionBlock'
import { RecipeIngredientsBlock } from '../components/RecipeIngredientsBlock'
import { RecipeInstructionsBlock } from '../components/RecipeInstructionsBlock'
import { recipeInput, type RecipeBlockPatch, type RecipeEditBlock } from '../components/recipe-editing'
import { RetryBanner } from '../../../shared/ui/RetryBanner'
import { Alert } from '../../../shared/ui/Alert'
import { Button } from '../../../shared/ui/Button'
import { BackLink } from '../../../shared/ui/BackLink'

export function RecipeDetailPage() {
  const { recipeId } = useParams()
  const navigate = useNavigate()
  const repository = useRecipeRepository()
  const productsRepository = useProductRepository()
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
  const [actionError, setActionError] = useState('')
  const [savingToPlan, setSavingToPlan] = useState(false)
  const [showPermanentDelete, setShowPermanentDelete] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const [editingBlock, setEditingBlock] = useState<RecipeEditBlock>()

  const recipeQuery = useQuery({
    queryKey: queryKeys.recipe(userId, recipeId ?? 'missing'),
    queryFn: () => repository.get(recipeId!),
    staleTime: cacheTimes.catalogueStale,
    refetchOnWindowFocus: false,
    enabled: Boolean(recipeId),
  })
  const recipe = recipeQuery.data
  const productsQuery = useQuery({ queryKey: queryKeys.products(userId, { includeArchived: true }), queryFn: ({ signal }) => productsRepository.list({ includeArchived: true }, signal), staleTime: cacheTimes.catalogueStale, refetchOnWindowFocus: false, enabled: editingBlock === 'ingredients' })
  const saveBlock = async (patch: RecipeBlockPatch) => {
    if (!recipeId || !recipe) return
    const updated = await repository.update(recipeId, { ...recipeInput(recipe), ...patch })
    queryClient.setQueryData(queryKeys.recipe(userId, recipeId), updated)
    await invalidateRecipeData(queryClient, userId, recipeId)
    setEditingBlock(undefined)
  }

  if (recipeQuery.isPending) return <section className="page recipe-detail" aria-busy="true"><div className="recipe-detail-skeleton" role="status"><span className="sr-only">Завантажуємо рецепт…</span><div className="skeleton-block recipe-detail-skeleton-media" /><div className="recipe-detail-skeleton-copy"><div className="skeleton-block skeleton-eyebrow" /><div className="skeleton-block skeleton-title" /><div className="skeleton-block skeleton-line" /><div className="skeleton-block skeleton-line short" /></div></div></section>
  if (recipeQuery.isError || !recipe) return <RetryBanner hasData={false} staleMessage="Показуємо останній завантажений рецепт." errorMessage="Не вдалося завантажити рецепт." onRetry={() => void recipeQuery.refetch()} pending={recipeQuery.isFetching} />

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
  return (
    <section className={`page recipe-detail${planContext ? ' has-plan-context' : ''}`}>
      <div className="recipe-detail-topbar"><BackLink to={backHref}>{plannedView ? 'Назад до плану' : 'До рецептів'}</BackLink>{plannedView && <span className="recipe-context-pill">{planContext ? 'Додайте в план' : 'У плані'}</span>}</div>
      {successMessage && <p className="toast-inline" role="status">{successMessage}</p>}
      {actionError && <Alert variant="error">{actionError}</Alert>}
      <RecipeHeroBlock recipe={recipe} canManage={canManage} editing={editingBlock === 'hero'} blocked={Boolean(editingBlock && editingBlock !== 'hero')} planned={Boolean(plannedView)} onEdit={() => setEditingBlock('hero')} onCancel={() => setEditingBlock(undefined)} onSave={saveBlock} planAction={planContext && <div className="recipe-detail-plan-action"><Button disabled={savingToPlan || !Number.isInteger(servings) || servings < 1 || servings > 99} onClick={() => void addToPlan()}>{savingToPlan ? 'Зберігаємо…' : planContext.mode === 'replace' ? 'Замінити в плані' : 'Додати до плану'} <Plus aria-hidden="true" /></Button></div>} />
      {canManage && <div className="recipe-detail-manage-actions"><details className="recipe-detail-more"><summary className="button button-ghost">Інші дії</summary><div className="recipe-detail-more-menu">{!recipe.archivedAt && <button type="button" onClick={() => setShowArchive(true)}><Archive aria-hidden="true" /> Архівувати</button>}{isAdmin && <button type="button" className="danger" onClick={() => setShowPermanentDelete(true)}><Trash2 aria-hidden="true" /> Видалити назавжди</button>}</div></details></div>}
      <div className="recipe-detail-body"><RecipeNutritionBlock recipe={recipe} canManage={canManage} editing={editingBlock === 'nutrition'} blocked={Boolean(editingBlock && editingBlock !== 'nutrition')} onEdit={() => setEditingBlock('nutrition')} onCancel={() => setEditingBlock(undefined)} onSave={saveBlock} /><RecipeIngredientsBlock recipe={recipe} products={productsQuery.data ?? []} productsLoading={productsQuery.isPending} canManage={canManage} editing={editingBlock === 'ingredients'} blocked={Boolean(editingBlock && editingBlock !== 'ingredients')} onEdit={() => setEditingBlock('ingredients')} onCancel={() => setEditingBlock(undefined)} onSave={saveBlock} servings={servings} onAdjustServings={adjustServings} /><RecipeInstructionsBlock recipe={recipe} canManage={canManage} editing={editingBlock === 'instructions'} blocked={Boolean(editingBlock && editingBlock !== 'instructions')} onEdit={() => setEditingBlock('instructions')} onCancel={() => setEditingBlock(undefined)} onSave={saveBlock} /></div>
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
