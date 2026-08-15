import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getRecipeSubcategory, recipeMealTypes, recipeSubcategories, type RecipeMealType } from '../domain/recipe-taxonomy'
import { useRecipeRepository } from '../repositories/useRecipeRepository'
import type { Recipe } from '../types'
import type { RecipePage } from '../repositories/recipe-repository'
import { formatPreparationTime } from '../domain/recipe'
import { useOptionalAuth } from '../../auth/useAuth'
import { Pagination } from '../../../shared/ui/Pagination'

type CatalogueSection = 'all' | 'uncategorized' | RecipeMealType
const PAGE_SIZE = 24

export function RecipesPage() {
  const repository = useRecipeRepository()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const section = parseSection(searchParams.get('section'))
  const subcategory = searchParams.get('subcategory') ?? ''
  const page = parsePage(searchParams.get('page'))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const isAdmin = useOptionalAuth()?.isAdmin ?? false
  const [showArchived, setShowArchived] = useState(false)
  const [pageInfo, setPageInfo] = useState<RecipePage>({ items: [], page: 1, pageSize: PAGE_SIZE, total: 0, hasNext: false })
  const serverPaginated = Boolean(repository.listPage)
  const updateUrl = (updates: { q?: string; section?: CatalogueSection; subcategory?: string; page?: number }, replace = true) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (updates.q !== undefined) setOrDelete(next, 'q', updates.q)
      if (updates.section !== undefined) {
        if (updates.section === 'all') next.delete('section')
        else next.set('section', updates.section)
      }
      if (updates.subcategory !== undefined) setOrDelete(next, 'subcategory', updates.subcategory)
      if (updates.page !== undefined) {
        if (updates.page > 1) next.set('page', String(updates.page))
        else next.delete('page')
      }
      return next
    }, { replace })
  }
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    const options = { page, pageSize: PAGE_SIZE, ...(section !== 'all' && section !== 'uncategorized' ? { mealType: section } : {}), ...(subcategory ? { subcategoryId: subcategory } : {}), ...(section === 'uncategorized' ? { uncategorized: true } : {}), ...(isAdmin && showArchived ? { includeArchived: true } : {}) }
    const request = repository.listPage ? repository.listPage(query, options) : repository.list(query).then((items) => ({ items, page: 1, pageSize: items.length || PAGE_SIZE, total: items.length, hasNext: false }))
    request.then((value) => { if (active) { setRecipes(value.items); setPageInfo(value) } }).catch(() => active && setError('Не вдалося завантажити рецепти. Оновіть сторінку та спробуйте ще раз.')).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [isAdmin, repository, query, page, section, subcategory, reloadKey, showArchived])
  useEffect(() => {
    if (!loading && pageInfo.total > 0) {
      const lastPage = Math.max(1, Math.ceil(pageInfo.total / PAGE_SIZE))
      if (page > lastPage) updateUrl({ page: lastPage })
    }
  }, [loading, page, pageInfo.total])
  const visible = useMemo(() => serverPaginated ? recipes : recipes.filter((recipe) => {
    if (section === 'uncategorized') return recipe.classifications.length === 0
    if (section === 'all') return true
    if (subcategory) return recipe.classifications.some((item) => item.mealType === section && item.subcategoryId === subcategory)
    return recipe.classifications.some((item) => item.mealType === section)
  }), [recipes, section, subcategory])
  const categories = section !== 'all' && section !== 'uncategorized' ? recipeSubcategories.filter((item) => item.mealType === section) : []
  const chooseSection = (value: CatalogueSection) => updateUrl({ section: value, subcategory: '', page: 1 })
  return <section className="page recipes-page"><header className="page-header"><div><p className="eyebrow">Страви та категорії</p><h1>Рецепти</h1><p className="page-intro">Зберігайте улюблені страви й знаходьте їх за прийомом їжі та тематичним розділом.</p></div><Link className="button button-primary" to="/recipes/new">+ Новий рецепт</Link></header>
    <div className="toolbar"><label className="search-field"><span className="sr-only">Пошук рецептів</span><input type="search" placeholder="Пошук рецептів…" value={query} onChange={(event) => updateUrl({ q: event.target.value, page: 1 })} /></label>{isAdmin && <label className="check-label"><input type="checkbox" checked={showArchived} onChange={(event) => { setShowArchived(event.target.checked); updateUrl({ page: 1 }) }} /> Показати архів</label>}</div>
    <div className="recipe-section-tabs" role="tablist" aria-label="Прийом їжі"><FilterButton active={section === 'all'} onClick={() => chooseSection('all')}>Усі</FilterButton>{recipeMealTypes.map((item) => <FilterButton key={item.value} active={section === item.value} onClick={() => chooseSection(item.value)}>{item.label}</FilterButton>)}<FilterButton active={section === 'uncategorized'} onClick={() => chooseSection('uncategorized')}>Без категорії</FilterButton></div>
    {!!categories.length && <div className="recipe-subcategory-filters" aria-label="Підкатегорії"><button type="button" className={!subcategory ? 'active' : ''} onClick={() => updateUrl({ subcategory: '', page: 1 })}>Усі підкатегорії</button>{categories.map((item) => <button type="button" key={item.subcategoryId} className={subcategory === item.subcategoryId ? 'active' : ''} onClick={() => updateUrl({ subcategory: item.subcategoryId, page: 1 })}>{item.label}</button>)}</div>}
    {loading ? <div className="loading-panel">Завантажуємо рецепти…</div> : error ? <div className="form-alert" role="alert">{error}<button type="button" className="button button-secondary" onClick={() => setReloadKey((value) => value + 1)}>Повторити</button></div> : visible.length ? <div className="recipe-grid">{visible.map((recipe) => <RecipeCard recipe={recipe} key={recipe.id} />)}</div> : <div className="empty-state"><div className="empty-illustration">🍲</div><p className="eyebrow">Ваша книга рецептів</p><h2>{query || section !== 'all' ? 'Нічого не знайдено' : 'Створіть перший рецепт'}</h2><p>{query || section !== 'all' ? 'Змініть пошук або категорію.' : 'Додайте фото, категорії, інгредієнти та спосіб приготування.'}</p><Link className="button button-primary" to="/recipes/new">Створити рецепт</Link></div>}
    {!loading && !error && serverPaginated && <Pagination page={pageInfo.page} pageSize={pageInfo.pageSize} total={pageInfo.total} hasNext={pageInfo.hasNext} onPageChange={(nextPage) => updateUrl({ page: nextPage }, false)} />}
  </section>
}

function parsePage(value: string | null) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function parseSection(value: string | null): CatalogueSection {
  if (value === 'uncategorized') return value
  const mealType = recipeMealTypes.find((item) => item.value === value)?.value
  if (mealType) return mealType
  return 'all'
}

function setOrDelete(params: URLSearchParams, key: string, value: string) {
  if (value) params.set(key, value)
  else params.delete(key)
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) { return <button type="button" role="tab" aria-selected={active} className={active ? 'active' : ''} onClick={onClick}>{children}</button> }

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [url, setUrl] = useState('')
  const [imageError, setImageError] = useState(false)
  useEffect(() => { const next = recipe.image.url ?? (recipe.image.blob ? URL.createObjectURL(recipe.image.blob) : ''); setUrl(next); return () => { if (next.startsWith('blob:')) URL.revokeObjectURL(next) } }, [recipe.image.blob, recipe.image.url])
  const labels = recipe.classifications.map((item) => getRecipeSubcategory(item.subcategoryId)?.label).filter(Boolean)
  return <Link className="recipe-card" to={`/recipes/${recipe.id}`}>{url && !imageError ? <img src={url} alt="" loading="lazy" decoding="async" onError={() => setImageError(true)} /> : <div className="recipe-image-placeholder" aria-label="Фото недоступне">🍲</div>}<div><p className="eyebrow">{formatPreparationTime(recipe.preparationTimeMinMinutes, recipe.preparationTimeMaxMinutes) ?? 'Час не вказано'}</p><h2>{recipe.name}</h2><p>{labels.length ? labels.slice(0, 2).join(' · ') : 'Без категорії'}</p></div></Link>
}
