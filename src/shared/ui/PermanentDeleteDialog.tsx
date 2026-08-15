import { useEffect, useRef, type KeyboardEvent } from 'react'

export function PermanentDeleteDialog({
  name,
  entityLabel,
  onCancel,
  onConfirm,
}: {
  name: string
  entityLabel: string
  onCancel: () => void
  onConfirm: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => { cancelRef.current?.focus() }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); onCancel(); return }
    if (event.key !== 'Tab') return
    const buttons = [...(dialogRef.current?.querySelectorAll('button') ?? [])]
    if (!buttons.length) return
    const first = buttons[0]
    const last = buttons[buttons.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  return <div className="dialog-backdrop" role="presentation"><div ref={dialogRef} className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="permanent-delete-title" onKeyDown={handleKeyDown}>
    <p className="eyebrow">Небезпечна дія</p>
    <h2 id="permanent-delete-title">Видалити {entityLabel} «{name}» назавжди?</h2>
    <p>Цю дію неможливо скасувати. Якщо запис використовується, система заблокує видалення та покаже причину.</p>
    <div className="dialog-actions"><button ref={cancelRef} className="button button-secondary" onClick={onCancel}>Скасувати</button><button className="button button-danger" onClick={onConfirm}>Видалити назавжди</button></div>
  </div></div>
}
