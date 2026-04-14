import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { api } from '../api/client'
import Header from '../components/Header'
import SearchInput from '../components/SearchInput'
import BottomSheet from '../components/BottomSheet'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { Plus, Package, Thermometer, Archive, Snowflake, Star, AlertTriangle } from 'lucide-react'
import { formatLocation } from '../utils/formatters'

const LOCATION_ICONS = {
  kuehlschrank: <Thermometer size={14} />,
  schrank:      <Archive size={14} />,
  tiefkuehl:    <Snowflake size={14} />,
  immer_da:     <Star size={14} />,
}

const LOCATIONS = [
  { value: 'kuehlschrank', label: 'Kühlschrank' },
  { value: 'schrank',      label: 'Vorratsschrank' },
  { value: 'tiefkuehl',   label: 'Tiefkühl' },
  { value: 'immer_da',    label: 'Immer da' },
]

const QUANTITIES = [
  { value: 'viel',  label: 'viel' },
  { value: 'wenig', label: 'wenig' },
  { value: 'rest',  label: 'rest' },
]

function QtyDots({ qty }) {
  const map = { viel: 3, wenig: 2, rest: 1 }
  const count = map[qty] || 0
  return (
    <div className="qty-dots">
      {[0, 1, 2].map(i => {
        let cls = 'qty-dot qty-dot-empty'
        if (i < count) cls = `qty-dot ${count === 1 ? 'qty-dot-warning' : 'qty-dot-filled'}`
        return <div key={i} className={cls} />
      })}
    </div>
  )
}

export default function Pantry() {
  const { pantry, pantryLoaded, dispatch, loadPantry } = useApp()
  const [search, setSearch] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Add form state
  const [addSearch, setAddSearch] = useState('')
  const [addSuggestions, setAddSuggestions] = useState([])
  const [selectedIngredient, setSelectedIngredient] = useState(null)
  const [addQty, setAddQty] = useState('viel')
  const [addLocation, setAddLocation] = useState('kuehlschrank')
  const [addLoading, setAddLoading] = useState(false)

  useEffect(() => { loadPantry() }, [])

  // Autocomplete
  const searchIngredients = useCallback(async (q) => {
    if (!q || q.length < 2) { setAddSuggestions([]); return }
    try {
      const res = await api(`ingredients/search.php?q=${encodeURIComponent(q)}`)
      if (res.success) setAddSuggestions(res.data)
    } catch {}
  }, [])

  useEffect(() => {
    const t = setTimeout(() => searchIngredients(addSearch), 300)
    return () => clearTimeout(t)
  }, [addSearch])

  const handleAddSubmit = async () => {
    if (!selectedIngredient && !addSearch) return
    setAddLoading(true)
    try {
      const res = await api('pantry/add.php', {
        method: 'POST',
        body: JSON.stringify({
          ingredient_id: selectedIngredient?.id || null,
          custom_name: selectedIngredient ? null : addSearch,
          quantity: addQty,
          location: addLocation,
        }),
      })
      if (res.success) {
        dispatch({ type: 'ADD_PANTRY_ITEM', payload: res.data })
        setSheetOpen(false)
        setAddSearch('')
        setSelectedIngredient(null)
      }
    } catch (e) { console.error(e) }
    setAddLoading(false)
  }

  const handleQtyTap = async (item) => {
    const cycle = { viel: 'wenig', wenig: 'rest', rest: null }
    const next = cycle[item.quantity]

    if (next === null) {
      // Remove
      try {
        await api('pantry/remove.php', { method: 'POST', body: JSON.stringify({ id: item.id }) })
        dispatch({ type: 'REMOVE_PANTRY_ITEM', payload: item.id })
      } catch {}
    } else {
      dispatch({ type: 'UPDATE_PANTRY_ITEM', payload: { id: item.id, quantity: next } })
      try {
        await api('pantry/update.php', { method: 'POST', body: JSON.stringify({ id: item.id, quantity: next }) })
      } catch {
        dispatch({ type: 'UPDATE_PANTRY_ITEM', payload: { id: item.id, quantity: item.quantity } })
      }
    }
  }

  // Filter & group
  const filtered = pantry.filter(item => {
    if (!search) return true
    const name = item.ingredient_name || item.custom_name || ''
    return name.toLowerCase().includes(search.toLowerCase())
  })

  const now = Date.now()
  const expiring = filtered.filter(item =>
    item.location !== 'immer_da' &&
    item.added_at &&
    (now - new Date(item.added_at).getTime()) > 4 * 24 * 60 * 60 * 1000
  )
  const fridge   = filtered.filter(i => i.location === 'kuehlschrank')
  const pantryS  = filtered.filter(i => i.location === 'schrank')
  const frozen   = filtered.filter(i => i.location === 'tiefkuehl')
  const alwaysThere = filtered.filter(i => i.location === 'immer_da')

  const renderSection = (title, items, icon, bgColor) => {
    if (items.length === 0) return null
    return (
      <div style={{ marginBottom: 32 }}>
        <div className="section-header">
          <span style={{ color: bgColor === 'warning' ? 'var(--color-secondary)' : 'var(--color-on-surface-variant)' }}>
            {icon}
          </span>
          <span
            className="section-header-label"
            style={bgColor === 'warning' ? { color: 'var(--color-secondary)' } : {}}
          >
            {title}
          </span>
        </div>
        <div
          style={{
            background: bgColor === 'warning'
              ? 'var(--color-surface-expiring)'
              : 'var(--color-surface-card)',
            borderRadius: 'var(--radius-md)',
            boxShadow: bgColor === 'warning' ? 'none' : 'var(--shadow-card-sm)',
            padding: '0 16px',
          }}
        >
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="pantry-item"
              style={{
                borderBottom: idx < items.length - 1 ? 'none' : 'none',
                paddingTop: idx === 0 ? 16 : 12,
                paddingBottom: idx === items.length - 1 ? 16 : 12,
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 500 }}>
                {item.ingredient_name || item.custom_name}
              </span>
              <button onClick={() => handleQtyTap(item)} style={{ cursor: 'pointer' }}>
                <QtyDots qty={item.quantity} />
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header
        right={
          <button className="btn-icon" onClick={() => setSheetOpen(true)}>
            <Plus size={16} color="white" />
          </button>
        }
      />

      <div style={{ padding: '0 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em' }}>Mein Vorrat</h1>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 24 }}>
          <SearchInput value={search} onChange={setSearch} flat />
        </div>

        {!pantryLoaded && <LoadingSpinner center />}

        {pantryLoaded && pantry.length === 0 && (
          <EmptyState
            icon={<Package />}
            title="Dein Vorrat ist leer"
            text="Füge Zutaten hinzu, damit die App weiß, was du daheim hast."
            action={
              <button className="btn btn-primary" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => setSheetOpen(true)}>
                + Zutat hinzufügen
              </button>
            }
          />
        )}

        {/* Expiring soon */}
        {expiring.length > 0 && renderSection('BALD VERWERTEN', expiring, <AlertTriangle size={14} />, 'warning')}

        {/* Location sections */}
        {renderSection('KÜHLSCHRANK', fridge, LOCATION_ICONS.kuehlschrank, 'normal')}
        {renderSection('VORRATSSCHRANK', pantryS, LOCATION_ICONS.schrank, 'normal')}
        {renderSection('TIEFKÜHL', frozen, LOCATION_ICONS.tiefkuehl, 'normal')}

        {/* Always there — as chips */}
        {alwaysThere.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div className="section-header">
              <Star size={14} color="var(--color-on-surface-variant)" />
              <span className="section-header-label">IMMER DA</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {alwaysThere.map(item => (
                <button
                  key={item.id}
                  className="chip-tag-pantry"
                  onClick={() => handleQtyTap(item)}
                >
                  {item.ingredient_name || item.custom_name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add ingredient sheet */}
      <BottomSheet open={sheetOpen} onClose={() => { setSheetOpen(false); setAddSearch(''); setSelectedIngredient(null) }} title="Zutat hinzufügen">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <SearchInput
              value={addSearch}
              onChange={v => { setAddSearch(v); setSelectedIngredient(null) }}
              placeholder="Zutat suchen..."
            />
            {addSuggestions.length > 0 && !selectedIngredient && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                borderRadius: 12,
                boxShadow: 'var(--shadow-float)',
                zIndex: 50,
                overflow: 'hidden',
                marginTop: 4,
              }}>
                {addSuggestions.slice(0, 6).map(s => (
                  <button
                    key={s.id}
                    style={{ width: '100%', padding: '12px 16px', textAlign: 'left', fontSize: 15, borderBottom: '1px solid var(--color-surface-low)' }}
                    onClick={() => { setSelectedIngredient(s); setAddSearch(s.name); setAddSuggestions([]) }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quantity */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>MENGE</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {QUANTITIES.map(q => (
                <button
                  key={q.value}
                  className={`chip ${addQty === q.value ? 'chip-active' : 'chip-inactive'}`}
                  onClick={() => setAddQty(q.value)}
                  style={{ flex: 1 }}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>ORT</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {LOCATIONS.map(l => (
                <button
                  key={l.value}
                  onClick={() => setAddLocation(l.value)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: addLocation === l.value ? 'var(--color-primary-container)' : 'var(--color-surface-low)',
                    color: addLocation === l.value ? 'var(--color-primary)' : 'var(--color-on-surface)',
                    fontWeight: addLocation === l.value ? 600 : 400,
                    textAlign: 'left',
                    fontSize: 15,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ color: addLocation === l.value ? 'var(--color-primary)' : 'var(--color-on-surface-variant)' }}>
                    {LOCATION_ICONS[l.value]}
                  </span>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary-solid"
            onClick={handleAddSubmit}
            disabled={addLoading || (!selectedIngredient && !addSearch)}
            style={{ marginTop: 8 }}
          >
            {addLoading ? 'Hinzufügen...' : 'Hinzufügen'}
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
