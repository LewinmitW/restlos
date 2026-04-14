import { useNavigate } from 'react-router-dom'
import { Clock, Heart } from 'lucide-react'
import { formatLastCooked } from '../utils/formatters'

export default function RecipeCard({ recipe }) {
  const navigate = useNavigate()

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'opacity var(--transition)',
      }}
      onClick={() => navigate(`/rezept/${recipe.id}`)}
    >
      {/* Image — bleeds off left */}
      <div
        style={{
          width: 120,
          flexShrink: 0,
          background: 'var(--color-surface-low)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, var(--color-primary-container), var(--color-surface-high))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
            }}
          >
            🍳
          </div>
        )}
      </div>

      {/* Info */}
      <div
        style={{
          flex: 1,
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minWidth: 0,
        }}
      >
        <div>
          {/* Tags */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            {recipe.is_meal_prep ? (
              <span className="chip-tag chip-tag-orange">Meal Prep</span>
            ) : null}
            {recipe.is_cold_edible ? (
              <span className="chip-tag chip-tag-neutral">Kalt</span>
            ) : null}
            {recipe.prep_time && (
              <span className="chip-tag chip-tag-neutral">{recipe.prep_time} Min</span>
            )}
          </div>

          {/* Name */}
          <h3 style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 600,
            color: 'var(--color-on-surface)',
            letterSpacing: '-0.025em',
            lineHeight: 1.3,
          }}>
            {recipe.name}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-on-surface-variant)', fontStyle: 'italic' }}>
            {recipe.last_cooked ? `Zuletzt: ${formatLastCooked(recipe.last_cooked)}` : 'Noch nie gekocht'}
          </span>
          {recipe.is_favorite ? (
            <Heart size={14} fill="var(--color-tertiary)" color="var(--color-tertiary)" />
          ) : null}
        </div>
      </div>
    </div>
  )
}
