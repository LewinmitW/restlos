import { Search } from 'lucide-react'

export default function SearchInput({ value, onChange, placeholder = 'Suchen...', flat }) {
  return (
    <div className="search-input-wrap">
      <span className="search-icon">
        <Search size={18} />
      </span>
      <input
        type="text"
        className="search-input"
        style={flat ? { background: 'var(--color-surface-low)', boxShadow: 'none' } : {}}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}
