import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './useAuth'
import { PasswordField } from '../../shared/ui/PasswordField'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'

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
  return <main className="auth-page"><section className="auth-card"><p className="eyebrow">Відновлення доступу</p><h1>Новий пароль</h1>{!session ? <Alert variant="error">Посилання недійсне або завершилося. Запросіть новий лист на екрані входу.</Alert> : <form onSubmit={(event) => void submit(event)}>{error && <Alert variant="error">{error}</Alert>}{message && <Alert variant="success">{message}</Alert>}<PasswordField id="reset-password" label="Новий пароль" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /><PasswordField id="reset-password-confirmation" label="Повторіть новий пароль" autoComplete="new-password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /><Button type="submit" disabled={busy}>Зберегти новий пароль</Button></form>}<Link className="text-button auth-back-link" to="/">До застосунку</Link></section></main>
}
