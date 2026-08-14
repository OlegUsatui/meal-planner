import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { formatQuantity } from '../../../shared/formatting/format'
import { formatPreparationTime, scaleIngredientQuantity } from '../domain/recipe'
import { useRecipeRepository } from '../repositories/useRecipeRepository'
import type { Recipe } from '../types'
import { getRecipeSubcategory, recipeMealTypes } from '../domain/recipe-taxonomy'

export function RecipeDetailPage() {
  const { recipeId } = useParams(); const navigate = useNavigate(); const repository = useRecipeRepository(); const [recipe, setRecipe] = useState<Recipe>(); const [servings, setServings] = useState(2); const [url, setUrl] = useState(''); const [imageError, setImageError] = useState(false); const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading'); const [reloadKey, setReloadKey] = useState(0)
  useEffect(() => {
    let active = true
    setState('loading'); setRecipe(undefined); setImageError(false)
    if (!recipeId) { setState('error'); return () => { active = false } }
    void repository.get(recipeId).then((value) => { if (active) { setRecipe(value); setServings(1); setUrl(value.image.url ?? (value.image.blob ? URL.createObjectURL(value.image.blob) : '')); setState('ready') } }).catch(() => active && setState('error'))
    return () => { active = false }
  }, [recipeId, repository, reloadKey])
  useEffect(() => () => { if (url.startsWith('blob:')) URL.revokeObjectURL(url) }, [url])
  if (state === 'loading') return <div className="loading-panel">Завантажуємо рецепт…</div>
  if (state === 'error' || !recipe) return <div className="form-alert" role="alert">Не вдалося завантажити рецепт.<button type="button" className="button button-secondary" onClick={() => setReloadKey((value) => value + 1)}>Повторити</button></div>
  const archive = async () => { if (window.confirm(`Архівувати «${recipe.name}»?`)) { await repository.archive(recipe.id); navigate('/recipes') } }
  return <section className="page recipe-detail"><Link className="back-link" to="/recipes">← До рецептів</Link><header className="page-header"><div><p className="eyebrow">{recipe.isSystem ? 'Системний рецепт' : 'Ваш рецепт'} · Харчова цінність на 1 порцію</p><h1>{recipe.name}</h1><div className="recipe-category-badges">{recipe.classifications.length ? recipe.classifications.map((item) => <span key={`${item.mealType}:${item.subcategoryId}`}>{recipeMealTypes.find((type) => type.value === item.mealType)?.label}: {getRecipeSubcategory(item.subcategoryId)?.label}</span>) : <span>Без категорії</span>}</div><p className="recipe-meta">{formatPreparationTime(recipe.preparationTimeMinMinutes, recipe.preparationTimeMaxMinutes) ? `${formatPreparationTime(recipe.preparationTimeMinMinutes, recipe.preparationTimeMaxMinutes)} приготування` : 'Час приготування не вказано'}</p></div>{!recipe.isSystem && <div><Link className="button button-secondary" to={`/recipes/${recipe.id}/edit`}>Редагувати</Link><button className="button button-danger-ghost" onClick={() => void archive()}>Архівувати</button></div>}</header><div className="recipe-detail-grid">{url && !imageError ? <img className="recipe-hero" src={url} alt={`Фото страви ${recipe.name}`} onError={() => setImageError(true)} /> : <div className="recipe-image-placeholder recipe-hero" role="img" aria-label="Фото недоступне">🍲</div>}<div><label className="field">Порцій<input inputMode="numeric" min="1" value={servings} onChange={(e) => setServings(Number(e.target.value))} /></label><p className="nutrition-summary">{recipe.caloriesPerServing ?? '—'} ккал · Б {recipe.proteinGramsPerServing ?? '—'} г · Ж {recipe.fatGramsPerServing ?? '—'} г · В {recipe.carbsGramsPerServing ?? '—'} г</p><h2>Інгредієнти</h2><ul className="ingredient-list">{recipe.ingredients.map((item) => <li key={item.id}><span>{item.productName}</span><strong>{formatQuantity(scaleIngredientQuantity(item.quantityBase, servings), item.productBaseUnit)}</strong></li>)}</ul><h2>Спосіб приготування</h2><p className="recipe-instructions">{recipe.instructions}</p></div></div></section>
}
