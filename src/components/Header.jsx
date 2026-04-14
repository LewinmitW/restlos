import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, LogOut } from 'lucide-react'
import { useState } from 'react'

export default function Header({ title, showBack, right }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="header">
      <div className="header-logo">
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5M5 12l7 7M5 12l7-7" />
            </svg>
          </button>
        ) : (
          <span
            className="header-logo-text"
            onClick={() => navigate('/woche')}
            style={{ cursor: 'pointer' }}
          >
            Restlos
          </span>
        )}
        {title && (
          <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-primary)', letterSpacing: '-0.03em' }}>
            {title}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {right}
        {user && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu(v => !v)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--color-surface-high)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <User size={16} color="var(--color-on-surface-variant)" />
            </button>
            {showMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 40,
                  background: 'white',
                  borderRadius: 12,
                  boxShadow: 'var(--shadow-float)',
                  padding: '8px 0',
                  minWidth: 180,
                  zIndex: 50,
                }}
              >
                <div style={{ padding: '8px 16px', fontSize: 14, color: 'var(--color-on-surface-variant)' }}>
                  {user.name || user.email}
                </div>
                <div style={{ height: 1, background: 'var(--color-surface-low)', margin: '4px 0' }} />
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14,
                    color: 'var(--color-tertiary)',
                    fontWeight: 500,
                  }}
                >
                  <LogOut size={14} />
                  Abmelden
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
