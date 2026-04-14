export function formatLastCooked(dateStr) {
  if (!dateStr) return null
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Heute'
  if (diffDays === 1) return 'Gestern'
  if (diffDays < 7) return `vor ${diffDays} Tagen`
  if (diffDays < 14) return 'vor 1 Woche'
  if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Wochen`
  if (diffDays < 60) return 'vor 1 Monat'
  return `vor ${Math.floor(diffDays / 30)} Monaten`
}

export function formatAmount(amount, unit) {
  if (!amount) return unit || ''
  const n = parseFloat(amount)
  if (Number.isInteger(n)) return `${n} ${unit || ''}`.trim()
  return `${n.toFixed(1).replace('.0', '')} ${unit || ''}`.trim()
}

export function scaleAmount(amount, from, to) {
  if (!amount || !from || from === 0) return amount
  return ((parseFloat(amount) * to) / from).toFixed(2).replace(/\.?0+$/, '')
}

export function getCurrentWeekYear() {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const days = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24))
  const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7)
  return { week: weekNum, year: now.getFullYear() }
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const CATEGORY_LABELS = {
  gemuese:      'Gemüse',
  obst:         'Obst',
  milch:        'Milch & Käse',
  fleisch:      'Fleisch & Fisch',
  fisch:        'Fisch',
  dosen:        'Dosen & Gläser',
  gewuerze:     'Gewürze',
  grundzutaten: 'Grundzutaten',
  tiefkuehl:    'Tiefkühl',
  sonstiges:    'Sonstiges',
}

export function formatCategory(cat) {
  return CATEGORY_LABELS[cat] || cat
}

const LOCATION_LABELS = {
  kuehlschrank: 'Kühlschrank',
  schrank:      'Vorratsschrank',
  tiefkuehl:    'Tiefkühl',
  immer_da:     'Immer da',
}

export function formatLocation(loc) {
  return LOCATION_LABELS[loc] || loc
}

const SUPERMARKET_LABELS = {
  gemuese_obst:   'Gemüse & Obst',
  milch_kuehl:    'Milch & Kühlregal',
  fleisch_fisch:  'Fleisch & Fisch',
  dosen_glaeser:  'Dosen & Gläser',
  backwaren:      'Backwaren',
  getraenke:      'Getränke',
  tiefkuehl:      'Tiefkühl',
  gewuerze:       'Gewürze',
  sonstiges:      'Sonstiges',
}

export function formatSupermarketCategory(cat) {
  return SUPERMARKET_LABELS[cat] || 'Sonstiges'
}

export function groupBySupermarketCategory(items) {
  const groups = {}
  for (const item of items) {
    const cat = item.supermarket_category || 'sonstiges'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(item)
  }
  return groups
}
