import { useEffect, useRef, type ReactNode, type RefObject } from 'react'

const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

type DialogProps = {
  title: ReactNode
  eyebrow?: ReactNode
  children?: ReactNode
  actions?: ReactNode
  onClose: () => void
  className?: string
  backdropClassName?: string
  titleId?: string
  initialFocusRef?: RefObject<HTMLElement | null>
}

export function Dialog({ title, eyebrow, children, actions, onClose, className = '', backdropClassName = '', titleId = 'dialog-title', initialFocusRef }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    const getFocusable = () => [...(dialog?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])]
    ;(initialFocusRef?.current ?? getFocusable()[0])?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab') return
      const elements = getFocusable()
      if (!elements.length) return
      const first = elements[0]
      const last = elements.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => { document.removeEventListener('keydown', handleKeyDown); previous?.focus() }
  }, [initialFocusRef, onClose])

  return <div className={`dialog-backdrop ${backdropClassName}`.trim()} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div ref={dialogRef} className={`confirm-dialog ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 id={titleId}>{title}</h2>
      {children}
      {actions && <div className="dialog-actions">{actions}</div>}
    </div>
  </div>
}
