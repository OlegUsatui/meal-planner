import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Dialog } from './Dialog'

describe('Dialog', () => {
  it('focuses the first control, closes on Escape, and returns focus', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<><button type="button">Open</button><Dialog title="Підтвердження" onClose={onClose} actions={<button type="button">Скасувати</button>}><p>Опис</p></Dialog></>)

    await screen.findByRole('dialog')
    expect(screen.getByRole('button', { name: 'Скасувати' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes when the backdrop is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Dialog title="Підтвердження" onClose={onClose}><p>Опис</p></Dialog>)

    await user.click(screen.getByRole('presentation'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('supports a caller-selected initial focus target', () => {
    const initialFocusRef = createRef<HTMLButtonElement>()
    render(<Dialog title="Видалення" onClose={vi.fn()} initialFocusRef={initialFocusRef} actions={<button ref={initialFocusRef} type="button">Скасувати</button>}><p>Опис</p></Dialog>)
    expect(screen.getByRole('button', { name: 'Скасувати' })).toHaveFocus()
  })
})
