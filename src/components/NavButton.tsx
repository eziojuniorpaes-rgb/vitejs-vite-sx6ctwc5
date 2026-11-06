import { NavLink } from 'react-router-dom'

interface Props { to: string; icon: string; label: string }

export function NavButton({ to, icon, label }: Props) {
  return <NavLink to={to} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
    <span>{icon}</span><small>{label}</small>
  </NavLink>
}
