import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await login(email, password)
    setLoading(false)
    if (res.success) {
      navigate('/woche')
    } else {
      setError(res.error || 'Anmeldung fehlgeschlagen')
    }
  }

  return (
    <div className="auth-container">
      <div style={{ textAlign: 'center' }}>
        <div className="auth-logo">Restlos</div>
        <p className="auth-tagline">Dein persönlicher Kochplaner</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && (
          <div style={{
            background: 'var(--color-error-container)',
            color: 'var(--color-tertiary)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-base)',
            fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">E-Mail</label>
          <input
            type="email"
            className="form-input"
            placeholder="du@beispiel.at"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Passwort</label>
          <input
            type="password"
            className="form-input"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ marginTop: 8, height: 52, fontSize: 16 }}
        >
          {loading ? 'Anmelden...' : 'Anmelden'}
        </button>
      </form>

      <p className="auth-switch">
        Noch kein Konto?{' '}
        <Link to="/register">Registrieren</Link>
      </p>
    </div>
  )
}
