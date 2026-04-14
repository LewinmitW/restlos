import { Minus, Plus } from 'lucide-react'

export default function Stepper({ value, onChange, min = 1, max = 99 }) {
  return (
    <div className="stepper">
      <button
        className="stepper-btn"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <Minus size={14} color="var(--color-on-surface)" />
      </button>
      <span className="stepper-value">{value}</span>
      <button
        className="stepper-btn"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <Plus size={14} color="var(--color-on-surface)" />
      </button>
    </div>
  )
}
