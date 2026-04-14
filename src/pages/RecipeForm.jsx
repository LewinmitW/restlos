import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../api/client'
import Header from '../components/Header'
import LoadingSpinner from '../components/LoadingSpinner'
import { Plus, Minus, Trash2, GripVertical } from 'lucide-react'

const CATEGORIES = [
  { value: 'fruehstueck', label: 'Frühstück' },
  { value: 'mittag',      label: 'Mittagessen' },
  { value: 'abend',       label: 'Abendessen' },
  { value: 'snack',       label: 'Snack' },
]

const UNITS = ['g', 'kg', 'ml', 'l', 'EL', 'TL', 'Stk', 'Prise', 'Dose', 'Bund', 'Pkg']

const emptyIngredient = () => ({
  _key: Date.now() + Math.random(),
  ingredient_id: null,
  ingredient_name: '',
  amount: '',
  unit: 'g',
  is_optional: false,
})

const emptyStep = () => ({ _key: Date.now() + Math.random(), text: '' })

export default function RecipeForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { dispatch } = useApp()
  const isEdit = !!id && id !== 'neu'

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form fields
  const [name, setName] = useState('')
  const [category, setCategory] = useState('abend')
  const [prepTime, setPrepTime] = useState(30)
  const [baseServings, setBaseServings] = useState(1)
  const [isMealPrep, setIsMealPrep] = useState(false)
  const [isColdEdible, setIsColdEdible] = useState(false)
  const [shelfLifeDays, setShelfLifeDays] = useState(3)
  const [batchPortions, setBatchPortions] = useState(2)
  const [ingredients, setIngredients] = useState([emptyIngredient()])
  const [steps, setSteps] = useState([emptyStep()])
  const [tags, setTags] = useState('')
  const [notes, setNotes] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)

  // Ingredient autocomplete
  const [suggestions, setSuggestions] = useState({})

  useEffect(() => {
    if (isEdit) loadRecipe()
  }, [id])

  const loadRecipe = async () => {
    try {
      const res = await api(`recipes/get.php?id=${id}`)
      if (res.success) {
        const r = res.data
        setName(r.name || '')
        setCategory(r.category || 'abend')
        setPrepTime(r.prep_time || 30)
        setBaseServings(r.base_servings || 1)
        setIsMealPrep(!!r.is_meal_prep)
        setIsColdEdible(!!r.is_cold_edible)
        setShelfLifeDays(r.shelf_life_days || 3)
        setBatchPortions(r.batch_portions || 2)
        setTags(r.tags || '')
        setNotes(r.notes || '')
        setIsFavorite(!!r.is_favorite)
        if (r.ingredients?.length > 0) {
          setIngredients(r.ingredients.map(ing => ({ ...ing, _key: ing.id })))
        }
        const parsedSteps = (() => { try { return JSON.parse(r.steps || '[]') } catch { return r.steps ? [r.steps] : [] } })()
        if (parsedSteps.length > 0) {
          setSteps(parsedSteps.map(text => ({ _key: Date.now() + Math.random(), text })))
        }
      }
    } catch {}
    setLoading(false)
  }

  const searchIngredient = useCallback(async (idx, q) => {
    if (!q || q.length < 2) { setSuggestions(s => ({ ...s, [idx]: [] })); return }
    try {
      const res = await api(`ingredients/search.php?q=${encodeURIComponent(q)}`)
      if (res.success) setSuggestions(s => ({ ...s, [idx]: res.data }))
    } catch {}
  }, [])

  const updateIngredient = (idx, field, value) => {
    setIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing))
    if (field === 'ingredient_name') {
      const t = setTimeout(() => searchIngredient(idx, value), 300)
      return () => clearTimeout(t)
    }
  }

  const selectSuggestion = (idx, s) => {
    setIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, ingredient_id: s.id, ingredient_name: s.name, unit: s.default_unit || ing.unit } : ing))
    setSuggestions(prev => ({ ...prev, [idx]: [] }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name ist erforderlich'); return }
    setSaving(true)
    setError('')

    const payload = {
      name: name.trim(),
      category,
      prep_time: parseInt(prepTime),
      base_servings: parseInt(baseServings),
      is_meal_prep: isMealPrep ? 1 : 0,
      is_cold_edible: isColdEdible ? 1 : 0,
      shelf_life_days: isMealPrep ? parseInt(shelfLifeDays) : 0,
      batch_portions: isMealPrep ? parseInt(batchPortions) : 1,
      is_favorite: isFavorite ? 1 : 0,
      tags: tags.trim(),
      notes: notes.trim(),
      steps: JSON.stringify(steps.map(s => s.text).filter(Boolean)),
      ingredients: ingredients
        .filter(ing => ing.ingredient_name || ing.ingredient_id)
        .map(ing => ({
          ingredient_id: ing.ingredient_id,
          ingredient_name: ing.ingredient_name,
          amount: parseFloat(ing.amount) || 0,
          unit: ing.unit,
          is_optional: ing.is_optional ? 1 : 0,
        })),
    }

    try {
      const endpoint = isEdit ? 'recipes/update.php' : 'recipes/create.php'
      if (isEdit) payload.id = parseInt(id)

      const res = await api(endpoint, { method: 'POST', body: JSON.stringify(payload) })
      if (res.success) {
        if (isEdit) {
          dispatch({ type: 'UPDATE_RECIPE', payload: res.data })
        } else {
          dispatch({ type: 'ADD_RECIPE', payload: res.data })
        }
        navigate(isEdit ? `/rezept/${id}` : `/rezept/${res.data.id}`)
      } else {
        setError(res.error || 'Speichern fehlgeschlagen')
      }
    } catch (e) {
      setError('Verbindungsfehler')
    }
    setSaving(false)
  }

  if (loading) return <div style={{ padding: 24 }}><LoadingSpinner center /></div>

  return (
    <div>
      <Header
        showBack
        title={isEdit ? 'Rezept bearbeiten' : 'Neues Rezept'}
        right={
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-primary)' }}
          >
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        }
      />

      <form onSubmit={handleSubmit} style={{ padding: '24px 24px', paddingBottom: 80 }}>
        {error && (
          <div style={{ background: 'var(--color-error-container)', color: 'var(--color-tertiary)', padding: '12px 16px', borderRadius: 12, marginBottom: 20, fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* Name */}
        <div className="form-group">
          <label className="form-label">Name *</label>
          <input className="form-input" placeholder="z.B. Pasta Puttanesca" value={name} onChange={e => setName(e.target.value)} required />
        </div>

        {/* Category + Time row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: 8, fontSize: 11, fontWeight: 600, color: 'var(--color-on-surface-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Kategorie
            </label>
            <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: 8, fontSize: 11, fontWeight: 600, color: 'var(--color-on-surface-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Zeit (Minuten)
            </label>
            <input className="form-input" type="number" min="1" max="480" value={prepTime} onChange={e => setPrepTime(e.target.value)} />
          </div>
        </div>

        {/* Meal Prep toggle */}
        <div style={{ background: 'var(--color-surface-low)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMealPrep ? 16 : 0 }}>
            <span style={{ fontSize: 15, fontWeight: 500 }}>🥡 Meal Prep geeignet</span>
            <button
              type="button"
              onClick={() => setIsMealPrep(v => !v)}
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: isMealPrep ? 'var(--color-primary)' : 'var(--color-outline-variant)',
                position: 'relative', transition: 'background 200ms',
              }}
            >
              <span style={{
                position: 'absolute',
                top: 2, left: isMealPrep ? 22 : 2,
                width: 20, height: 20, borderRadius: '50%', background: 'white',
                transition: 'left 200ms',
              }} />
            </button>
          </div>
          {isMealPrep && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, color: 'var(--color-on-surface-variant)' }}>🧊 Kalt essbar?</span>
                <button
                  type="button"
                  onClick={() => setIsColdEdible(v => !v)}
                  style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: isColdEdible ? 'var(--color-primary)' : 'var(--color-outline-variant)',
                    position: 'relative',
                  }}
                >
                  <span style={{ position: 'absolute', top: 2, left: isColdEdible ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 200ms' }} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', display: 'block', marginBottom: 4 }}>Hält sich (Tage)</label>
                  <input className="form-input" type="number" min="1" max="30" value={shelfLifeDays} onChange={e => setShelfLifeDays(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', display: 'block', marginBottom: 4 }}>Batch-Portionen</label>
                  <input className="form-input" type="number" min="1" max="20" value={batchPortions} onChange={e => setBatchPortions(e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ingredients */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Zutaten</h3>
            <button
              type="button"
              onClick={() => setIngredients(prev => [...prev, emptyIngredient()])}
              style={{ color: 'var(--color-primary)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Plus size={14} />
              Zutat
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ingredients.map((ing, idx) => (
              <div key={ing._key} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--color-surface-low)', borderRadius: 12, padding: '8px 12px' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      style={{ width: '100%', background: 'transparent', fontSize: 15 }}
                      placeholder="Zutat..."
                      value={ing.ingredient_name}
                      onChange={e => updateIngredient(idx, 'ingredient_name', e.target.value)}
                    />
                    {suggestions[idx]?.length > 0 && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        background: 'white', borderRadius: 8, boxShadow: 'var(--shadow-float)',
                        zIndex: 50, overflow: 'hidden', marginTop: 4,
                      }}>
                        {suggestions[idx].slice(0, 5).map(s => (
                          <button
                            key={s.id}
                            type="button"
                            style={{ width: '100%', padding: '10px 12px', textAlign: 'left', fontSize: 14, borderBottom: '1px solid var(--color-surface-low)' }}
                            onClick={() => selectSuggestion(idx, s)}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    style={{ width: 56, background: 'transparent', fontSize: 14, textAlign: 'right' }}
                    type="number"
                    placeholder="Menge"
                    value={ing.amount}
                    onChange={e => updateIngredient(idx, 'amount', e.target.value)}
                  />
                  <select
                    style={{ background: 'transparent', fontSize: 13, color: 'var(--color-on-surface-variant)' }}
                    value={ing.unit}
                    onChange={e => updateIngredient(idx, 'unit', e.target.value)}
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIngredients(prev => prev.filter((_, i) => i !== idx))}
                    style={{ color: 'var(--color-tertiary)', flexShrink: 0 }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Zubereitung</h3>
            <button
              type="button"
              onClick={() => setSteps(prev => [...prev, emptyStep()])}
              style={{ color: 'var(--color-primary)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Plus size={14} />
              Schritt
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {steps.map((step, idx) => (
              <div key={step._key} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-primary)', color: 'white', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 10 }}>
                  {idx + 1}
                </div>
                <textarea
                  style={{ flex: 1, background: 'var(--color-surface-low)', borderRadius: 10, padding: '10px 12px', fontSize: 14, lineHeight: 1.6, minHeight: 60, resize: 'vertical' }}
                  placeholder={`Schritt ${idx + 1}...`}
                  value={step.text}
                  onChange={e => setSteps(prev => prev.map((s, i) => i === idx ? { ...s, text: e.target.value } : s))}
                />
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSteps(prev => prev.filter((_, i) => i !== idx))}
                    style={{ color: 'var(--color-tertiary)', marginTop: 12 }}
                  >
                    <Minus size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="form-group">
          <label className="form-label">Tags</label>
          <input className="form-input" placeholder="z.B. vegan, mediterran, schnell" value={tags} onChange={e => setTags(e.target.value)} />
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="form-label">Notizen</label>
          <textarea
            className="form-input"
            placeholder="Tipps, Variationen, ..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            style={{ minHeight: 80, resize: 'vertical' }}
          />
        </div>

        {/* Favorite */}
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--color-surface-low)', borderRadius: 12, marginBottom: 32, cursor: 'pointer' }}
          onClick={() => setIsFavorite(v => !v)}
        >
          <span style={{ fontSize: 15, fontWeight: 500 }}>❤️ Als Favorit markieren</span>
          <div style={{
            width: 44, height: 24, borderRadius: 12,
            background: isFavorite ? 'var(--color-tertiary)' : 'var(--color-outline-variant)',
            position: 'relative',
          }}>
            <span style={{ position: 'absolute', top: 2, left: isFavorite ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 200ms' }} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Speichern...' : (isEdit ? 'Rezept aktualisieren' : 'Rezept erstellen')}
        </button>
      </form>
    </div>
  )
}
