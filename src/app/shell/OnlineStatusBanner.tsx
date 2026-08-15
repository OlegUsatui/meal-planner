import { useEffect, useRef, useState } from 'react'
import { WifiOff } from 'lucide-react'

type ConnectionState = 'online' | 'offline' | 'restored'

export function OnlineStatusBanner() {
  const [state, setState] = useState<ConnectionState>(() => navigator.onLine ? 'online' : 'offline')
  const restoreTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const offline = () => { window.clearTimeout(restoreTimer.current); setState('offline') }
    const online = () => {
      setState('restored')
      window.clearTimeout(restoreTimer.current)
      restoreTimer.current = window.setTimeout(() => setState('online'), 3000)
    }
    window.addEventListener('offline', offline)
    window.addEventListener('online', online)
    return () => {
      window.clearTimeout(restoreTimer.current)
      window.removeEventListener('offline', offline)
      window.removeEventListener('online', online)
    }
  }, [])

  if (state === 'online') return null
  return <div className={`connection-banner ${state}`} role="status"><WifiOff aria-hidden="true" size={18} />{state === 'offline' ? 'Ви офлайн. Дані можна переглядати лише якщо вони вже завантажені.' : 'З’єднання відновлено.'}</div>
}
