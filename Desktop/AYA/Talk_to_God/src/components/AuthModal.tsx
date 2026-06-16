import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

interface Props {
  onClose: () => void
}

type Mode = 'login' | 'register'

/** Fenêtre modale d'authentification (connexion / création de compte). */
export default function AuthModal({ onClose }: Props) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'login') await login(username, password)
      else await register(username, password, displayName)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}</h2>
        <p className="sub">
          {mode === 'login'
            ? 'سجّل الدخول لحفظ آياتك المفضلة'
            : 'أنشئ حسابك لحفظ المفضلة والسجل'}
        </p>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <input
              className="field"
              type="text"
              placeholder="الاسم المعروض"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="nickname"
            />
          )}
          <input
            className="field"
            type="text"
            placeholder="اسم المستخدم"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
          <input
            className="field"
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
          />

          {error && <p className="form-err">{error}</p>}

          <button type="submit" className="submit" disabled={busy}>
            {busy ? 'جارٍ المعالجة...' : mode === 'login' ? 'دخول' : 'إنشاء الحساب'}
          </button>
        </form>

        <button
          type="button"
          className="switch"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login')
            setError(null)
          }}
        >
          {mode === 'login' ? 'ليس لديك حساب؟ أنشئ حساباً' : 'لديك حساب بالفعل؟ سجّل الدخول'}
        </button>
      </div>
    </div>
  )
}
