import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { RecipeForm } from '../components/RecipeForm'
import { useRecipeRepository } from '../repositories/useRecipeRepository'
import { useProductRepository } from '../../products/repositories/useProductRepository'
import type { Product } from '../../products/types'
import type { Recipe } from '../types'

export function RecipeEditorPage() {
  const { recipeId } = useParams(); const navigate = useNavigate(); const recipes = useRecipeRepository(); const productsRepo = useProductRepository(); const [products, setProducts] = useState<Product[]>([]); const [recipe, setRecipe] = useState<Recipe>(); const [error, setError] = useState<string>(); const editing = Boolean(recipeId)
  useEffect(() => { void productsRepo.list().then(setProducts); if (recipeId) void recipes.get(recipeId).then(setRecipe).catch(() => setError('Не вдалося знайти рецепт')) }, [productsRepo, recipeId, recipes])
  const save = async (input: Parameters<typeof recipes.create>[0] | Parameters<typeof recipes.update>[1]) => { if (recipeId) await recipes.update(recipeId, input); else await recipes.create(input as Parameters<typeof recipes.create>[0]); navigate('/recipes', { replace: true }) }
  if (editing && !recipe && !error) return <div className="loading-panel">Завантажуємо рецепт…</div>
  return <section className="page editor-page"><Link className="back-link" to="/recipes">← До рецептів</Link><header className="editor-header"><p className="eyebrow">{editing ? 'Редагування' : 'Нова страва'}</p><h1>{editing ? recipe?.name : 'Створити рецепт'}</h1></header>{products.length ? <RecipeForm products={products} recipe={recipe} onSubmit={save} error={error} /> : <div className="empty-state"><h2>Спершу додайте продукти</h2><Link className="button button-primary" to="/products">Відкрити продукти</Link></div>}</section>
}
