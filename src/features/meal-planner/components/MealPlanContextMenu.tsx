import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react'

export interface MealPlanContextMenuItem {
  label: string
  onSelect: () => void
  danger?: boolean
}

export function MealPlanContextMenu({ x, y, label, items, onClose }: { x: number; y: number; label: string; items: MealPlanContextMenuItem[]; onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const first = menuRef.current?.querySelector<HTMLButtonElement>('button')
    first?.focus()
    const closeOnPointerDown = (event: PointerEvent) => { if (!menuRef.current?.contains(event.target as Node)) onClose() }
    const closeOnEscape = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('pointerdown', closeOnPointerDown)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnPointerDown)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  const moveFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const buttons = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
    buttons[next]?.focus()
  }

  return <div ref={menuRef} className="meal-plan-context-menu" role="menu" aria-label={label} style={{ left: x, top: y }} onKeyDown={moveFocus} onContextMenu={(event) => event.preventDefault()}>
    {items.map((item) => <button key={item.label} type="button" role="menuitem" className={item.danger ? 'danger' : undefined} onClick={() => { onClose(); item.onSelect() }}>{item.label}</button>)}
  </div>
}
