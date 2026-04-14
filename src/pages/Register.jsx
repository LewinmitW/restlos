import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwörter stimmen nicht überein')
      return
    }
    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen haben')
      return
    }
    setLoading(true)
    const res = await register(name, email, password)
    setLoading(false)
    if (res.success) {
      navigate('/woche')
    } else {
      setError(res.error || 'Registrierung fehlgeschlagen')
    }
  }

  return (
    <div className="auth-container">
      <div style={{ textAlign: 'center' }}>
        <div className="auth-logo">Restlos</div>
        <p className="auth-tagline">Konto erstellen</p>
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
          <label className="form-label">Name</label>
          <input
            type="text"
            className="form-input"
            placeholder="Dein Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>

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
            placeholder="Mindestens 6 Zeichen"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Passwort bestätigen</label>
          <input
            type="password"
            className="form-input"
            placeholder="••••••••"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ marginTop: 8, height: 52, fontSize: 16 }}
        >
          {loading ? 'Registrieren...' : 'Konto erstellen'}
        </button>
      </form>

      <p className="auth-switch">
        Bereits registriert?{' '}
        <Link to="/login">Anmelden</Link>
      </p>
    </div>
  )
}
