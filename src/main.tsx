import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/manrope'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

let updateServiceWorker: (reloadPage?: boolean) => Promise<void>
updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    if (window.confirm('Доступна нова версія Meal Planner. Оновити зараз?')) {
      void updateServiceWorker(true)
    }
  },
})

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
