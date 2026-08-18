import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button, IconButton } from './Button'

describe('Button', () => {
  it('applies the shared variant and forwards native props', async () => {
    const onClick = vi.fn()
    render(<Button variant="danger" onClick={onClick}>Видалити</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Видалити' }))
    expect(onClick).toHaveBeenCalledOnce()
    expect(screen.getByRole('button')).toHaveClass('button', 'button-danger')
  })

  it('keeps icon-only actions accessible', () => {
    render(<IconButton aria-label="Закрити" danger>×</IconButton>)
    expect(screen.getByRole('button', { name: 'Закрити' })).toHaveClass('icon-button', 'danger')
  })

  it('supports low-emphasis ghost actions', () => {
    render(<Button variant="ghost">Скинути</Button>)
    expect(screen.getByRole('button', { name: 'Скинути' })).toHaveClass('button', 'button-ghost')
  })
})
