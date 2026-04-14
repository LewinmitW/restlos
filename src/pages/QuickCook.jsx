import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../api/client'
import Header from '../components/Header'
import SearchInput from '../components/SearchInput'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { groupByMatch, calcMatchScore } from '../utils/matchScore'
import { Zap, Clock, ShoppingCart, CheckCircle } from 'lucide-react'

const FILTERS = [
  { value: 'alle',      label: 'ALLES' },
  { value: 'lt15',      label: '<15 MIN' },
  { value: 'lt30',      label: '<30 MIN' },
  { value: 'alles_da',  label: 'ALLES DA' },
  { value: '1_fehlt',   label: '1 FEHLT' },
]

export default function QuickCook() {
  const navigate = useNavigate()
  const { recipes, recipesLoaded, pantry, pantryLoaded, loadRecipes, loadPantry, dispatch } = useApp()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('alle')
  const [loading, setLoading] = useState(false)
  const [matchData, setMatchData] = useState({ allDa: [], fastAlles: [], mehr: [] })

  // Switch tab state lives in WeekPlanner — navigate back if user taps "Woche"
  const handleViewSwitch = (v) => {
    if (v === 'woche') navigate('/woche')
  }

  useEffect(() => {
    if (!recipesLoaded) loadRecipes()
    if (!pantryLoaded) loadPantry()
  }, [])

  useEffect(() => {
    if (recipesLoaded && pantryLoaded) {
      setMatchData(groupByMatch(recipes, pantry))
    }
  }, [recipes, pantry, recipesLoaded, pantryLoaded])

  const applyFilter = (items) => {
    return items.filter(({ recipe }) => {
      // Search filter
      if (search && !recipe.name.toLowerCase().includes(search.toLowerCase())) return false
      // Time filters
      if (filter === 'lt15' && (recipe.prep_time || 99) >= 15) return false
      if (filter === 'lt30' && (recipe.prep_time || 99) >= 30) return false
      return true
    })
  }

  const showAllDa   = filter !== '1_fehlt'
  const showFast    = filter !== 'alles_da' && filter !== 'lt15' && filter !== 'lt30' || filter === 'alle' || filter === '1_fehlt'
  const showMehr    = false // only show top 2 groups

  const filteredAllDa   = showAllDa  ? applyFilter(matchData.allDa) : []
  const filteredFast    = (filter === 'alle' || filter === 'lt15' || filter === 'lt30' || filter === '1_fehlt')
                            ? applyFilter(matchData.fastAlles) : []

  const addToList = async (e, ingredientId, name) => {
    e.stopPropagation()
    try {
      await api('shopping/add.php', {
        method: 'POST',
        body: JSON.stringify({ ingredient_id: ingredientId, custom_name: name }),
      })
      dispatch({
        type: 'ADD_SHOPPING_ITEM',
        payload: { id: Date.now(), ingredient_id: ingredientId, custom_name: name, is_checked: 0 },
      })
    } catch (err) {
      console.error(err)
    }
  }

  const isLoading = !recipesLoaded || !pantryLoaded

  return (
    <div>
      <Header />

      {/* Segmented Control */}
      <div style={{ padding: '0 24px 16px' }}>
        <div className="segmented">
          <button className="segmented-btn" onClick={() => navigate('/woche')}>
            🗓 Woche
          </button>
          <button className="segmented-btn active">
            🍳 Jetzt
          </button>
        </div>
      </div>

      <div style={{ padding: '0 24px', paddingBottom: 24 }}>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Zutat eingeben die du verwerten willst..."
          />
        </div>

        {/* Filter chips */}
        <div className="filter-row" style={{ margin: '0 -24px', padding: '0 24px', marginBottom: 24 }}>
          {FILTERS.map(f => (
            <button
              key={f.value}
              className={`chip-filter ${filter === f.value ? 'active' : 'inactive'}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading && <LoadingSpinner center />}

        {!isLoading && recipes.length === 0 && (
          <EmptyState
            icon={<Zap />}
            title="Noch keine Rezepte"
            text="Füge Rezepte hinzu um den Quick Cook zu nutzen."
            action={
              <button className="btn btn-primary" onClick={() => navigate('/rezept/neu')} style={{ width: 'auto', padding: '10px 20px' }}>
                + Rezept hinzufügen
              </button>
            }
          />
        )}

        {/* Alles da */}
        {filteredAllDa.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div className="section-header">
              <CheckCircle size={16} color="var(--color-primary)" />
              <h2 className="section-title">Alles da</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filteredAllDa.map(({ recipe }) => (
                <QuickCookCard key={recipe.id} recipe={recipe} missing={[]} onAddToList={addToList} />
              ))}
            </div>
          </div>
        )}

        {/* Fast alles da */}
        {filteredFast.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div className="section-header">
              <Clock size={16} color="var(--color-secondary)" />
              <h2 className="section-title">Fast alles da</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filteredFast.map(({ recipe, percent }) => {
                const { missing } = calcMatchScore(recipe, pantry)
                if (filter === '1_fehlt' && missing.length !== 1) return null
                return (
                  <QuickCookCard key={recipe.id} recipe={recipe} missing={missing} onAddToList={addToList} />
                )
              }).filter(Boolean)}
            </div>
          </div>
        )}

        {filteredAllDa.length === 0 && filteredFast.length === 0 && !isLoading && recipes.length > 0 && (
          <EmptyState
            icon={<Zap />}
            title="Keine passenden Rezepte"
            text="Versuche einen anderen Filter oder füge mehr Zutaten zum Vorrat hinzu."
          />
        )}
      </div>
    </div>
  )
}

function QuickCookCard({ recipe, missing, onAddToList }) {
  const navigate = useNavigate()
  const dots = Math.max(0, 3 - missing.length)

  return (
    <div
      className="card-sm"
      style={{ overflow: 'hidden', cursor: 'pointer' }}
      onClick={() => navigate(`/rezept/${recipe.id}`)}
    >
      <div style={{ display: 'flex' }}>
        {/* Image */}
        <div style={{ width: 114, flexShrink: 0, minHeight: 128, background: 'var(--color-surface-low)', position: 'relative', overflow: 'hidden' }}>
          {recipe.image_url ? (
            <img src={recipe.image_url} alt={recipe.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: '100%', height: '100%', minHeight: 128,
              background: 'linear-gradient(135deg, var(--color-primary-container), var(--color-surface-high))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
            }}>
              🍳
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-on-surface)' }}>
            {recipe.name}
          </h3>

          {/* Match dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="match-dots">
              {[0, 1, 2].map(i => (
                <div key={i} className={`match-dot ${i < dots ? 'match-dot-green' : missing.length === 1 && i === dots ? 'match-dot-orange' : 'match-dot-empty'}`} />
              ))}
            </div>
            <span style={{ fontSize: 12, fontWeight: 500 }} className={dots === 3 ? 'match-label-green' : 'match-label-orange'}>
              {dots === 3 ? 'Alles da' : `${missing.length} fehlt${missing.length > 1 ? 'en' : ''}`}
            </span>
            <span style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}>•</span>
            <span style={{ fontSize: 12, color: 'var(--color-on-surface-muted)' }}>{recipe.prep_time || '?'} min</span>
          </div>
        </div>
      </div>

      {/* Missing ingredients footer */}
      {missing.length > 0 && (
        <div
          style={{
            borderTop: '1px solid var(--color-surface-high)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 8, color: 'var(--color-tertiary)' }}>✕</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-tertiary)' }}>
              {missing.slice(0, 2).map(m => m.ingredient_name || m.name).join(', ')}
              {missing.length > 2 ? ` +${missing.length - 2}` : ''}
            </span>
          </div>
          <button
            style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.08em' }}
            onClick={e => {
              e.stopPropagation()
              missing.slice(0, 1).forEach(m => onAddToList(e, m.ingredient_id, m.ingredient_name || m.name))
            }}
          >
            + LISTE
          </button>
        </div>
      )}
    </div>
  )
}
