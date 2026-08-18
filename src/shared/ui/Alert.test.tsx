import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Alert } from './Alert'

describe('Alert', () => {
  it('uses assertive semantics for errors and renders title/content', () => {
    render(<Alert variant="error" title="Перевірте форму">Не вдалося зберегти</Alert>)
    expect(screen.getByRole('alert')).toHaveTextContent('Перевірте форму')
    expect(screen.getByRole('alert')).toHaveTextContent('Не вдалося зберегти')
  })

  it('uses a live status for successful feedback', () => {
    render(<Alert variant="success">Збережено</Alert>)
    expect(screen.getByRole('status')).toHaveTextContent('Збережено')
  })
})
