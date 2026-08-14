import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { RecipeRepositoryProvider } from '../repositories/RecipeRepositoryContext'
import type { RecipeRepository } from '../repositories/recipe-repository'
import { RecipeDetailPage } from './RecipeDetailPage'

describe('RecipeDetailPage', () => {
  it('shows a retryable error when the recipe cannot be loaded', async () => {
    const repository: RecipeRepository = { list: vi.fn(), get: vi.fn().mockRejectedValue(new Error('network')), create: vi.fn(), update: vi.fn(), archive: vi.fn() }
    render(<MemoryRouter initialEntries={['/recipes/recipe-1']}><RecipeRepositoryProvider repository={repository}><Routes><Route path="/recipes/:recipeId" element={<RecipeDetailPage />} /></Routes></RecipeRepositoryProvider></MemoryRouter>)

    expect(await screen.findByRole('alert')).toHaveTextContent('Не вдалося завантажити рецепт')
    expect(screen.getByRole('button', { name: 'Повторити' })).toBeInTheDocument()
  })
})
