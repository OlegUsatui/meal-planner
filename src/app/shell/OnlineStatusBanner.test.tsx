import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OnlineStatusBanner } from './OnlineStatusBanner'

describe('OnlineStatusBanner', () => {
  it('announces loss and restoration of connectivity', () => {
    render(<OnlineStatusBanner />)
    act(() => window.dispatchEvent(new Event('offline')))
    expect(screen.getByRole('status')).toHaveTextContent('Ви офлайн')
    act(() => window.dispatchEvent(new Event('online')))
    expect(screen.getByRole('status')).toHaveTextContent('З’єднання відновлено')
  })
})
