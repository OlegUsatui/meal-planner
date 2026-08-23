import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FoodIllustration } from './FoodIllustration'

describe('FoodIllustration', () => {
  it('renders a decorative food illustration without adding an accessible duplicate', () => {
    render(<FoodIllustration variant="breakfast" />)

    const illustration = document.querySelector('.food-illustration-breakfast')
    expect(illustration).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('supports an accessible label when it represents missing media', () => {
    render(<FoodIllustration variant="meal" label="Фото страви недоступне" />)

    expect(screen.getByRole('img', { name: 'Фото страви недоступне' })).toHaveClass('food-illustration-meal')
  })
})
