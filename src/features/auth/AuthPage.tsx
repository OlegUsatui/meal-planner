import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, Sprout } from 'lucide-react'
import { useAuth } from './useAuth'

export function AuthPage() {
  const { signIn, signUp, resendSignup, resetPassword, configurationError } = useAuth()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
  return <main className="auth-page"><section className="auth-card"><div className="auth-brand" aria-hidden="true"><Sprout /><span>Meal Planner</span></div><p className="eyebrow">Ваш тиждень, спланований легко</p><h1>{mode === 'sign-in' ? 'Раді бачити знову' : 'Створити акаунт'}</h1><p className="page-intro">Рецепти, план і продукти зберігаються у приватному серверному акаунті та доступні з ваших пристроїв.</p>{sessionExpired && <div className="form-alert" role="alert">Сесія завершилася з міркувань безпеки. Увійдіть ще раз — ми повернемо вас до попередньої сторінки.</div>}{configurationError && <div className="form-alert" role="alert">{configurationError}</div>}{(error || message) && <div className={error ? 'form-alert' : 'success-alert'} role={error ? 'alert' : 'status'}>{error ?? message}</div>}{signupComplete ? <div className="auth-success-actions"><button className="button button-secondary" type="button" disabled={busy} onClick={() => void resend()}>Надіслати лист ще раз</button><button className="text-button" type="button" onClick={toggleMode}>Повернутися до входу</button></div> : <><form onSubmit={(event) => void submit(event)}><label className="field">Email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><div className="field"><label htmlFor="auth-password">Пароль</label><span className="password-input"><input id="auth-password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button></span>{mode === 'sign-up' && <span className="field-hint">Щонайменше 8 символів.</span>}</div>{mode === 'sign-up' && <label className="field">Повторіть пароль<input type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>}<button className="button button-primary" disabled={busy || Boolean(configurationError)}>{busy ? 'Зачекайте…' : mode === 'sign-in' ? 'Увійти' : 'Зареєструватися'}</button></form>{mode === 'sign-in' && <button className="text-button" type="button" onClick={() => void forgotPassword()} disabled={busy}>Забули пароль?</button>}<button className="text-button" type="button" onClick={toggleMode}>{mode === 'sign-in' ? 'Створити новий акаунт' : 'У мене вже є акаунт'}</button></>}</section></main>
}

function authError(reason: unknown): string {
  const message = reason instanceof Error ? reason.message.toLocaleLowerCase() : ''
  if (message.includes('invalid login credentials')) return 'Неправильний email або пароль.'
  if (message.includes('already registered')) return 'Акаунт із таким email уже існує.'
  if (message.includes('rate limit')) return 'Забагато спроб. Зачекайте трохи й повторіть.'
  if (message.includes('password')) return 'Пароль не відповідає вимогам безпеки.'
  return 'Не вдалося виконати операцію. Перевірте з’єднання та спробуйте ще раз.'
}
