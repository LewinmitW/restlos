import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../api/client'
import Header from '../components/Header'
import Stepper from '../components/Stepper'
import BottomSheet from '../components/BottomSheet'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { Heart, Clock, Users, Edit2, ShoppingCart, Check, ChefHat } from 'lucide-react'
import { scaleAmount, formatAmount } from '../utils/formatters'

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { pantry, pantryLoaded, loadPantry, dispatch } = useApp()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [portions, setPortions] = useState(1)
  const [cookedOpen, setCookedOpen] = useState(false)
  const [deductPantry, setDeductPantry] = useState(false)
  const [markingCooked, setMarkingCooked] = useState(false)

  useEffect(() => {
    loadRecipe()
    loadPantry()
  }, [id])

  const loadRecipe = async () => {
    setLoading(true)
    try {
      const res = await api(`recipes/get.php?id=${id}`)
      if (res.success) {
        setRecipe(res.data)
        setPortions(res.data.base_servings || 1)
      }
    } catch {}
    setLoading(false)
  }

  if (loading) return <div style={{ padding: 24 }}><LoadingSpinner center /></div>
  if (!recipe) return (
    <div>
      <Header showBack />
      <EmptyState title="Rezept nicht gefunden" />
    </div>
  )

  const pantryMap = new Map(pantry.map(p => [p.ingredient_id, p]))

  const getIngredientStatus = (ing) => {
    if (pantryMap.has(ing.ingredient_id)) return 'in_pantry'
    if (pantryMap.get(ing.ingredient_id)?.location === 'immer_da') return 'always'
    if ((ing.substitutes || []).some(s => pantryMap.has(s.substitute_ingredient_id))) return 'substitute'
    return 'missing'
  }

  const missingIngredients = (recipe.ingredients || []).filter(ing => {
    if (ing.is_optional) return false
    return getIngredientStatus(ing) === 'missing'
  })

  const handleAddAllMissing = async () => {
    for (const ing of missingIngredients) {
      try {
        await api('shopping/add.php', {
          method: 'POST',
          body: JSON.stringify({ ingredient_id: ing.ingredient_id, amount: `${scaleAmount(ing.amount, recipe.base_servings, portions)} ${ing.unit}` }),
        })
      } catch {}
    }
    navigate('/liste')
  }

  const handleAddSingle = async (ing) => {
    try {
      await api('shopping/add.php', {
        method: 'POST',
        body: JSON.stringify({
          ingredient_id: ing.ingredient_id,
          amount: `${scaleAmount(ing.amount, recipe.base_servings, portions)} ${ing.unit}`,
        }),
      })
    } catch {}
  }

  const handleMarkCooked = async () => {
    setMarkingCooked(true)
    try {
      await api('recipes/update.php', {
        method: 'POST',
        body: JSON.stringify({
          id: recipe.id,
          last_cooked: new Date().toISOString().split('T')[0],
          deduct_pantry: deductPantry ? 1 : 0,
          portions,
        }),
      })
      dispatch({ type: 'UPDATE_RECIPE', payload: { id: recipe.id, last_cooked: new Date().toISOString().split('T')[0] } })
      if (deductPantry) {
        const pantryRes = await api('pantry/list.php')
        if (pantryRes.success) dispatch({ type: 'SET_PANTRY', payload: pantryRes.data })
      }
      setCookedOpen(false)
    } catch {}
    setMarkingCooked(false)
  }

  const steps = Array.isArray(recipe.steps) ? recipe.steps : []

  return (
    <div>
      <Header
        showBack
        right={
          <button onClick={() => navigate(`/rezept/${id}/edit`)} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-primary)', fontSize: 15, fontWeight: 500 }}>
            <Edit2 size={16} />
            Bearbeiten
          </button>
        }
      />

      {/* Hero image */}
      <div style={{
        height: 220,
        background: 'linear-gradient(135deg, var(--color-primary-container), var(--color-surface-high))',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {recipe.image_url ? (
          <img src={recipe.image_url} alt={recipe.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
            🍳
          </div>
        )}
        {/* Favorite */}
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <button style={{ background: 'rgba(255,255,255,0.9)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={18} fill={recipe.is_favorite ? 'var(--color-tertiary)' : 'none'} color={recipe.is_favorite ? 'var(--color-tertiary)' : 'var(--color-on-surface-variant)'} />
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 24px', paddingBottom: 120 }}>
        {/* Tags */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {recipe.is_meal_prep && <span className="chip-tag chip-tag-orange">Meal Prep</span>}
          {recipe.is_cold_edible && <span className="chip-tag chip-tag-neutral">Kalt essbar</span>}
          {(Array.isArray(recipe.tags) ? recipe.tags : (recipe.tags || '').split(',')).map(t => t.trim()).filter(Boolean).map(tag => (
            <span key={tag} className="chip-tag chip-tag-neutral">{tag}</span>
          ))}
        </div>

        {/* Title + meta */}
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 12, lineHeight: 1.2 }}>
          {recipe.name}
        </h1>

        <div style={{ display: 'flex', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
          {recipe.prep_time && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--color-on-surface-variant)', fontSize: 14 }}>
              <Clock size={14} />
              {recipe.prep_time} min
            </div>
          )}
        </div>

        {/* Portions stepper */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-surface-low)', borderRadius: 12, padding: '12px 16px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-on-surface-variant)', fontSize: 14 }}>
            <Users size={16} />
            Portionen
          </div>
          <Stepper value={portions} onChange={setPortions} min={1} max={20} />
        </div>

        {/* Ingredients */}
        <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 12 }}>Zutaten</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 24 }}>
          {(recipe.ingredients || []).map(ing => {
            const status = getIngredientStatus(ing)
            const isMissing = status === 'missing'
            return (
              <div
                key={ing.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid rgba(193,201,191,0.15)',
                  opacity: ing.is_optional ? 0.6 : 1,
                }}
              >
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: status === 'in_pantry' || status === 'always' ? 'var(--color-primary)'
                             : status === 'substitute' ? 'var(--color-secondary-container)'
                             : 'var(--color-error-container)',
                  flexShrink: 0,
                  marginRight: 12,
                  border: isMissing ? '2px solid var(--color-tertiary)' : 'none',
                }} />
                <span style={{ flex: 1, fontSize: 15, color: isMissing ? 'var(--color-on-surface)' : 'var(--color-on-surface)' }}>
                  {ing.ingredient_name}
                  {ing.is_optional && <span style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', marginLeft: 6 }}>optional</span>}
                </span>
                <span style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', marginRight: isMissing ? 12 : 0 }}>
                  {formatAmount(scaleAmount(ing.amount, recipe.base_servings, portions), ing.unit)}
                </span>
                {isMissing && (
                  <button
                    onClick={() => handleAddSingle(ing)}
                    style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.05em', flexShrink: 0 }}
                  >
                    + LISTE
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Add all missing */}
        {missingIngredients.length > 0 && (
          <button
            className="btn btn-secondary"
            onClick={handleAddAllMissing}
            style={{ width: '100%', gap: 8, marginBottom: 32 }}
          >
            <ShoppingCart size={16} />
            {missingIngredients.length} fehlende auf die Liste
          </button>
        )}

        {/* Steps */}
        {steps.length > 0 && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 16 }}>Zubereitung</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 16 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: 'var(--color-primary)',
                    color: 'white', fontSize: 13, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
                  }}>
                    {i + 1}
                  </div>
                  <p style={{ flex: 1, fontSize: 15, lineHeight: 1.6, color: 'var(--color-on-surface)' }}>{step}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Notes */}
        {recipe.notes && (
          <div style={{ background: 'var(--color-surface-low)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--color-on-surface-variant)', lineHeight: 1.6 }}>
              💡 {recipe.notes}
            </p>
          </div>
        )}
      </div>

      {/* Gekocht! Button */}
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
          className="btn btn-primary-solid"
          onClick={() => setCookedOpen(true)}
          style={{ gap: 8 }}
        >
          <ChefHat size={18} />
          Gekocht! ✓
        </button>
      </div>

      {/* Cooked confirmation sheet */}
      <BottomSheet open={cookedOpen} onClose={() => setCookedOpen(false)} title="Gekocht!">
        <p style={{ fontSize: 15, color: 'var(--color-on-surface-variant)', marginBottom: 20, lineHeight: 1.6 }}>
          Sollen die verwendeten Zutaten aus dem Vorrat abgezogen werden?
        </p>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--color-surface-low)', borderRadius: 12, marginBottom: 20, cursor: 'pointer' }}
          onClick={() => setDeductPantry(v => !v)}
        >
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: deductPantry ? 'var(--color-primary)' : 'transparent',
            border: `2px solid ${deductPantry ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {deductPantry && <Check size={14} color="white" />}
          </div>
          <span style={{ fontSize: 15, fontWeight: 500 }}>Zutaten vom Vorrat abziehen</span>
        </div>
        <button
          className="btn btn-primary-solid"
          onClick={handleMarkCooked}
          disabled={markingCooked}
        >
          {markingCooked ? 'Speichern...' : 'Bestätigen'}
        </button>
      </BottomSheet>
    </div>
  )
}
