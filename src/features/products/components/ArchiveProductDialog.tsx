import { useEffect, useRef, type KeyboardEvent } from 'react'
import type { Product } from '../types'

export function ArchiveProductDialog({ product, onCancel, onConfirm }: { product: Product; onCancel: () => void; onConfirm: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
      return
    }
    if (event.key !== 'Tab') return
    const buttons = [...(dialogRef.current?.querySelectorAll('button') ?? [])]
    if (!buttons.length) return
    const first = buttons[0]
    const last = buttons[buttons.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <div ref={dialogRef} className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="archive-title" onKeyDown={handleKeyDown}>
        <p className="eyebrow">Без видалення історії</p>
        <h2 id="archive-title">Архівувати «{product.name}»?</h2>
        <p>Продукт зникне з нових рецептів, але залишиться доступним у вже збережених рецептах.</p>
        <div className="archive-impact"><span>Рецептів: <strong>{product.recipeUsageCount}</strong></span></div>
        <div className="dialog-actions"><button ref={cancelRef} className="button button-secondary" onClick={onCancel}>Скасувати</button><button className="button button-danger" onClick={onConfirm}>Архівувати</button></div>
      </div>
    </div>
  )
}
