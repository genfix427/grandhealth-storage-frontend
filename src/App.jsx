import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import AppLayout from './components/layout/AppLayout.jsx'

const Login = lazy(() => import('./pages/Login.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const MyFiles = lazy(() => import('./pages/MyFiles.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))
const AdminOverview = lazy(() => import('./pages/AdminOverview.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

const Fallback = () => <div className="route-loading"><span /><span /><span /></div>

export default function App() {
  return <Suspense fallback={<Fallback />}><Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/files" element={<MyFiles />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<AdminOverview />} />
      </Route>
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes></Suspense>
}
