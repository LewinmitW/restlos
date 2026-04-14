import { createContext, useContext, useReducer, useCallback } from 'react'
import { api } from '../api/client'

const AppContext = createContext(null)

const initialState = {
  pantry: [],
  pantryLoaded: false,
  recipes: [],
  recipesLoaded: false,
  shoppingList: [],
  shoppingLoaded: false,
  weekPlan: null,
  weekPlanLoaded: false,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PANTRY':
      return { ...state, pantry: action.payload, pantryLoaded: true }
    case 'SET_RECIPES':
      return { ...state, recipes: action.payload, recipesLoaded: true }
    case 'SET_SHOPPING':
      return { ...state, shoppingList: action.payload, shoppingLoaded: true }
    case 'SET_WEEK_PLAN':
      return { ...state, weekPlan: action.payload, weekPlanLoaded: true }
    case 'ADD_PANTRY_ITEM':
      return { ...state, pantry: [...state.pantry, action.payload] }
    case 'UPDATE_PANTRY_ITEM':
      return {
        ...state,
        pantry: state.pantry.map(i =>
          i.id === action.payload.id ? { ...i, ...action.payload } : i
        ),
      }
    case 'REMOVE_PANTRY_ITEM':
      return { ...state, pantry: state.pantry.filter(i => i.id !== action.payload) }
    case 'ADD_RECIPE':
      return { ...state, recipes: [action.payload, ...state.recipes] }
    case 'UPDATE_RECIPE':
      return {
        ...state,
        recipes: state.recipes.map(r =>
          r.id === action.payload.id ? { ...r, ...action.payload } : r
        ),
      }
    case 'REMOVE_RECIPE':
      return { ...state, recipes: state.recipes.filter(r => r.id !== action.payload) }
    case 'ADD_SHOPPING_ITEM':
      return { ...state, shoppingList: [...state.shoppingList, action.payload] }
    case 'UPDATE_SHOPPING_ITEM':
      return {
        ...state,
        shoppingList: state.shoppingList.map(i =>
          i.id === action.payload.id ? { ...i, ...action.payload } : i
        ),
      }
    case 'REMOVE_SHOPPING_ITEM':
      return { ...state, shoppingList: state.shoppingList.filter(i => i.id !== action.payload) }
    case 'CLEAR_ALL':
      return initialState
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const loadPantry = useCallback(async (force = false) => {
    if (state.pantryLoaded && !force) return
    try {
      const res = await api('pantry/list.php')
      if (res.success) dispatch({ type: 'SET_PANTRY', payload: res.data })
    } catch (e) {
      console.error('loadPantry', e)
    }
  }, [state.pantryLoaded])

  const loadRecipes = useCallback(async (force = false) => {
    if (state.recipesLoaded && !force) return
    try {
      const res = await api('recipes/list.php')
      if (res.success) dispatch({ type: 'SET_RECIPES', payload: res.data })
    } catch (e) {
      console.error('loadRecipes', e)
    }
  }, [state.recipesLoaded])

  const loadShopping = useCallback(async (force = false) => {
    if (state.shoppingLoaded && !force) return
    try {
      const res = await api('shopping/list.php')
      if (res.success) dispatch({ type: 'SET_SHOPPING', payload: res.data })
    } catch (e) {
      console.error('loadShopping', e)
    }
  }, [state.shoppingLoaded])

  const loadWeekPlan = useCallback(async (force = false) => {
    if (state.weekPlanLoaded && !force) return
    try {
      const res = await api('planner/get.php')
      if (res.success) dispatch({ type: 'SET_WEEK_PLAN', payload: res.data })
    } catch (e) {
      console.error('loadWeekPlan', e)
    }
  }, [state.weekPlanLoaded])

  const clearAll = () => dispatch({ type: 'CLEAR_ALL' })

  return (
    <AppContext.Provider
      value={{
        ...state,
        dispatch,
        loadPantry,
        loadRecipes,
        loadShopping,
        loadWeekPlan,
        clearAll,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
