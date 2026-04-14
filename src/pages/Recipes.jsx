import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../api/client'
import Header from '../components/Header'
import RecipeCard from '../components/RecipeCard'
import SearchInput from '../components/SearchInput'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { Plus, BookOpen } from 'lucide-react'

const FILTERS = [
  { value: 'alle',      label: 'ALLE' },
  { value: 'favoriten', label: 'FAVORITEN' },
  { value: 'meal_prep', label: 'MEAL PREP' },
  { value: 'kalt',      label: 'KALT' },
  { value: 'lt30',      label: '<30 MIN' },
]

export default function Recipes() {
  const navigate = useNavigate()
  const { recipes, recipesLoaded, dispatch, loadRecipes } = useApp()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('alle')

  useEffect(() => { loadRecipes() }, [])

  const filtered = recipes.filter(r => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'favoriten' && !r.is_favorite) return false
    if (filter === 'meal_prep' && !r.is_meal_prep) return false
    if (filter === 'kalt' && !r.is_cold_edible) return false
    if (filter === 'lt30' && (r.prep_time || 99) >= 30) return false
    return true
  })

  const handleDelete = async (e, recipeId) => {
    e.stopPropagation()
    if (!confirm('Rezept wirklich löschen?')) return
    try {
      await api('recipes/delete.php', {
        method: 'POST',
        body: JSON.stringify({ id: recipeId }),
      })
      dispatch({ type: 'REMOVE_RECIPE', payload: recipeId })
    } catch {}
  }

  return (
    <div>
      <Header
        right={
          <button className="btn-icon-round" onClick={() => navigate('/rezept/neu')}>
            <Plus size={16} color="white" />
          </button>
        }
      />

      <div style={{ padding: '0 24px', paddingBottom: 24 }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.05em' }}>Meine Rezepte</h1>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Rezept suchen..." flat />
        </div>

        {/* Filter chips */}
        <div className="filter-row" style={{ margin: '0 -24px', padding: '4px 24px', marginBottom: 24 }}>
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

        {!recipesLoaded && <LoadingSpinner center />}

        {recipesLoaded && filtered.length === 0 && (
          <EmptyState
            icon={<BookOpen />}
            title={search || filter !== 'alle' ? 'Keine Treffer' : 'Noch keine Rezepte'}
            text={search || filter !== 'alle' ? 'Versuche einen anderen Suchbegriff oder Filter.' : 'Erstelle dein erstes Rezept!'}
            action={
              !search && filter === 'alle' ? (
                <button
                  className="btn btn-primary"
                  style={{ width: 'auto', padding: '10px 20px' }}
                  onClick={() => navigate('/rezept/neu')}
                >
                  + Rezept hinzufügen
                </button>
              ) : null
            }
          />
        )}

        {/* Recipe grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
          {filtered.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </div>
    </div>
  )
}
