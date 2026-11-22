import { Bell, Menu, Search } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth.js'

const titles = { '/dashboard': 'Dashboard', '/files': 'My Files', '/profile': 'Profile', '/settings': 'Settings', '/admin': 'Admin Overview' }

export default function Header({ onMenu }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { identity } = useAuth()
  return <header className="topbar">
    <div className="topbar-title"><button className="icon-btn mobile-only" onClick={onMenu} aria-label="Open navigation"><Menu /></button><div><span>Secure Cloud Workspace</span><h1>{titles[pathname] || 'Grand Health Storage'}</h1></div></div>
    <div className="topbar-actions">
      <button className="global-search" onClick={() => navigate('/files')}><Search size={18} /><span>Find loaded files</span><kbd>⌘ K</kbd></button>
      <button className="icon-btn" aria-label="Notifications"><Bell size={19} /></button>
      <button className="header-profile" onClick={() => navigate('/profile')}><span className="avatar small">{identity.name.slice(0, 2).toUpperCase()}</span><span>{identity.name.split(' ')[0]}</span></button>
    </div>
  </header>
}
