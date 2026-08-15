import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/manrope'
import '@fontsource-variable/newsreader'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

let updateServiceWorker: (reloadPage?: boolean) => Promise<void>
updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent('meal-planner:update-ready', { detail: { update: () => updateServiceWorker(true) } }))
  },
})

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
