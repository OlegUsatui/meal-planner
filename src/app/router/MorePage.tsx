import { Boxes, ChevronRight, LogOut, Settings, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { PageHeader } from '../../shared/ui/PageHeader'
import { Button } from '../../shared/ui/Button'

export function MorePage() {
  const { session, isAdmin, signOut } = useAuth()
  return <section className="page more-page"><PageHeader eyebrow="Ваш простір" title="Ще" description="Каталог продуктів, параметри застосунку та керування акаунтом." /><div className="more-account"><UserRound aria-hidden="true" /><div><strong>{session?.user.email}</strong>{isAdmin && <span className="badge">Адмін</span>}</div></div><nav className="more-links" aria-label="Додаткові розділи"><Link to="/products"><Boxes aria-hidden="true" /><span><strong>Продукти</strong><small>Каталог інгредієнтів</small></span><ChevronRight aria-hidden="true" /></Link><Link to="/settings"><Settings aria-hidden="true" /><span><strong>Налаштування</strong><small>Акаунт, формати й застосунок</small></span><ChevronRight aria-hidden="true" /></Link></nav><Button variant="secondary" className="more-sign-out" onClick={() => void signOut()}><LogOut aria-hidden="true" size={18} />Вийти з акаунта</Button></section>
}
