import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext } from './useAuth.js'
import ProtectedRoute from './ProtectedRoute.jsx'

function renderRoute(auth) {
  render(<AuthContext.Provider value={auth}><MemoryRouter initialEntries={['/private']}><Routes><Route path="/login" element={<div>Login page</div>} /><Route element={<ProtectedRoute />}><Route path="/private" element={<div>Private files</div>} /></Route></Routes></MemoryRouter></AuthContext.Provider>)
}

describe('protected routes', () => {
  it('redirects unauthenticated visitors', () => { renderRoute({ status: 'unauthenticated', isAuthenticated: false }); expect(screen.getByText('Login page')).toBeInTheDocument() })
  it('renders protected content for a valid session', () => { renderRoute({ status: 'authenticated', isAuthenticated: true }); expect(screen.getByText('Private files')).toBeInTheDocument() })
})
