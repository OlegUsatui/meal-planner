import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, CalendarDays, Check, ShoppingBasket, Sparkles } from 'lucide-react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { formatQuantity } from '../../shared/formatting/format'
import { RecipePickerDialog } from '../meal-planner/components/RecipePickerDialog'
import { mealSlots, scaleRecipeQuantity, type MealSlot } from '../meal-planner/domain/meal-plan'
import { useMealPlanRepository } from '../meal-planner/repositories/useMealPlanRepository'
import { useAuth } from '../auth/useAuth'
import { useRecipeRepository } from '../recipes/repositories/useRecipeRepository'
import type { Recipe } from '../recipes/types'
import { cacheTimes, queryKeys } from '../../app/query/query-client'
import { invalidateMealPlanData } from '../../app/query/invalidation'

const localToday = () => new Intl.DateTimeFormat('sv-SE').format(new Date())

export function OnboardingPage() {
  const { onboardingCompleted, completeOnboarding, session } = useAuth()
  const queryClient = useQueryClient()
  const userId = session?.user.id ?? 'session'
  const plan = useMealPlanRepository()
  const recipeRepository = useRecipeRepository()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const infoMode = searchParams.get('info') === '1'
  const returnTo = safeReturnTo(searchParams.get('returnTo'))
  const [step, setStep] = useState<'intro' | 'plan' | 'success'>('intro')
  const [date, setDate] = useState(localToday)
  const [slot, setSlot] = useState<MealSlot>('breakfast')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [planned, setPlanned] = useState<{ recipe: Recipe; servings: number }>()
  const [error, setError] = useState('')

  const recipesQuery = useQuery({
    queryKey: queryKeys.recipes(userId, { systemOnly: true }),
    queryFn: () => recipeRepository.list('', { systemOnly: true }),
    staleTime: cacheTimes.catalogueStale,
    refetchOnWindowFocus: false,
    enabled: !infoMode,
  })
  const recipes = recipesQuery.data ?? []

  const available = useMemo(() => recipes.filter((recipe) => recipe.classifications.length === 0 || recipe.classifications.some((item) => item.mealType === slot)), [recipes, slot])
  if (onboardingCompleted && !infoMode && step !== 'success') return <Navigate to={returnTo} replace />
  if (infoMode) return <InfoMode onClose={() => navigate('/settings')} />

  async function skip() {
    setError('')
    try { await completeOnboarding(); navigate(returnTo, { replace: true }) }
    catch (reason: unknown) { setError(actionError(reason, 'Не вдалося зберегти вибір. Перевірте з’єднання та спробуйте ще раз.')) }
  }
  async function save(recipeId: string, servings: number) {
    if (!recipes.some((item) => item.id === recipeId)) return
    setError('')
    try {
      const recipe = await queryClient.fetchQuery({ queryKey: queryKeys.recipe(userId, recipeId), queryFn: ({ signal }) => recipeRepository.get(recipeId, signal), staleTime: cacheTimes.catalogueStale })
      await plan.upsert({ date, slot, recipeId, servings })
      await invalidateMealPlanData(queryClient, userId)
      await completeOnboarding()
      setPlanned({ recipe, servings }); setPickerOpen(false); setStep('success')
    } catch (reason: unknown) { setError(actionError(reason, 'Не вдалося додати страву. Ваш вибір збережено на екрані — спробуйте ще раз.')) }
  }

  return <main className="onboarding-page">
    <div className="onboarding-brand"><Sparkles aria-hidden="true" /><span>Meal Planner</span></div>
    {step === 'intro' && <section className="onboarding-panel onboarding-intro" aria-labelledby="welcome-title">
      <p className="eyebrow">Ласкаво просимо</p><h1 id="welcome-title">Почнімо з однієї смачної страви</h1>
      <p className="onboarding-lead">Оберіть готовий рецепт, додайте його до плану — і ми одразу підготуємо список продуктів.</p>
      <div className="onboarding-benefits"><span><CalendarDays aria-hidden="true" /> План без зайвих кроків</span><span><ShoppingBasket aria-hidden="true" /> Автоматичний список покупок</span></div>
      {error && <p className="form-alert" role="alert">{error}</p>}
      <div className="onboarding-actions"><button type="button" className="button button-primary" onClick={() => setStep('plan')}>Запланувати першу страву <ArrowRight aria-hidden="true" /></button><button type="button" className="text-button" onClick={() => void skip()}>Пропустити поки що</button></div>
    </section>}
    {step === 'plan' && <section className="onboarding-panel" aria-labelledby="plan-first-title">
      <p className="eyebrow">Крок 1 із 1</p><h1 id="plan-first-title">Коли хочете поїсти?</h1><p className="onboarding-lead">Виберіть дату й прийом їжі. Рецепт та порції додасте в наступному вікні.</p>
      <div className="onboarding-fields"><label className="field">Дата<input type="date" min={localToday()} value={date} onChange={(event) => setDate(event.target.value)} /></label><label className="field">Прийом їжі<select value={slot} onChange={(event) => setSlot(event.target.value as MealSlot)}>{mealSlots.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label></div>
      {recipesQuery.isPending && <p role="status">Завантажуємо системні рецепти…</p>}
      {recipesQuery.isError && <p className="form-alert stale-banner" role="alert"><span>Не вдалося завантажити рецепти.</span><button type="button" className="button button-secondary" onClick={() => void recipesQuery.refetch()}>Повторити</button></p>}
      {recipesQuery.isSuccess && !available.length && <p className="form-alert" role="alert">Для цього прийому їжі поки немає доступних рецептів.</p>}
      {error && <p className="form-alert" role="alert">{error}</p>}
      <div className="onboarding-actions row"><button type="button" className="button button-secondary" onClick={() => setStep('intro')}>Назад</button><button type="button" className="button button-primary" disabled={!date || !available.length} onClick={() => setPickerOpen(true)}>Обрати рецепт</button></div>
    </section>}
    {step === 'success' && planned && <section className="onboarding-panel onboarding-success" aria-labelledby="success-title">
      <div className="success-mark"><Check aria-hidden="true" /></div><p className="eyebrow">Готово</p><h1 id="success-title">Перша страва у плані</h1><h2>{planned.recipe.name}</h2><p>{mealSlots.find((item) => item.value === slot)?.label} · {new Date(`${date}T12:00:00`).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })} · {planned.servings} порц.</p>
      <div className="shopping-preview"><h3>До списку покупок додано</h3><ul>{planned.recipe.ingredients.slice(0, 5).map((ingredient) => <li key={ingredient.id}><span>{ingredient.productName}</span><strong>{formatQuantity(scaleRecipeQuantity(ingredient.quantityBase, planned.servings), ingredient.productBaseUnit)}</strong></li>)}</ul></div>
      <button type="button" className="button button-primary" onClick={() => navigate(returnTo, { replace: true })}>Перейти до Сьогодні <ArrowRight aria-hidden="true" /></button>
    </section>}
    {pickerOpen && <RecipePickerDialog date={date} slot={slot} recipes={available} onClose={() => setPickerOpen(false)} onSave={save} />}
  </main>
}

function InfoMode({ onClose }: { onClose: () => void }) {
  return <main className="onboarding-page"><section className="onboarding-panel"><p className="eyebrow">Як це працює</p><h1>Ваш план за одну хвилину</h1><p className="onboarding-lead">Onboarding допомагає обрати системний рецепт і створити першу страву. Повторний перегляд не змінює ваш прогрес або план.</p><button type="button" className="button button-primary" onClick={onClose}>Повернутися до налаштувань</button></section></main>
}

function safeReturnTo(value: string | null): string {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/'
}

function actionError(reason: unknown, fallback: string): string {
  return reason instanceof Error && reason.message ? reason.message : fallback
}
