import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Download, KeyRound, LogOut, Mail, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { strToU8, zipSync } from 'fflate'
import type { AccountExportManifestV1 } from '../../features/account/types'
import { useAuth } from '../../features/auth/useAuth'

export function SettingsPage() {
  const { session, signOut, updateEmail, updatePassword, reauthenticate } = useAuth()
  const [email, setEmail] = useState(session?.user.email ?? '')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [status, setStatus] = useState('')
  const [pending, setPending] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function submitEmail(event: FormEvent) { event.preventDefault(); setPending('email'); setStatus(''); try { await updateEmail(email); setStatus('Перевірте нову адресу — ми надіслали лист для підтвердження.') } catch { setStatus('Не вдалося змінити email.') } finally { setPending('') } }
  async function submitPassword(event: FormEvent) { event.preventDefault(); if (password.length < 8 || password !== passwordConfirmation) { setStatus('Паролі мають збігатися й містити щонайменше 8 символів.'); return }; setPending('password'); setStatus(''); try { await updatePassword(password); setPassword(''); setPasswordConfirmation(''); setStatus('Пароль змінено.') } catch { setStatus('Не вдалося змінити пароль.') } finally { setPending('') } }
  async function exportAccount() {
    if (!session) return
    setPending('export'); setStatus('')
    try {
      const response = await fetch('/api/account/export', { headers: { Authorization: `Bearer ${session.access_token}` } }); if (!response.ok) throw new Error('export')
      const { data: manifest } = await response.json() as { data: AccountExportManifestV1 }
      const files: Record<string, Uint8Array> = {}
      for (const image of manifest.images) { const imageResponse = await fetch(image.signedUrl); if (!imageResponse.ok) throw new Error('image'); files[image.fileName] = new Uint8Array(await imageResponse.arrayBuffer()) }
      const portable = { ...manifest, images: manifest.images.map(({ signedUrl: _signedUrl, ...image }) => image) }
      files['data.json'] = strToU8(JSON.stringify(portable, null, 2)); downloadBlob(new Blob([zipSync(files, { level: 6 })], { type: 'application/zip' }), `meal-planner-export-${manifest.exportedAt.slice(0, 10)}.zip`); setStatus('Експорт готовий.')
    } catch { setStatus('Не вдалося створити експорт. Перевірте з’єднання та повторіть.') }
    finally { setPending('') }
  }

  return <section className="page settings-page"><header className="page-header"><div><p className="eyebrow">Акаунт і застосунок</p><h1>Налаштування</h1><p>Керуйте входом, переносимістю даних і встановленим застосунком.</p></div></header>
    {status && <p className="settings-status" role="status">{status}</p>}
    <section className="settings-card"><p className="eyebrow">Профіль</p><h2>{session?.user.email}</h2><form className="settings-form" onSubmit={submitEmail}><label className="field"><Mail aria-hidden="true" /> Нова email-адреса<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><button className="button button-secondary" disabled={pending === 'email'}>{pending === 'email' ? 'Зберігаємо…' : 'Змінити email'}</button></form><form className="settings-form" onSubmit={submitPassword}><label className="field"><KeyRound aria-hidden="true" /> Новий пароль<input type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></label><label className="field">Повторіть пароль<input type="password" autoComplete="new-password" minLength={8} value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} /></label><button className="button button-secondary" disabled={pending === 'password'}>{pending === 'password' ? 'Зберігаємо…' : 'Змінити пароль'}</button></form><div className="settings-actions"><button className="button button-secondary" type="button" onClick={() => void signOut()}><LogOut aria-hidden="true" /> Вийти з акаунта</button></div></section>
    <section className="settings-card"><p className="eyebrow">Дані</p><h2>Експорт акаунта</h2><p>ZIP містить versioned <code>data.json</code> і ваші особисті фото. Системні записи не дублюються — їхні ID та назви зберігаються як посилання.</p><button type="button" className="button button-secondary" disabled={pending === 'export'} onClick={() => void exportAccount()}><Download aria-hidden="true" /> {pending === 'export' ? 'Готуємо ZIP…' : 'Завантажити ZIP'}</button></section>
    <section className="settings-card"><p className="eyebrow">Застосунок</p><h2>PWA та офлайн</h2><dl className="settings-list"><div><dt>Версія</dt><dd>{import.meta.env.VITE_APP_VERSION ?? 'development'}</dd></div><div><dt>З’єднання</dt><dd>{navigator.onLine ? 'Онлайн' : 'Офлайн'}</dd></div><div><dt>Мова й одиниці</dt><dd>Українська · метричні</dd></div></dl><div className="settings-actions"><Link className="button button-secondary" to="/welcome?info=1">Переглянути знайомство</Link></div></section>
    <section className="settings-card danger-zone"><ShieldAlert aria-hidden="true" /><p className="eyebrow">Небезпечна зона</p><h2>Видалення акаунта</h2><p>Особисті рецепти, продукти, плани й фото буде видалено без можливості відновлення. Системний каталог не зміниться.</p><button type="button" className="button button-danger" onClick={() => setDeleteOpen(true)}>Видалити акаунт</button></section>
    {deleteOpen && <DeleteAccountDialog reauthenticate={reauthenticate} signOut={signOut} onCancel={() => setDeleteOpen(false)} />}
  </section>
}

function DeleteAccountDialog({ reauthenticate, signOut, onCancel }: { reauthenticate: (password: string) => Promise<string>; signOut: () => Promise<void>; onCancel: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null); const [password, setPassword] = useState(''); const [phrase, setPhrase] = useState(''); const [pending, setPending] = useState(false); const [error, setError] = useState('')
  useEffect(() => { cancelRef.current?.focus() }, [])
  async function remove() { setPending(true); setError(''); try { const token = await reauthenticate(password); const response = await fetch('/api/account', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); if (!response.ok) throw new Error('delete'); await signOut() } catch { setError('Не вдалося видалити акаунт. Дані не позначено як видалені — повторіть дію.') } finally { setPending(false) } }
  return <div className="dialog-backdrop" role="presentation"><div className="confirm-dialog account-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-account-title"><p className="eyebrow">Незворотна дія</p><h2 id="delete-account-title">Видалити акаунт?</h2><p>Спочатку підтвердьте особу поточним паролем, потім введіть фразу <strong>ВИДАЛИТИ АКАУНТ</strong>.</p>{error && <p className="form-alert" role="alert">{error}</p>}<label className="field">Поточний пароль<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><label className="field">Підтвердження<input value={phrase} onChange={(event) => setPhrase(event.target.value)} /></label><div className="dialog-actions"><button ref={cancelRef} type="button" className="button button-secondary" disabled={pending} onClick={onCancel}>Скасувати</button><button type="button" className="button button-danger" disabled={pending || !password || phrase.trim() !== 'ВИДАЛИТИ АКАУНТ'} onClick={() => void remove()}>{pending ? 'Видаляємо…' : 'Видалити акаунт назавжди'}</button></div></div></div>
}

function downloadBlob(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url) }
