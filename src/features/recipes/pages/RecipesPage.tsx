import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRecipeSubcategory, recipeMealTypes, recipeSubcategories, type RecipeMealType } from '../domain/recipe-taxonomy'
import { useRecipeRepository } from '../repositories/useRecipeRepository'
import type { Recipe } from '../types'
import { formatPreparationTime } from '../domain/recipe'

type CatalogueSection = 'all' | 'uncategorized' | RecipeMealType

export function RecipesPage() {
  const repository = useRecipeRepository()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [query, setQuery] = useState('')
  const [section, setSection] = useState<CatalogueSection>('all')
  const [subcategory, setSubcategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  useEffect(() => { let active = true; setLoading(true); setError(''); repository.list(query).then((value) => active && setRecipes(value)).catch(() => active && setError('Не вдалося завантажити рецепти. Оновіть сторінку та спробуйте ще раз.')).finally(() => active && setLoading(false)); return () => { active = false } }, [repository, query, reloadKey])
  const visible = useMemo(() => recipes.filter((recipe) => {
    if (section === 'uncategorized') return recipe.classifications.length === 0
    if (section === 'all') return true
    if (subcategory) return recipe.classifications.some((item) => item.mealType === section && item.subcategoryId === subcategory)
    return recipe.classifications.some((item) => item.mealType === section)
  }), [recipes, section, subcategory])
  const categories = section !== 'all' && section !== 'uncategorized' ? recipeSubcategories.filter((item) => item.mealType === section) : []
  const chooseSection = (value: CatalogueSection) => { setSection(value); setSubcategory('') }
  return <section className="page recipes-page"><header className="page-header"><div><p className="eyebrow">Страви та категорії</p><h1>Рецепти</h1><p className="page-intro">Зберігайте улюблені страви й знаходьте їх за прийомом їжі та тематичним розділом.</p></div><Link className="button button-primary" to="/recipes/new">+ Новий рецепт</Link></header>
    <label className="search-field"><span className="sr-only">Пошук рецептів</span><input type="search" placeholder="Пошук рецептів…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
    <div className="recipe-section-tabs" role="tablist" aria-label="Прийом їжі"><FilterButton active={section === 'all'} onClick={() => chooseSection('all')}>Усі</FilterButton>{recipeMealTypes.map((item) => <FilterButton key={item.value} active={section === item.value} onClick={() => chooseSection(item.value)}>{item.label}</FilterButton>)}<FilterButton active={section === 'uncategorized'} onClick={() => chooseSection('uncategorized')}>Без категорії</FilterButton></div>
    {!!categories.length && <div className="recipe-subcategory-filters" aria-label="Підкатегорії"><button type="button" className={!subcategory ? 'active' : ''} onClick={() => setSubcategory('')}>Усі підкатегорії</button>{categories.map((item) => <button type="button" key={item.subcategoryId} className={subcategory === item.subcategoryId ? 'active' : ''} onClick={() => setSubcategory(item.subcategoryId)}>{item.label}</button>)}</div>}
    {loading ? <div className="loading-panel">Завантажуємо рецепти…</div> : error ? <div className="form-alert" role="alert">{error}<button type="button" className="button button-secondary" onClick={() => setReloadKey((value) => value + 1)}>Повторити</button></div> : visible.length ? <div className="recipe-grid">{visible.map((recipe) => <RecipeCard recipe={recipe} key={recipe.id} />)}</div> : <div className="empty-state"><div className="empty-illustration">🍲</div><p className="eyebrow">Ваша книга рецептів</p><h2>{query || section !== 'all' ? 'Нічого не знайдено' : 'Створіть перший рецепт'}</h2><p>{query || section !== 'all' ? 'Змініть пошук або категорію.' : 'Додайте фото, категорії, інгредієнти та спосіб приготування.'}</p><Link className="button button-primary" to="/recipes/new">Створити рецепт</Link></div>}
  </section>
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) { return <button type="button" role="tab" aria-selected={active} className={active ? 'active' : ''} onClick={onClick}>{children}</button> }

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [url, setUrl] = useState('')
  const [imageError, setImageError] = useState(false)
  useEffect(() => { const next = recipe.image.url ?? (recipe.image.blob ? URL.createObjectURL(recipe.image.blob) : ''); setUrl(next); return () => { if (next.startsWith('blob:')) URL.revokeObjectURL(next) } }, [recipe.image.blob, recipe.image.url])
  const labels = recipe.classifications.map((item) => getRecipeSubcategory(item.subcategoryId)?.label).filter(Boolean)
  return <Link className="recipe-card" to={`/recipes/${recipe.id}`}>{url && !imageError ? <img src={url} alt="" onError={() => setImageError(true)} /> : <div className="recipe-image-placeholder" aria-label="Фото недоступне">🍲</div>}<div><p className="eyebrow">{formatPreparationTime(recipe.preparationTimeMinMinutes, recipe.preparationTimeMaxMinutes) ?? 'Час не вказано'}</p><h2>{recipe.name}</h2><p>{labels.length ? labels.slice(0, 2).join(' · ') : 'Без категорії'}</p></div></Link>
}
