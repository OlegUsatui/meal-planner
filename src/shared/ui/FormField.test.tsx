import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormField } from './FormField'

describe('FormField', () => {
  it('connects labels, hints, and errors to the control', () => {
    render(<FormField id="name" label="Назва" required hint="До 80 символів" error="Введіть назву" control={<input />} />)

    const input = screen.getByRole('textbox', { name: /Назва/ })
    expect(input).toHaveAttribute('id', 'name')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input.getAttribute('aria-describedby')).toContain('name-hint')
    expect(input.getAttribute('aria-describedby')).toContain('name-error')
  })
})
