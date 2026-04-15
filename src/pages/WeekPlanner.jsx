import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../api/client'
import Header from '../components/Header'
import Stepper from '../components/Stepper'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { ShoppingCart, Info } from 'lucide-react'

const MEAL_PREF_OPTIONS = [
  { value: 'kalt',      label: 'Kalt' },
  { value: 'warm',      label: 'Aufwärmen ok' },
  { value: 'egal',      label: 'Egal' },
]

const PRIORITY_OPTIONS = [
  { value: 'wenig_einkaufen', label: 'Wenig einkaufen' },
  { value: 'abwechslung',     label: 'Abwechslung' },
  { value: 'schnell',         label: 'Schnell kochen' },
]

const DAY_LABELS = { mo: 'Mo', di: 'Di', mi: 'Mi', do: 'Do', fr: 'Fr', sa: 'Sa', so: 'So' }

export default function WeekPlanner() {
  const navigate = useNavigate()
  const { weekPlan, weekPlanLoaded, dispatch, loadWeekPlan } = useApp()

  const [view, setView] = useState('woche') // 'woche' | 'jetzt'
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  // Setup state
  const [homeMeals, setHomeMeals] = useState(5)
  const [prepMeals, setPrepMeals] = useState(4)
  const [mealPref, setMealPref] = useState('kalt')
  const [priority, setPriority] = useState('wenig_einkaufen')

  useEffect(() => {
    loadWeekPlan()
  }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      const res = await api('planner/generate.php', {
        method: 'POST',
        body: JSON.stringify({
          meals_total: homeMeals + prepMeals,
          meals_prep: prepMeals,
          prefer_cold: mealPref === 'kalt' ? 1 : 0,
          priority,
        }),
      })
      if (res.success) {
        dispatch({ type: 'SET_WEEK_PLAN', payload: res.data })
      } else {
        setError(res.error || 'Fehler beim Generieren')
      }
    } catch (e) {
      setError('Verbindungsfehler. Backend erreichbar?')
    }
    setGenerating(false)
  }

  const handleCreateShoppingList = async () => {
    try {
      const res = await api('shopping/list.php', { method: 'GET' })
      // Invalidate shopping list cache
      dispatch({ type: 'SET_SHOPPING', payload: res.data || [] })
      navigate('/liste')
    } catch {
      navigate('/liste')
    }
  }

  const handleEditPlan = () => {
    dispatch({ type: 'SET_WEEK_PLAN', payload: null })
  }

  // Group slots by type
  const prepRecipes  = weekPlan?.slots?.filter(s => s.slot_type === 'prep')   || []
  const freshRecipes = weekPlan?.slots?.filter(s => s.slot_type === 'frisch') || []

  return (
    <div>
      <Header />

      {/* Segmented Control */}
      <div style={{ padding: '0 24px 16px' }}>
        <div className="segmented">
          <button
            className={`segmented-btn ${view === 'woche' ? 'active' : ''}`}
            onClick={() => setView('woche')}
          >
            🗓 Woche
          </button>
          <button
            className={`segmented-btn ${view === 'jetzt' ? 'active' : ''}`}
            onClick={() => { setView('jetzt'); navigate('/woche/jetzt') }}
          >
            🍳 Jetzt
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 24px', paddingBottom: 24 }}>

        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            DEIN PLAN
          </p>
          <h1 className="page-title">Diese Woche</h1>
        </div>

        {/* ─── STATE A: Setup ─── */}
        {!weekPlan && (
          <>
            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em', marginBottom: 24 }}>
                Woche planen
              </h2>

              {/* Meal counts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>🍳</span>
                    <span style={{ fontSize: 16, fontWeight: 500 }}>Zuhause kochen</span>
                  </div>
                  <Stepper value={homeMeals} onChange={setHomeMeals} min={0} max={14} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>🥡</span>
                    <span style={{ fontSize: 16, fontWeight: 500 }}>Zum Mitnehmen</span>
                  </div>
                  <Stepper value={prepMeals} onChange={setPrepMeals} min={0} max={14} />
                </div>
              </div>

              <div className="divider" />

              {/* Meal pref */}
              <div style={{ marginTop: 16, marginBottom: 16 }}>
                <p style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-on-surface-variant)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                  MITNEHM-ESSEN AM LIEBSTEN:
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {MEAL_PREF_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`chip ${mealPref === opt.value ? 'chip-active' : 'chip-inactive'}`}
                      onClick={() => setMealPref(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-on-surface-variant)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                  WORAUF ACHTEN?
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PRIORITY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`chip ${priority === opt.value ? 'chip-active' : 'chip-inactive'}`}
                      onClick={() => setPriority(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div style={{
                  background: 'var(--color-error-container)',
                  color: 'var(--color-tertiary)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 14,
                  marginBottom: 16,
                }}>
                  {error}
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <LoadingSpinner size={16} />
                    Generiere...
                  </>
                ) : (
                  'Woche vorschlagen ✨'
                )}
              </button>
            </div>

            {/* Editorial block */}
            <div className="editorial-block">
              <div className="editorial-text">
                <h3 style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.025em', marginBottom: 8 }}>
                  Frische Ideen für deinen Pantry-Check.
                </h3>
                <p style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', lineHeight: 1.6 }}>
                  Reduziere Abfall und spare Zeit mit deinem persönlichen Planer.
                </p>
              </div>
            </div>
          </>
        )}

        {/* ─── STATE B: Week planned ─── */}
        {weekPlan && (
          <>
            {/* Header with edit */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
              <div />
              <button className="btn-ghost" onClick={handleEditPlan} style={{ fontSize: 16 }}>
                Bearbeiten
              </button>
            </div>

            {/* Stat banner */}
            <div className="stat-banner" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 20 }}>
                <div className="stat-item">
                  <span className="stat-value">{prepRecipes.length + freshRecipes.length}</span>
                  <span className="stat-label">Mahlzeiten</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{prepRecipes.length}</span>
                  <span className="stat-label">Meal Prep</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{freshRecipes.length}</span>
                  <span className="stat-label">Frisch</span>
                </div>
              </div>
              <Info size={14} color="var(--color-on-surface-variant)" />
            </div>

            {/* Prep Day Section */}
            {prepRecipes.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h2 className="section-title">🥘 Prep Day — Sonntag</h2>
                  <span style={{ fontSize: 14, color: 'var(--color-on-surface-variant)' }}>
                    ~{Math.round(prepRecipes.reduce((s, r) => s + (r.prep_time || 30), 0) / 60 * 2) / 2}h gesamt
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {prepRecipes.map(item => (
                    <PlanRecipeCard key={item.id} item={item} type="prep" />
                  ))}
                </div>
              </div>
            )}

            {/* Fresh cooking */}
            {freshRecipes.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h2 className="section-title" style={{ marginBottom: 16 }}>🍳 Frisch kochen</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {freshRecipes.map(item => (
                    <PlanRecipeCard key={item.id} item={item} type="fresh" />
                  ))}
                </div>
              </div>
            )}

            {/* Create shopping list button */}
            <div style={{ position: 'sticky', bottom: 'calc(var(--bottom-nav-height) + 16px)' }}>
              <button
                className="btn btn-primary-solid"
                onClick={handleCreateShoppingList}
                style={{ gap: 8 }}
              >
                <ShoppingCart size={20} />
                Einkaufsliste erstellen
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const DAY_NAMES = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

function PlanRecipeCard({ item, type }) {
  const navigate = useNavigate()

  if (type === 'prep') {
    return (
      <div
        className="recipe-card-asymmetric"
        style={{ cursor: 'pointer', minHeight: 160 }}
        onClick={() => navigate(`/rezept/${item.recipe_id}`)}
      >
        <div style={{
          width: 150,
          flexShrink: 0,
          background: 'var(--color-surface-low)',
          minHeight: 160,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
          ) : (
            <div style={{
              width: '100%', height: '100%', minHeight: 160,
              background: 'linear-gradient(135deg, var(--color-primary-container), var(--color-surface-high))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
            }}>
              🥘
            </div>
          )}
        </div>
        <div style={{ flex: 1, padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {item.is_cold_edible
              ? <span className="chip-tag chip-tag-orange-solid">Kalt essbar</span>
              : <span className="chip-tag chip-tag-neutral">Aufwärmen</span>
            }
            {item.shelf_life_days
              ? <span className="chip-tag chip-tag-neutral">{item.shelf_life_days}d</span>
              : null}
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em', color: 'var(--color-on-surface)' }}>
            {item.name}
          </h3>
          <div style={{ display: 'flex', gap: 16, fontSize: 15, color: 'var(--color-on-surface-variant)', fontWeight: 500 }}>
            {item.portions ? <span>🍽 {item.portions} Port.</span> : null}
            {item.prep_time ? <span>⏱ {item.prep_time} min</span> : null}
          </div>
        </div>
      </div>
    )
  }

  // Fresh cooking row
  const dayNum = (item.day_index || 0) % 7
  return (
    <div
      className="recipe-card-row"
      style={{ cursor: 'pointer', padding: '18px 16px', gap: 0 }}
      onClick={() => navigate(`/rezept/${item.recipe_id}`)}
    >
      <div className="day-badge" style={{ fontSize: 15, fontWeight: 700 }}>
        {DAY_NAMES[dayNum] || `T${item.day_index}`}
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingLeft: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-on-surface)', lineHeight: 1.3 }}>
          {item.name}
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', fontWeight: 500, marginTop: 4 }}>
          {item.prep_time ? `⏱ ${item.prep_time} min` : ''}
          {Array.isArray(item.tags) && item.tags[0] ? ` · ${item.tags[0]}` : ''}
        </div>
      </div>
    </div>
  )
}
