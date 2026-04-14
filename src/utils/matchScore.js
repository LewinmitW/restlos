/**
 * Client-side Vorrat-Match-Berechnung
 */

/**
 * Calculate how many ingredients of a recipe are in the pantry.
 * Returns { matched, total, percent, missing }
 */
export function calcMatchScore(recipe, pantry, includeAlways = true) {
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    return { matched: 0, total: 0, percent: 100, missing: [] }
  }

  const pantryMap = new Map()
  for (const item of pantry) {
    pantryMap.set(item.ingredient_id, item)
  }

  let matched = 0
  let total = 0
  const missing = []

  for (const ing of recipe.ingredients) {
    if (ing.is_optional) continue
    total++

    const inPantry = pantryMap.has(ing.ingredient_id)
    const isAlwaysThere = pantryMap.get(ing.ingredient_id)?.location === 'immer_da'

    if (inPantry || (includeAlways && isAlwaysThere)) {
      matched++
    } else {
      // Check substitutes
      const subFound = (ing.substitutes || []).some(sub => pantryMap.has(sub.substitute_ingredient_id))
      if (subFound) {
        matched++
      } else {
        missing.push(ing)
      }
    }
  }

  const percent = total === 0 ? 100 : Math.round((matched / total) * 100)
  return { matched, total, percent, missing }
}

/**
 * Group recipes by match quality
 */
export function groupByMatch(recipes, pantry) {
  const allDa   = []
  const fastAlles = []
  const mehr    = []

  for (const recipe of recipes) {
    const { percent } = calcMatchScore(recipe, pantry)
    if (percent === 100) allDa.push({ recipe, percent })
    else if (percent >= 70) fastAlles.push({ recipe, percent })
    else mehr.push({ recipe, percent })
  }

  // Sort within groups by prep_time
  const byTime = (a, b) => (a.recipe.prep_time || 99) - (b.recipe.prep_time || 99)
  return {
    allDa:   allDa.sort(byTime),
    fastAlles: fastAlles.sort(byTime),
    mehr:    mehr.sort(byTime),
  }
}
