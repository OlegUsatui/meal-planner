import { useEffect, type ComponentType } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { BookOpen, Boxes, CalendarDays, House, LogOut, MoreHorizontal, Settings, ShoppingBasket, Sprout, type LucideProps } from 'lucide-react'
import { useOptionalAuth } from '../../features/auth/useAuth'
import { OnlineStatusBanner } from './OnlineStatusBanner'
import { ServiceWorkerUpdatePrompt } from './ServiceWorkerUpdatePrompt'

type NavigationItem = { to: string; label: string; icon: ComponentType<LucideProps>; end?: boolean }

const desktopNavigation: NavigationItem[] = [
  { to: '/', label: 'Сьогодні', icon: House, end: true },
  { to: '/plan', label: 'План', icon: CalendarDays },
  { to: '/recipes', label: 'Рецепти', icon: BookOpen },
  { to: '/products', label: 'Продукти', icon: Boxes },
  { to: '/shopping', label: 'Покупки', icon: ShoppingBasket },
]

const mobileNavigation: NavigationItem[] = [
  { to: '/', label: 'Сьогодні', icon: House, end: true },
  { to: '/plan', label: 'План', icon: CalendarDays },
  { to: '/recipes', label: 'Рецепти', icon: BookOpen },
  { to: '/shopping', label: 'Покупки', icon: ShoppingBasket },
  { to: '/more', label: 'Ще', icon: MoreHorizontal },
]

export function AppShell() {
  const auth = useOptionalAuth()
  const location = useLocation()

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>('main h1')
      if (heading) {
        heading.tabIndex = -1
        heading.focus({ preventScroll: true })
      } else document.querySelector<HTMLElement>('#main-content')?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [location.pathname])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Перейти до вмісту</a>
      <OnlineStatusBanner />
      <aside className="sidebar">
        <Brand />
        <nav className="side-navigation" aria-label="Основна навігація">
          {desktopNavigation.map((item) => <NavigationLink key={item.to} {...item} />)}
        </nav>
        <NavLink className="settings-link" to="/settings"><Settings aria-hidden="true" size={20} /><span>Налаштування</span></NavLink>
        {auth && <div className="account-note"><span>{auth.session?.user.email}</span>{auth.isAdmin && <span className="badge">Адмін</span>}<button type="button" className="text-button account-sign-out" onClick={() => void auth.signOut()}><LogOut aria-hidden="true" size={16} />Вийти</button></div>}
      </aside>

      <main id="main-content" className="main-content" tabIndex={-1}><Outlet /></main>

      <nav className="bottom-navigation" aria-label="Основна навігація">
        {mobileNavigation.map((item) => <NavigationLink key={item.to} {...item} />)}
      </nav>
      <ServiceWorkerUpdatePrompt />
    </div>
  )
}

function NavigationLink({ to, label, icon: Icon, end = false }: NavigationItem) {
  return (
    <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to={to} end={end}>
      <Icon className="nav-icon" aria-hidden="true" size={22} strokeWidth={1.9} /><span>{label}</span>
    </NavLink>
  )
}

function Brand() {
  return (
    <NavLink className="brand" to="/" aria-label="Meal Planner — головна">
      <span className="brand-mark" aria-hidden="true"><Sprout size={24} /></span>
      <span className="brand-copy"><strong>Meal</strong><span>planner</span></span>
    </NavLink>
  )
}
