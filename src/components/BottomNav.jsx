import { NavLink } from 'react-router-dom'
import { CalendarDays, Package, ShoppingCart, BookOpen } from 'lucide-react'

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/woche" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <CalendarDays />
        <span className="nav-label">Woche</span>
      </NavLink>

      <NavLink to="/vorrat" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Package />
        <span className="nav-label">Vorrat</span>
      </NavLink>

      <NavLink to="/liste" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <ShoppingCart />
        <span className="nav-label">Liste</span>
      </NavLink>

      <NavLink to="/rezepte" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <BookOpen />
        <span className="nav-label">Rezepte</span>
      </NavLink>
    </nav>
  )
}
