import { NavLink, Outlet } from 'react-router-dom'
import { useOptionalAuth } from '../../features/auth/useAuth'

const navigation = [
  { to: '/', label: 'Головна', icon: '⌂', end: true },
  { to: '/plan', label: 'План', icon: '□' },
  { to: '/recipes', label: 'Рецепти', icon: '◉' },
  { to: '/products', label: 'Продукти', icon: '▤' },
  { to: '/shopping', label: 'Покупки', icon: '✓' },
]

export function AppShell() {
  const auth = useOptionalAuth()
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <nav className="side-navigation" aria-label="Основна навігація">
          {navigation.map((item) => <NavigationLink key={item.to} {...item} />)}
        </nav>
        <NavLink className="settings-link" to="/settings"><span aria-hidden="true">⚙</span><span>Налаштування</span></NavLink>
        {auth && <div className="account-note"><span>{auth.session?.user.email}</span><button type="button" className="text-button" onClick={() => void auth.signOut()}>Вийти</button></div>}
      </aside>

      <main className="main-content" tabIndex={-1}><Outlet /></main>

      <nav className="bottom-navigation" aria-label="Основна навігація">
        {navigation.map((item) => <NavigationLink key={item.to} {...item} />)}
      </nav>
    </div>
  )
}

function NavigationLink({ to, label, icon, end = false }: { to: string; label: string; icon: string; end?: boolean }) {
  return (
    <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to={to} end={end}>
      <span className="nav-icon" aria-hidden="true">{icon}</span><span>{label}</span>
    </NavLink>
  )
}

function Brand() {
  return (
    <NavLink className="brand" to="/" aria-label="Meal Planner — головна">
      <span className="brand-mark" aria-hidden="true"><span>●</span></span>
      <span className="brand-copy"><strong>Meal</strong><span>planner</span></span>
    </NavLink>
  )
}
