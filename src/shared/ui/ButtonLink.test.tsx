import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ButtonLink } from './ButtonLink'

describe('ButtonLink', () => {
  it('keeps link semantics while applying the shared action style', () => {
    render(<MemoryRouter><ButtonLink to="/plan" variant="secondary">Відкрити план</ButtonLink></MemoryRouter>)
    const link = screen.getByRole('link', { name: 'Відкрити план' })
    expect(link).toHaveAttribute('href', '/plan')
    expect(link).toHaveClass('button', 'button-secondary')
  })
})
