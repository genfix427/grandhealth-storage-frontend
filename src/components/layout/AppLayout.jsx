import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'

export default function AppLayout() {
  const [navOpen, setNavOpen] = useState(false)
  return <div className="app-shell"><Sidebar open={navOpen} onClose={() => setNavOpen(false)} /><div className="app-column"><Header onMenu={() => setNavOpen(true)} /><main className="main-content"><Outlet /></main></div></div>
}
