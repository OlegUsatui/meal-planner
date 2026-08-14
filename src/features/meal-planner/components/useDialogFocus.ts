import { useEffect, type RefObject } from 'react'

const focusable = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useDialogFocus(ref: RefObject<HTMLElement | null>, onClose: () => void, returnFocus?: HTMLElement | null) {
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const previous = returnFocus ?? document.activeElement as HTMLElement | null
    const elements = () => Array.from(dialog.querySelectorAll<HTMLElement>(focusable))
    elements()[0]?.focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab') return
      const items = elements()
      if (!items.length) return
      const first = items[0]; const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', keydown)
    return () => { document.removeEventListener('keydown', keydown); previous?.focus() }
  }, [onClose, ref, returnFocus])
}
