import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Product } from '../../products/types'
import { RecipeForm } from './RecipeForm'

const product: Product = { id: 'rice', name: 'Рис', normalizedName: 'рис', category: 'Крупи та макарони', baseUnit: 'g', archivedAt: null, createdAt: 'now', updatedAt: 'now', recipeUsageCount: 0, isBaseUnitLocked: false }

describe('RecipeForm', () => {
  it('creates a valid recipe without requiring a photo and focuses the first invalid field', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<RecipeForm products={[product]} onSubmit={onSubmit} />)

    await userEvent.click(screen.getByRole('button', { name: 'Зберегти рецепт' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Вкажіть назву рецепту')
    expect(screen.getByLabelText(/Назва рецепту/)).toHaveFocus()

    await userEvent.type(screen.getByLabelText(/Назва рецепту/), 'Рисова миска')
    await userEvent.selectOptions(screen.getByLabelText('Продукт'), 'rice')
    await userEvent.type(screen.getByLabelText('Кількість'), '100')
    await userEvent.click(screen.getByRole('button', { name: 'Вечеря' }))
    await userEvent.click(screen.getByLabelText('Повноцінна тарілка'))
    await userEvent.type(screen.getByLabelText(/Спосіб приготування/), 'Змішати всі інгредієнти.')
    await userEvent.click(screen.getByRole('button', { name: 'Зберегти рецепт' }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ image: null, name: 'Рисова миска' }))
  })
})
