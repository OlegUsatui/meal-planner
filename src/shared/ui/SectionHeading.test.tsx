import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SectionHeading } from './SectionHeading'

describe('SectionHeading', () => {
  it('renders a labelled section heading and optional actions', () => {
    render(<SectionHeading eyebrow="Розклад" title="Страви на сьогодні" actions={<button>Редагувати</button>} />)

    expect(screen.getByRole('heading', { level: 2, name: 'Страви на сьогодні' })).toBeInTheDocument()
    expect(screen.getByText('Розклад')).toHaveClass('eyebrow')
    expect(screen.getByRole('button', { name: 'Редагувати' })).toBeInTheDocument()
  })
})
