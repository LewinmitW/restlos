import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import BottomNav from './components/BottomNav'

// Lazy-load pages
const WeekPlanner  = lazy(() => import('./pages/WeekPlanner'))
const QuickCook    = lazy(() => import('./pages/QuickCook'))
const Pantry       = lazy(() => import('./pages/Pantry'))
const ShoppingList = lazy(() => import('./pages/ShoppingList'))
const Recipes      = lazy(() => import('./pages/Recipes'))
const RecipeDetail = lazy(() => import('./pages/RecipeDetail'))
const RecipeForm   = lazy(() => import('./pages/RecipeForm'))
const Login        = lazy(() => import('./pages/Login'))
const Register     = lazy(() => import('./pages/Register'))

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="spinner" />
    </div>
  )
}

function AppShell() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />

  if (!user) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/login"     element={<Login />} />
          <Route path="/register"  element={<Register />} />
          <Route path="*"          element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <div className="app-container">
      <div className="page-content">
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/"               element={<Navigate to="/woche" replace />} />
            <Route path="/woche"          element={<WeekPlanner />} />
            <Route path="/woche/jetzt"    element={<QuickCook />} />
            <Route path="/vorrat"         element={<Pantry />} />
            <Route path="/liste"          element={<ShoppingList />} />
            <Route path="/rezepte"        element={<Recipes />} />
            <Route path="/rezept/:id"     element={<RecipeDetail />} />
            <Route path="/rezept/neu"     element={<RecipeForm />} />
            <Route path="/rezept/:id/edit" element={<RecipeForm />} />
            <Route path="*"              element={<Navigate to="/woche" replace />} />
          </Routes>
        </Suspense>
      </div>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppShell />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
