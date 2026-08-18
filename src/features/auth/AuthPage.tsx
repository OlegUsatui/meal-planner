import { useState, type FormEvent } from 'react'
import { Sprout } from 'lucide-react'
import { useAuth } from './useAuth'
import { FormField } from '../../shared/ui/FormField'
import { PasswordField } from '../../shared/ui/PasswordField'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'

export function AuthPage() {
  const { signIn, signUp, resendSignup, resetPassword, configurationError } = useAuth()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState<string>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [signupComplete, setSignupComplete] = useState(false)
  const [sessionExpired] = useState(() => {
    const expired = sessionStorage.getItem('meal-planner:session-expired') === '1'
    if (expired) sessionStorage.removeItem('meal-planner:session-expired')
    return expired
  })

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(undefined); setMessage(undefined)
    if (mode === 'sign-up' && password !== confirmation) { setError('Паролі не збігаються. Перевірте повторне введення.'); return }
    setBusy(true)
    try {
      if (mode === 'sign-in') await signIn(email.trim(), password)
      else { await signUp(email.trim(), password); setSignupComplete(true); setMessage('Перевірте пошту й підтвердьте створення акаунта.') }
    } catch (reason: unknown) { setError(authError(reason)) }
    finally { setBusy(false) }
  }

  async function forgotPassword() {
    if (!email.trim()) { setError('Введіть email, щоб отримати посилання для відновлення.'); return }
    setBusy(true); setError(undefined); setMessage(undefined)
    try { await resetPassword(email.trim()); setMessage('Посилання для відновлення надіслано на пошту.') }
    catch (reason: unknown) { setError(authError(reason)) }
    finally { setBusy(false) }
  }

  async function resend() {
    setBusy(true); setError(undefined)
    try { await resendSignup(email.trim()); setMessage('Новий лист підтвердження надіслано.') }
    catch (reason: unknown) { setError(authError(reason)) }
    finally { setBusy(false) }
  }

  const toggleMode = () => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setError(undefined); setMessage(undefined); setSignupComplete(false); setConfirmation('') }
  return <main className="auth-page"><section className="auth-card"><div className="auth-brand" aria-hidden="true"><Sprout /><span>Meal Planner</span></div><p className="eyebrow">Ваш тиждень, спланований легко</p><h1>{mode === 'sign-in' ? 'Раді бачити знову' : 'Створити акаунт'}</h1><p className="page-intro">Рецепти, план і продукти зберігаються у приватному серверному акаунті та доступні з ваших пристроїв.</p>{sessionExpired && <Alert variant="error">Сесія завершилася з міркувань безпеки. Увійдіть ще раз — ми повернемо вас до попередньої сторінки.</Alert>}{configurationError && <Alert variant="error">{configurationError}</Alert>}{(error || message) && <Alert variant={error ? 'error' : 'success'}>{error ?? message}</Alert>}{signupComplete ? <div className="auth-success-actions"><Button variant="secondary" type="button" disabled={busy} onClick={() => void resend()}>Надіслати лист ще раз</Button><button className="text-button" type="button" onClick={toggleMode}>Повернутися до входу</button></div> : <><form onSubmit={(event) => void submit(event)}><FormField id="auth-email" label="Email" required control={<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />} /><PasswordField id="auth-password" label="Пароль" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} hint={mode === 'sign-up' ? 'Щонайменше 8 символів.' : undefined} />{mode === 'sign-up' && <PasswordField id="auth-password-confirmation" label="Повторіть пароль" autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />}<Button type="submit" disabled={busy || Boolean(configurationError)}>{busy ? 'Зачекайте…' : mode === 'sign-in' ? 'Увійти' : 'Зареєструватися'}</Button></form>{mode === 'sign-in' && <button className="text-button" type="button" onClick={() => void forgotPassword()} disabled={busy}>Забули пароль?</button>}<button className="text-button" type="button" onClick={toggleMode}>{mode === 'sign-in' ? 'Створити новий акаунт' : 'У мене вже є акаунт'}</button></>}</section></main>
}

function authError(reason: unknown): string {
  const message = reason instanceof Error ? reason.message.toLocaleLowerCase() : ''
  if (message.includes('invalid login credentials')) return 'Неправильний email або пароль.'
  if (message.includes('already registered')) return 'Акаунт із таким email уже існує.'
  if (message.includes('rate limit')) return 'Забагато спроб. Зачекайте трохи й повторіть.'
  if (message.includes('password')) return 'Пароль не відповідає вимогам безпеки.'
  return 'Не вдалося виконати операцію. Перевірте з’єднання та спробуйте ще раз.'
}
