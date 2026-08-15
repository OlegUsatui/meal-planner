import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './useAuth'

export function ResetPasswordPage() {
  const { session, updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setMessage('')
    if (password.length < 8) { setError('Пароль має містити щонайменше 8 символів.'); return }
    if (password !== confirmation) { setError('Паролі не збігаються.'); return }
    setBusy(true)
    try { await updatePassword(password); setMessage('Пароль оновлено. Тепер можна повернутися до застосунку.') }
    catch { setError('Не вдалося оновити пароль. Запросіть нове посилання.') }
    finally { setBusy(false) }
  }
  return <main className="auth-page"><section className="auth-card"><p className="eyebrow">Відновлення доступу</p><h1>Новий пароль</h1>{!session ? <div className="form-alert" role="alert">Посилання недійсне або завершилося. Запросіть новий лист на екрані входу.</div> : <form onSubmit={(event) => void submit(event)}>{error && <div className="form-alert" role="alert">{error}</div>}{message && <div className="success-alert" role="status">{message}</div>}<label className="field">Новий пароль<input type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></label><label className="field">Повторіть новий пароль<input type="password" autoComplete="new-password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label><button className="button button-primary" disabled={busy}>Зберегти новий пароль</button></form>}<Link className="text-button auth-back-link" to="/">До застосунку</Link></section></main>
}
