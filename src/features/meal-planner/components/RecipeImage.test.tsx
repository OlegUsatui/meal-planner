import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RecipeImage } from './RecipeImage'

describe('RecipeImage', () => {
  it('uses the shared 4:3 recipe media contract in planner cards', () => {
    render(<RecipeImage url="/dish.webp" alt="Томатний суп" className="meal-card-image" />)

    expect(screen.getByRole('img', { name: 'Томатний суп' })).toHaveClass('meal-card-image', 'recipe-media-4x3')
  })

  it('renders the local food illustration when a recipe has no photo', () => {
    render(<RecipeImage alt="" className="meal-card-image" />)

    expect(document.querySelector('.food-illustration-meal')).toBeInTheDocument()
    expect(document.querySelector('.meal-card-image.recipe-media-4x3.image-placeholder')).toBeInTheDocument()
  })
})
