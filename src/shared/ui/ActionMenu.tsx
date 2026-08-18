import { MoreHorizontal } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { IconButton } from './Button'

export interface ActionMenuItem {
  label: string
  onSelect: () => void
  danger?: boolean
  icon?: ReactNode
}

interface ActionMenuProps {
  label: string
  items: ActionMenuItem[]
  className?: string
  triggerClassName?: string
  menuClassName?: string
}

export function ActionMenu({ label, items, className = '', triggerClassName = '', menuClassName = '' }: ActionMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const closeOnPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', closeOnPointerDown)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnPointerDown)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return <div ref={rootRef} className={`action-menu ${className}`.trim()}>
    <IconButton className={triggerClassName} aria-label={label} aria-expanded={open} aria-haspopup="menu" onClick={(event) => { event.stopPropagation(); setOpen((value) => !value) }}><MoreHorizontal aria-hidden="true" /></IconButton>
    {open && <div className={`action-menu-list ${menuClassName}`.trim()} role="menu" aria-label={label}>{items.map((item) => <button type="button" className={item.danger ? 'danger' : undefined} key={item.label} onClick={() => { setOpen(false); item.onSelect() }}>{item.icon}{item.label}</button>)}</div>}
  </div>
}
