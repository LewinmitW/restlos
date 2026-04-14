export default function EmptyState({ icon, title, text, action }) {
  return (
    <div className="empty-state">
      {icon && <div style={{ opacity: 0.4 }}>{icon}</div>}
      <div>
        <p className="empty-state-title">{title}</p>
        {text && <p className="empty-state-text" style={{ marginTop: 8 }}>{text}</p>}
      </div>
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}
