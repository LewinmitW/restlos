import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../api/client'
import Header from '../components/Header'
import BottomSheet from '../components/BottomSheet'
import LoadingSpinner from '../components/LoadingSpinner'
import { ShoppingCart, ChevronLeft, ChevronRight, Utensils, RefreshCw } from 'lucide-react'

// Day config: index matches day_index in DB (0=Sun, 1=Mon, ..., 6=Sat)
const DAYS = [
  { key: 'mo', label: 'Mo', short: 'Mo', index: 1 },
  { key: 'di', label: 'Di', short: 'Di', index: 2 },
  { key: 'mi', label: 'Mi', short: 'Mi', index: 3 },
  { key: 'do', label: 'Do', short: 'Do', index: 4 },
  { key: 'fr', label: 'Fr', short: 'Fr', index: 5 },
  { key: 'sa', label: 'Sa', short: 'Sa', index: 6 },
  { key: 'so', label: 'So', short: 'So', index: 0 },
]

const MEAL_TYPES = [
  { value: 'frisch', label: '🍳 Frisch kochen', desc: 'Direkt zubereiten' },
  { value: 'prep',   label: '🥡 Meal Prep',    desc: 'Vorbereiten & mitnehmen' },
]

function getWeekDates(weekOffset = 0) {
  const now = new Date()
  now.setDate(now.getDate() + weekOffset * 7)
  const dayOfWeek = now.getDay() // 0=Sun
  // Get Monday of the current week
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))

  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d)
  }
  // Return Mon-Sun
  return dates
}

function getISOWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
}

export default function WeekPlanner() {
  const navigate = useNavigate()
  const { weekPlan, weekPlanLoaded, dispatch, loadWeekPlan } = useApp()

  const [view, setView] = useState('woche') // 'woche' | 'jetzt'
  const [weekOffset, setWeekOffset] = useState(0)
  const [planSheetOpen, setPlanSheetOpen] = useState(false)
  const [planStep, setPlanStep] = useState(1) // 1=days, 2=generating, 3=review
  const [selectedDays, setSelectedDays] = useState(new Set())
  const [dayTypes, setDayTypes] = useState({}) // {dayIndex: 'frisch'|'prep'}
  const [preferCold, setPreferCold] = useState(false)
  const [priority, setPriority] = useState('wenig_einkaufen')
  const [suggestions, setSuggestions] = useState([]) // proposed slots
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadWeekPlan()
  }, [])

  const weekDates = getWeekDates(weekOffset)
  // weekDates[0]=Mon ... weekDates[6]=Sun
  // Map dates to DAYS array: DAYS[0]=Mo(index1)...DAYS[6]=So(index0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Build slot map: dayIndex → slot
  const slotsByDay = {}
  if (weekPlan?.slots) {
    for (const slot of weekPlan.slots) {
      slotsByDay[slot.day_index] = slot
    }
  }

  const toggleDay = (dayIndex) => {
    setSelectedDays(prev => {
      const next = new Set(prev)
      if (next.has(dayIndex)) {
        next.delete(dayIndex)
        setDayTypes(dt => { const n = { ...dt }; delete n[dayIndex]; return n })
      } else {
        next.add(dayIndex)
        setDayTypes(dt => ({ ...dt, [dayIndex]: 'frisch' }))
      }
      return next
    })
  }

  const setDayType = (dayIndex, type) => {
    setDayTypes(prev => ({ ...prev, [dayIndex]: type }))
  }

  const handleOpenPlan = () => {
    setSelectedDays(new Set())
    setDayTypes({})
    setPlanStep(1)
    setError('')
    setSuggestions([])
    setPlanSheetOpen(true)
  }

  const handleGenerate = async () => {
    if (selectedDays.size === 0) {
      setError('Bitte wähle mindestens einen Tag aus.')
      return
    }
    setError('')
    setPlanStep(2)
    setGenerating(true)
    try {
      const dayAssignments = [...selectedDays].map(dayIndex => ({
        day_index: dayIndex,
        slot_type: dayTypes[dayIndex] || 'frisch',
      }))

      const res = await api('planner/generate.php', {
        method: 'POST',
        body: JSON.stringify({
          day_assignments: dayAssignments,
          prefer_cold: preferCold ? 1 : 0,
          priority,
        }),
      })

      if (res.success) {
        setSuggestions(res.data.slots || [])
        setPlanStep(3)
      } else {
        setError(res.error || 'Fehler beim Generieren')
        setPlanStep(1)
      }
    } catch {
      setError('Verbindungsfehler. Backend erreichbar?')
      setPlanStep(1)
    }
    setGenerating(false)
  }

  const handleConfirmPlan = async () => {
    try {
      const now = new Date()
      const week = getISOWeek(now)
      const year = now.getFullYear()
      const res = await api('planner/save.php', {
        method: 'POST',
        body: JSON.stringify({ week, year, slots: suggestions }),
      })
      if (res.success) {
        dispatch({ type: 'SET_WEEK_PLAN', payload: { week, year, slots: suggestions } })
        setPlanSheetOpen(false)
      }
    } catch {}
  }

  const handleSwapSlot = async (slotIndex) => {
    // Re-generate just this slot by calling generate again
    // For now: regenerate full plan with same params
    await handleGenerate()
  }

  const handleCreateShoppingList = async () => {
    try {
      const res = await api('shopping/list.php', { method: 'GET' })
      dispatch({ type: 'SET_SHOPPING', payload: res.data || [] })
    } catch {}
    navigate('/liste')
  }

  const handleClearPlan = () => {
    dispatch({ type: 'SET_WEEK_PLAN', payload: null })
  }

  const hasPlan = weekPlan?.slots?.length > 0

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
            onClick={() => { setView('jetzt'); navigate('/planen/jetzt') }}
          >
            🍳 Jetzt
          </button>
        </div>
      </div>

      <div style={{ padding: '0 24px', paddingBottom: 24 }}>

        {/* Page title + week nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p className="page-subtitle">DEIN PLAN</p>
            <h1 className="page-title" style={{ fontSize: 30 }}>Diese Woche</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => setWeekOffset(v => v - 1)}
              style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-surface-high)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setWeekOffset(v => v + 1)}
              style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-surface-high)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Loading state */}
        {!weekPlanLoaded && <LoadingSpinner center />}

        {weekPlanLoaded && (
          <>
            {/* Week Calendar Grid */}
            <div className="week-calendar" style={{ marginBottom: 24 }}>
              {DAYS.map((day, i) => {
                const date = weekDates[i]
                const slot = slotsByDay[day.index]
                const isToday = date && date.getTime() === today.getTime()
                const isPast  = date && date < today

                return (
                  <div
                    key={day.key}
                    className={`day-cell ${isToday ? 'day-cell-today' : ''} ${isPast ? 'day-cell-past' : ''} ${slot ? 'day-cell-filled' : ''}`}
                    onClick={() => slot && navigate(`/rezept/${slot.recipe_id}`)}
                    style={{ cursor: slot ? 'pointer' : 'default' }}
                  >
                    <div className="day-cell-header">
                      <span className="day-cell-label">{day.label}</span>
                      {date && (
                        <span className="day-cell-date">{date.getDate()}</span>
                      )}
                    </div>
                    <div className="day-cell-content">
                      {slot ? (
                        <>
                          <div className="day-cell-meal-type">
                            {slot.slot_type === 'prep' ? '🥡' : '🍳'}
                          </div>
                          <div className="day-cell-meal-name">{slot.name}</div>
                        </>
                      ) : (
                        <div className="day-cell-empty">–</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                className="btn btn-primary-solid"
                onClick={handleOpenPlan}
                style={{ gap: 8 }}
              >
                <Utensils size={18} />
                Essen planen
              </button>

              {hasPlan && (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={handleCreateShoppingList}
                    style={{ gap: 8, background: 'var(--color-surface-high)', color: 'var(--color-on-surface)' }}
                  >
                    <ShoppingCart size={16} />
                    Einkaufsliste erstellen
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={handleClearPlan}
                    style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', textAlign: 'center', padding: '8px 0' }}
                  >
                    Plan zurücksetzen
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Planning Bottom Sheet */}
      <BottomSheet
        open={planSheetOpen}
        onClose={() => setPlanSheetOpen(false)}
        title={planStep === 1 ? 'Essen planen' : planStep === 2 ? 'Generiere...' : 'Vorschläge'}
      >
        {planStep === 1 && (
          <PlanStepDays
            weekDates={weekDates}
            selectedDays={selectedDays}
            dayTypes={dayTypes}
            preferCold={preferCold}
            priority={priority}
            error={error}
            onToggleDay={toggleDay}
            onSetDayType={setDayType}
            onPreferCold={setPreferCold}
            onPriority={setPriority}
            onGenerate={handleGenerate}
          />
        )}
        {planStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 16 }}>
            <LoadingSpinner size={32} />
            <p style={{ fontSize: 15, color: 'var(--color-on-surface-variant)' }}>Rezeptvorschläge werden erstellt…</p>
          </div>
        )}
        {planStep === 3 && (
          <PlanStepReview
            suggestions={suggestions}
            weekDates={weekDates}
            onConfirm={handleConfirmPlan}
            onRegenerate={handleGenerate}
            onBack={() => setPlanStep(1)}
          />
        )}
      </BottomSheet>
    </div>
  )
}

// ─── Step 1: Day + type picker ───────────────────────────────────────────────

const PRIORITY_OPTIONS = [
  { value: 'wenig_einkaufen', label: 'Wenig einkaufen' },
  { value: 'abwechslung',     label: 'Abwechslung' },
  { value: 'schnell',         label: 'Schnell kochen' },
]

function PlanStepDays({ weekDates, selectedDays, dayTypes, preferCold, priority, error,
  onToggleDay, onSetDayType, onPreferCold, onPriority, onGenerate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Day picker */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          AN WELCHEN TAGEN BRAUCHST DU ESSEN?
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {DAYS.map((day, i) => {
            const date = weekDates[i]
            const isSelected = selectedDays.has(day.index)
            return (
              <button
                key={day.key}
                onClick={() => onToggleDay(day.index)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '8px 4px', borderRadius: 10, gap: 4,
                  background: isSelected ? 'var(--color-primary)' : 'var(--color-surface-low)',
                  color: isSelected ? 'white' : 'var(--color-on-surface)',
                  transition: 'all 150ms',
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600 }}>{day.label}</span>
                {date && <span style={{ fontSize: 13, fontWeight: 700 }}>{date.getDate()}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Type picker for selected days */}
      {selectedDays.size > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            WAS PLANST DU FÜR DIESE TAGE?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...selectedDays].sort((a, b) => {
              // sort Mon-Sun: 1,2,3,4,5,6,0
              const order = [1,2,3,4,5,6,0]
              return order.indexOf(a) - order.indexOf(b)
            }).map(dayIndex => {
              const day = DAYS.find(d => d.index === dayIndex)
              const dateIndex = DAYS.indexOf(day)
              const date = weekDates[dateIndex]
              const currentType = dayTypes[dayIndex] || 'frisch'
              return (
                <div key={dayIndex} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--color-surface-low)', borderRadius: 10 }}>
                  <div style={{ minWidth: 52, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>{day?.label}</span>
                    {date && <span style={{ fontSize: 11, color: 'var(--color-on-surface-variant)' }}>{date.getDate()}.{date.getMonth()+1}.</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                    {MEAL_TYPES.map(mt => (
                      <button
                        key={mt.value}
                        onClick={() => onSetDayType(dayIndex, mt.value)}
                        style={{
                          flex: 1, padding: '6px 8px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          background: currentType === mt.value ? 'var(--color-primary)' : 'var(--color-surface-high)',
                          color: currentType === mt.value ? 'white' : 'var(--color-on-surface)',
                        }}
                      >
                        {mt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Priority */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          WORAUF ACHTEN?
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PRIORITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`chip ${priority === opt.value ? 'chip-active' : 'chip-inactive'}`}
              onClick={() => onPriority(opt.value)}
              style={{ fontSize: 13 }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cold pref */}
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--color-surface-low)', borderRadius: 10, cursor: 'pointer' }}
        onClick={() => onPreferCold(!preferCold)}
      >
        <span style={{ fontSize: 14, fontWeight: 500 }}>🧊 Kalt essbares bevorzugen</span>
        <div style={{ width: 40, height: 22, borderRadius: 11, background: preferCold ? 'var(--color-primary)' : 'var(--color-outline-variant)', position: 'relative', transition: 'background 200ms' }}>
          <span style={{ position: 'absolute', top: 2, left: preferCold ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 200ms' }} />
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--color-error-container)', color: 'var(--color-tertiary)', padding: '10px 14px', borderRadius: 10, fontSize: 14 }}>
          {error}
        </div>
      )}

      <button
        className="btn btn-primary-solid"
        onClick={onGenerate}
        disabled={selectedDays.size === 0}
        style={{ gap: 8 }}
      >
        Vorschläge generieren ✨
      </button>
    </div>
  )
}

// ─── Step 3: Review suggestions ──────────────────────────────────────────────

const DAY_LABELS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

function PlanStepReview({ suggestions, weekDates, onConfirm, onRegenerate, onBack }) {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', lineHeight: 1.5 }}>
        Prüfe die Vorschläge und bestätige deinen Plan.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
        {suggestions.map((slot, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', background: 'var(--color-surface-low)', borderRadius: 12,
            }}
          >
            <div className="day-badge" style={{ flexShrink: 0, fontSize: 13, fontWeight: 700, width: 44, height: 44 }}>
              {DAY_LABELS[slot.day_index] || `T${slot.day_index}`}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-on-surface)', lineHeight: 1.3 }}>
                {slot.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', marginTop: 2 }}>
                {slot.slot_type === 'prep' ? '🥡 Meal Prep' : '🍳 Frisch'}
                {slot.prep_time ? ` · ${slot.prep_time} min` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'var(--color-surface-high)', color: 'var(--color-on-surface)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          onClick={onRegenerate}
        >
          <RefreshCw size={14} />
          Neu generieren
        </button>
        <button
          className="btn btn-primary-solid"
          style={{ flex: 2 }}
          onClick={onConfirm}
        >
          Plan bestätigen ✓
        </button>
      </div>

      <button
        onClick={onBack}
        style={{ fontSize: 13, color: 'var(--color-on-surface-variant)', textAlign: 'center', padding: '4px 0' }}
      >
        ← Tage neu wählen
      </button>
    </div>
  )
}
