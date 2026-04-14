import { useEffect } from 'react'

export default function BottomSheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        {title && (
          <h3 style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 600,
            color: 'var(--color-on-surface)',
            letterSpacing: '-0.025em',
            marginBottom: 'var(--space-6)',
          }}>
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  )
}
