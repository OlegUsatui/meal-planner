import { Boxes, ChevronRight, LogOut, Settings, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'

export function MorePage() {
  const { session, isAdmin, signOut } = useAuth()
  return <section className="page more-page"><header className="page-header"><div><p className="eyebrow">Ваш простір</p><h1>Ще</h1><p className="page-intro">Каталог продуктів, параметри застосунку та керування акаунтом.</p></div></header><div className="more-account"><UserRound aria-hidden="true" /><div><strong>{session?.user.email}</strong>{isAdmin && <span className="badge">Адмін</span>}</div></div><nav className="more-links" aria-label="Додаткові розділи"><Link to="/products"><Boxes aria-hidden="true" /><span><strong>Продукти</strong><small>Каталог інгредієнтів</small></span><ChevronRight aria-hidden="true" /></Link><Link to="/settings"><Settings aria-hidden="true" /><span><strong>Налаштування</strong><small>Акаунт, формати й застосунок</small></span><ChevronRight aria-hidden="true" /></Link></nav><button type="button" className="button button-secondary more-sign-out" onClick={() => void signOut()}><LogOut aria-hidden="true" size={18} />Вийти з акаунта</button></section>
}
