import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RecipeClassificationField } from './RecipeClassificationField'

describe('RecipeClassificationField', () => {
  it('allows classifications from several meal types', async () => {
    const onChange = vi.fn()
    const { rerender } = render(<RecipeClassificationField value={[]} onChange={onChange} />)
    await userEvent.click(screen.getByLabelText('Сніданки з яєць'))
    expect(onChange).toHaveBeenLastCalledWith([{ mealType: 'breakfast', subcategoryId: 'breakfast-eggs' }])
    rerender(<RecipeClassificationField value={[{ mealType: 'breakfast', subcategoryId: 'breakfast-eggs' }]} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Обід' }))
    await userEvent.click(screen.getByLabelText('Салати-боули'))
    expect(onChange).toHaveBeenLastCalledWith([{ mealType: 'breakfast', subcategoryId: 'breakfast-eggs' }, { mealType: 'lunch', subcategoryId: 'lunch-salad-bowls' }])
  })
})
