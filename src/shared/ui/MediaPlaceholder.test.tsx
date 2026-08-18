import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MediaPlaceholder } from './MediaPlaceholder'

describe('MediaPlaceholder', () => {
  it('falls back to accessible placeholder content when an image fails', async () => {
    render(<MediaPlaceholder src="/missing.jpg" alt="Страва" fallback={<span>Soup</span>} fallbackLabel="Фото недоступне" />)
    const image = screen.getByRole('img', { name: 'Страва' })
    fireEvent.error(image)
    expect(screen.getByRole('img', { name: 'Фото недоступне' })).toHaveTextContent('Soup')
  })

  it('renders decorative fallback without an accessible name', () => {
    render(<MediaPlaceholder alt="" fallback={<span>Placeholder</span>} />)
    expect(screen.getByText('Placeholder').parentElement).toHaveAttribute('aria-hidden', 'true')
  })
})
