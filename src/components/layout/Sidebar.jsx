import { Files, LayoutDashboard, Settings, Shield, UserRound, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import BrandMark from '../ui/BrandMark.jsx'
import { useAuth } from '../../auth/useAuth.js'
import { PERMISSIONS } from '../../auth/permissions.js'

const NavItem = ({ to, icon: Icon, children, onClick }) => <NavLink to={to} onClick={onClick} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={19} /><span>{children}</span></NavLink>

export default function Sidebar({ open, onClose }) {
  const { identity, can, signOut } = useAuth()
  return <>
    {open && <button className="sidebar-scrim" aria-label="Close navigation" onClick={onClose} />}
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-brand"><BrandMark /><button className="icon-btn mobile-only" onClick={onClose} aria-label="Close navigation"><X size={20} /></button></div>
      <nav aria-label="Primary navigation">
        <span className="nav-label">Workspace</span>
        <NavItem to="/dashboard" icon={LayoutDashboard} onClick={onClose}>Dashboard</NavItem>
        <NavItem to="/files" icon={Files} onClick={onClose}>My Files</NavItem>
        <span className="nav-label">Account</span>
        <NavItem to="/profile" icon={UserRound} onClick={onClose}>Profile</NavItem>
        <NavItem to="/settings" icon={Settings} onClick={onClose}>Settings</NavItem>
        {can(PERMISSIONS.VIEW_ADMIN) && <><span className="nav-label">Administration</span><NavItem to="/admin" icon={Shield} onClick={onClose}>Admin Overview</NavItem></>}
      </nav>
      <div className="sidebar-user">
        <div className="avatar">{identity.name.slice(0, 2).toUpperCase()}</div>
        <div><strong>{identity.name}</strong><span>{identity.role}</span></div>
        <button className="text-btn" onClick={signOut}>Sign out</button>
      </div>
    </aside>
  </>
}
