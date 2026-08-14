import { useState, type FormEvent } from 'react'
import { useAuth } from './useAuth'

export function AuthPage() {
  const { signIn, signUp, resetPassword, configurationError } = useAuth()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(undefined); setMessage(undefined)
    try {
      if (mode === 'sign-in') { await signIn(email, password); setMessage('Вхід виконано.') }
      else { await signUp(email, password); setMessage('Акаунт створено. Перевірте пошту для підтвердження.') }
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : 'Не вдалося виконати операцію.') }
    finally { setBusy(false) }
  }

  async function forgotPassword() {
    if (!email) { setError('Введіть email, щоб отримати посилання для відновлення.') ; return }
    setBusy(true); setError(undefined); setMessage(undefined)
    try { await resetPassword(email); setMessage('Посилання для відновлення надіслано на пошту.') }
    catch (reason: unknown) { setError(reason instanceof Error ? reason.message : 'Не вдалося надіслати лист.') }
    finally { setBusy(false) }
  }

  return <main className="auth-page"><section className="auth-card"><p className="eyebrow">Meal Planner</p><h1>{mode === 'sign-in' ? 'Увійти до акаунта' : 'Створити акаунт'}</h1><p className="page-intro">Ваші рецепти, план і продукти зберігатимуться на сервері та будуть доступні з будь-якого пристрою.</p>{configurationError && <div className="form-alert" role="alert">{configurationError}</div>}{(error || message) && <div className={error ? 'form-alert' : 'settings-status'} role={error ? 'alert' : 'status'}>{error ?? message}</div>}<form onSubmit={(event) => void submit(event)}><label className="field">Email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="field">Пароль<input type="password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="button button-primary" disabled={busy || Boolean(configurationError)}>{busy ? 'Зачекайте…' : mode === 'sign-in' ? 'Увійти' : 'Зареєструватися'}</button></form>{mode === 'sign-in' && <button className="text-button" type="button" onClick={() => void forgotPassword()} disabled={busy}>Забули пароль?</button>}<button className="text-button" type="button" onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setError(undefined); setMessage(undefined) }}>{mode === 'sign-in' ? 'Створити новий акаунт' : 'У мене вже є акаунт'}</button></section></main>
}
