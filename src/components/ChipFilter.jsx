export default function ChipFilter({ options, value, onChange, small }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
      }}
    >
      {options.map(opt => (
        <button
          key={opt.value}
          className={`chip-filter ${value === opt.value ? 'active' : 'inactive'}`}
          style={small ? { fontSize: 11, padding: '6px 12px' } : {}}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
