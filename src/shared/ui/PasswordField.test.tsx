import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PasswordField } from './PasswordField'

describe('PasswordField', () => {
  it('toggles password visibility with an accessible control', async () => {
    const user = userEvent.setup()
    render(<PasswordField label="Пароль" value="secret" onChange={vi.fn()} />)

    const input = screen.getByLabelText('Пароль')
    expect(input).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Показати пароль' }))
    expect(input).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Сховати пароль' })).toBeInTheDocument()
  })
})
