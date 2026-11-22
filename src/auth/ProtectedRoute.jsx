import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from './useAuth.js'

export default function ProtectedRoute() {
  const { status, isAuthenticated } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <div className="app-loading"><LoaderCircle className="spin" /><span>Opening your secure workspace…</span></div>
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}
