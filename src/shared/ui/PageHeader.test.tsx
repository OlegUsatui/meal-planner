import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageHeader } from './PageHeader'

describe('PageHeader', () => {
  it('renders one consistent page heading with optional content and actions', () => {
    render(<PageHeader eyebrow="Каталог" title="Рецепти" description="Опис сторінки" actions={<button>Дія</button>} />)

    expect(screen.getByRole('banner')).toHaveClass('page-header')
    expect(screen.getByRole('heading', { level: 1, name: 'Рецепти' })).toBeInTheDocument()
    expect(screen.getByText('Каталог')).toHaveClass('eyebrow')
    expect(screen.getByText('Опис сторінки')).toHaveClass('page-intro')
    expect(screen.getByRole('button', { name: 'Дія' })).toBeInTheDocument()
  })
})
