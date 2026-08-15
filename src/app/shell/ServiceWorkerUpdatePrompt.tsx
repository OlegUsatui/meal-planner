import { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'

export function ServiceWorkerUpdatePrompt() {
  const [available, setAvailable] = useState(false)
  const [update, setUpdate] = useState<(() => Promise<void>)>()

  useEffect(() => {
    const ready = (event: Event) => {
      const detail = (event as CustomEvent<{ update: () => Promise<void> }>).detail
      setUpdate(() => detail.update)
      setAvailable(true)
    }
    window.addEventListener('meal-planner:update-ready', ready)
    return () => window.removeEventListener('meal-planner:update-ready', ready)
  }, [])

  if (!available) return null
  return <aside className="update-toast" role="status" aria-label="Доступне оновлення"><div><strong>Meal Planner оновлено</strong><p>Завантажте нову версію без втрати даних.</p></div><button type="button" className="button button-primary" onClick={() => void update?.()}><RefreshCw aria-hidden="true" size={18} />Оновити</button><button type="button" className="icon-button" aria-label="Відкласти оновлення" onClick={() => setAvailable(false)}><X aria-hidden="true" /></button></aside>
}
