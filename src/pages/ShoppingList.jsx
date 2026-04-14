import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { api } from '../api/client'
import Header from '../components/Header'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import BottomSheet from '../components/BottomSheet'
import { ShoppingCart, Share2, Plus, Check, ArrowRight } from 'lucide-react'
import { formatSupermarketCategory, groupBySupermarketCategory } from '../utils/formatters'

const SECTION_ICONS = {
  gemuese_obst:  '🥦',
  milch_kuehl:   '🥛',
  fleisch_fisch: '🥩',
  dosen_glaeser: '🥫',
  backwaren:     '🍞',
  getraenke:     '🧃',
  tiefkuehl:     '🧊',
  gewuerze:      '🧂',
  sonstiges:     '📦',
}

export default function ShoppingList() {
  const { shoppingList, shoppingLoaded, dispatch, loadShopping } = useApp()
  const [sortMode, setSortMode] = useState('gang')
  const [addText, setAddText] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => { loadShopping() }, [])

  const unchecked = shoppingList.filter(i => !i.is_checked)
  const checked   = shoppingList.filter(i => i.is_checked)

  const handleCheck = async (item) => {
    const next = !item.is_checked
    dispatch({ type: 'UPDATE_SHOPPING_ITEM', payload: { id: item.id, is_checked: next ? 1 : 0 } })
    try {
      await api('shopping/check.php', {
        method: 'POST',
        body: JSON.stringify({ id: item.id, is_checked: next ? 1 : 0 }),
      })
    } catch {
      dispatch({ type: 'UPDATE_SHOPPING_ITEM', payload: { id: item.id, is_checked: item.is_checked } })
    }
  }

  const handleAdd = async () => {
    if (!addText.trim()) return
    try {
      const res = await api('shopping/add.php', {
        method: 'POST',
        body: JSON.stringify({ custom_name: addText.trim() }),
      })
      if (res.success) {
        dispatch({ type: 'ADD_SHOPPING_ITEM', payload: res.data })
        setAddText('')
      }
    } catch {}
  }

  const handleShare = () => {
    const lines = unchecked.map(i => {
      const name = i.ingredient_name || i.custom_name || ''
      const qty  = i.amount ? ` (${i.amount})` : ''
      return `- ${name}${qty}`
    }).join('\n')

    if (navigator.share) {
      navigator.share({ title: 'Einkaufsliste', text: lines })
    } else {
      navigator.clipboard.writeText(lines)
        .then(() => alert('Liste in Zwischenablage kopiert!'))
    }
  }

  const handleConfirmToPantry = async () => {
    setConfirming(true)
    try {
      const res = await api('shopping/to-pantry.php', { method: 'POST' })
      if (res.success) {
        // Reload pantry + shopping
        const [pantryRes, shopRes] = await Promise.all([
          api('pantry/list.php'),
          api('shopping/list.php'),
        ])
        if (pantryRes.success) dispatch({ type: 'SET_PANTRY', payload: pantryRes.data })
        if (shopRes.success)   dispatch({ type: 'SET_SHOPPING', payload: shopRes.data })
        setConfirmOpen(false)
      }
    } catch {}
    setConfirming(false)
  }

  const renderItem = (item) => (
    <div
      key={item.id}
      className="shopping-item"
      style={item.is_checked ? { opacity: 0.5 } : {}}
    >
      <div
        className={`shopping-checkbox ${item.is_checked ? 'checked' : ''}`}
        onClick={() => handleCheck(item)}
      >
        {item.is_checked && <Check size={14} color="white" strokeWidth={2.5} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span
            className="shopping-item-name"
            style={item.is_checked ? { textDecoration: 'line-through' } : {}}
          >
            {item.ingredient_name || item.custom_name}
          </span>
          {item.amount && (
            <span style={{ fontSize: 14, color: 'var(--color-on-surface-muted)' }}>
              ({item.amount})
            </span>
          )}
        </div>
        {item.recipe_names && (
          <div className="shopping-item-source">
            {item.recipe_names}
          </div>
        )}
      </div>
    </div>
  )

  const grouped = groupBySupermarketCategory(unchecked)

  return (
    <div>
      <Header
        title="Einkaufsliste"
        right={
          <button onClick={handleShare} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Share2 size={20} color="var(--color-on-surface-variant)" />
          </button>
        }
      />

      <div style={{ padding: '0 24px', paddingBottom: 140 }}>

        {/* Info line */}
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-on-surface-muted)', marginBottom: 16 }}>
          {unchecked.length} Artikel
          {checked.length > 0 ? ` · ${checked.length} erledigt` : ''}
        </p>

        {/* Sort toggle */}
        <div style={{ marginBottom: 24 }}>
          <div className="sort-toggle">
            <button className={`sort-btn ${sortMode === 'gang' ? 'active' : ''}`} onClick={() => setSortMode('gang')}>
              Nach Gang
            </button>
            <button className={`sort-btn ${sortMode === 'rezept' ? 'active' : ''}`} onClick={() => setSortMode('rezept')}>
              Nach Rezept
            </button>
          </div>
        </div>

        {!shoppingLoaded && <LoadingSpinner center />}

        {shoppingLoaded && shoppingList.length === 0 && (
          <EmptyState
            icon={<ShoppingCart />}
            title="Liste ist leer"
            text="Generiere eine Einkaufsliste aus dem Wochenplaner oder füge Artikel manuell hinzu."
          />
        )}

        {/* Items by category */}
        {sortMode === 'gang' && Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: 32 }}>
            <div className="section-header">
              <span style={{ fontSize: 15 }}>{SECTION_ICONS[cat] || '📦'}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-on-surface-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {formatSupermarketCategory(cat)}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {items.map(renderItem)}
            </div>
          </div>
        ))}

        {/* Items by recipe */}
        {sortMode === 'rezept' && (() => {
          const byRecipe = {}
          unchecked.forEach(item => {
            const key = item.recipe_names || 'Manuell hinzugefügt'
            if (!byRecipe[key]) byRecipe[key] = []
            byRecipe[key].push(item)
          })
          return Object.entries(byRecipe).map(([recipeName, items]) => (
            <div key={recipeName} style={{ marginBottom: 32 }}>
              <div className="section-header">
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-on-surface-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {recipeName}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {items.map(renderItem)}
              </div>
            </div>
          ))
        })()}

        {/* Checked items */}
        {checked.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div className="section-header">
              <Check size={14} color="var(--color-primary)" />
              <span className="section-header-label">ERLEDIGT</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {checked.map(renderItem)}
            </div>
          </div>
        )}

        {/* Add input */}
        <div
          style={{
            background: 'var(--color-surface-low)',
            borderRadius: 16,
            border: '2px dashed rgba(193,201,191,0.3)',
            padding: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Plus size={16} color="var(--color-on-surface-variant)" />
          <input
            style={{ flex: 1, background: 'transparent', fontSize: 14, color: 'var(--color-on-surface)', fontWeight: 500 }}
            placeholder="+ Artikel hinzufügen..."
            value={addText}
            onChange={e => setAddText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          {addText && (
            <button onClick={handleAdd} style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: 13 }}>
              OK
            </button>
          )}
        </div>
      </div>

      {/* Sticky bottom button */}
      {checked.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(var(--bottom-nav-height) + 16px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 48px)',
          maxWidth: 342,
          zIndex: 50,
        }}>
          <button
            className="btn"
            style={{
              width: '100%',
              background: 'var(--color-primary)',
              color: 'white',
              borderRadius: 16,
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-float)',
            }}
            onClick={() => setConfirmOpen(true)}
          >
            <span style={{ fontWeight: 600, fontSize: 16 }}>Einkauf fertig</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, opacity: 0.9 }}>in Vorrat übernehmen</span>
              <ArrowRight size={16} />
            </div>
          </button>
        </div>
      )}

      {/* Confirm to pantry sheet */}
      <BottomSheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Einkauf abschließen">
        <p style={{ fontSize: 15, color: 'var(--color-on-surface-variant)', marginBottom: 16, lineHeight: 1.6 }}>
          {checked.filter(i => i.ingredient_id).length} Lebensmittel werden in deinen Vorrat übernommen.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, maxHeight: 200, overflowY: 'auto' }}>
          {checked.filter(i => i.ingredient_id).map(i => (
            <div key={i.id} style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={14} color="var(--color-primary)" />
              {i.ingredient_name || i.custom_name}
            </div>
          ))}
        </div>
        <button
          className="btn btn-primary-solid"
          onClick={handleConfirmToPantry}
          disabled={confirming}
        >
          {confirming ? 'Übernehme...' : 'Bestätigen & in Vorrat übernehmen'}
        </button>
        <button
          style={{ width: '100%', marginTop: 12, padding: '12px', fontSize: 14, color: 'var(--color-on-surface-variant)', fontWeight: 500 }}
          onClick={() => setConfirmOpen(false)}
        >
          Abbrechen
        </button>
      </BottomSheet>
    </div>
  )
}
