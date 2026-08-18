import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { BackLink } from './BackLink'

describe('BackLink', () => {
  it('keeps the icon and label in one contextual navigation link', () => {
    render(<MemoryRouter><BackLink to="/plan">До плану</BackLink></MemoryRouter>)

    const link = screen.getByRole('link', { name: 'До плану' })
    expect(link).toHaveClass('back-link')
    expect(link).toHaveAttribute('href', '/plan')
    expect(link.querySelector('svg')).toBeInTheDocument()
  })
})
