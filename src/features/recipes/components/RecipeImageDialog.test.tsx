import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RecipeImageDialog } from './RecipeImageDialog'

describe('RecipeImageDialog', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:recipe'), revokeObjectURL: vi.fn() })
  })

  it('shows the current 4:3 photo card and opens the crop editor for a replacement', async () => {
    render(<RecipeImageDialog
      image={{ url: '/dish.webp', mimeType: 'image/webp', width: 1200, height: 900, byteSize: 100 }}
      onApply={vi.fn()}
      onRemove={vi.fn()}
      onClose={vi.fn()}
    />)

    expect(screen.getByRole('img', { name: 'Поточне фото рецепту' })).toHaveClass('recipe-media-4x3')
    const replacement = new File(['photo'], 'replacement.jpg', { type: 'image/jpeg' })
    await userEvent.upload(screen.getByLabelText('Замінити фото'), replacement)

    expect(screen.getByRole('heading', { name: 'Налаштуйте кадр 4:3' })).toBeVisible()
  })

  it('opens the crop editor when an image is pasted from the clipboard', () => {
    render(<RecipeImageDialog image={null} onApply={vi.fn()} onRemove={vi.fn()} onClose={vi.fn()} />)
    const screenshot = new File(['screenshot'], 'screenshot.png', { type: 'image/png' })

    fireEvent.paste(screen.getByRole('dialog'), {
      clipboardData: {
        items: [{ kind: 'file', type: 'image/png', getAsFile: () => screenshot }],
      },
    })

    expect(screen.getByRole('heading', { name: 'Налаштуйте кадр 4:3' })).toBeVisible()
  })

  it('ignores pasted text and keeps the upload state unchanged', () => {
    render(<RecipeImageDialog image={null} onApply={vi.fn()} onRemove={vi.fn()} onClose={vi.fn()} />)

    fireEvent.paste(screen.getByRole('dialog'), {
      clipboardData: {
        items: [{ kind: 'string', type: 'text/plain', getAsFile: () => null }],
      },
    })

    expect(screen.getByRole('dialog', { name: 'Завантаження та редагування' })).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Налаштуйте кадр 4:3' })).not.toBeInTheDocument()
  })
})
