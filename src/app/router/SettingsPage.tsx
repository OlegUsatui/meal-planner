import { useAuth } from '../../features/auth/useAuth'

export function SettingsPage() {
  const { session, signOut } = useAuth()
  return <section className="page settings-page"><header className="page-header"><div><p className="eyebrow">Серверний акаунт</p><h1>Налаштування</h1><p>Рецепти, продукти та план зберігаються у вашому акаунті й доступні з інших пристроїв.</p></div></header><section className="settings-card"><p className="eyebrow">Акаунт</p><h2>{session?.user.email}</h2><p>Особисті рецепти й план доступні тільки вам. Системний каталог рецептів спільний для всіх користувачів.</p><button className="button button-secondary" type="button" onClick={() => void signOut()}>Вийти з акаунта</button></section><section className="settings-card"><p className="eyebrow">Фіксовані параметри</p><h2>Формати</h2><dl className="settings-list"><div><dt>Мова</dt><dd>Українська</dd></div><div><dt>Одиниці</dt><dd>Метричні</dd></div><div><dt>Валюта</dt><dd>NOK</dd></div></dl></section></section>
}
