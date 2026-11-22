import { Download, Eye, LockKeyhole, LogOut, MonitorCog, Palette, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../auth/useAuth.js'
import ThemeToggle from '../components/ui/ThemeToggle.jsx'
import Button from '../components/ui/Button.jsx'

export default function Settings() {
  const { identity, signOut } = useAuth()
  const [view, setView] = useState(() => localStorage.getItem('ghs-file-view') || 'grid')
  const [sort, setSort] = useState(() => localStorage.getItem('ghs-file-sort') || 'newest')
  const updateView = (value) => { setView(value); localStorage.setItem('ghs-file-view', value) }
  const updateSort = (value) => { setSort(value); localStorage.setItem('ghs-file-sort', value) }
  return <div className="page narrow-page"><div className="page-title"><div><span className="eyebrow"><MonitorCog size={15} />Preferences</span><h2>Settings</h2><p>Customize how your secure workspace looks and behaves on this device.</p></div></div>
    <section className="settings-section panel"><header><span className="settings-icon"><Palette /></span><div><h2>Appearance</h2><p>Choose a theme for this browser.</p></div></header><ThemeToggle /></section>
    <section className="settings-section panel"><header><span className="settings-icon"><Eye /></span><div><h2>File preferences</h2><p>Defaults used when you open My Files.</p></div></header><div className="form-grid"><label><span>Default view</span><select value={view} onChange={(event) => updateView(event.target.value)}><option value="grid">Grid view</option><option value="list">List view</option></select></label><label><span>Default sorting</span><select value={sort} onChange={(event) => updateSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option><option value="largest">Largest first</option><option value="smallest">Smallest first</option></select></label></div></section>
    <section className="settings-section panel"><header><span className="settings-icon"><ShieldCheck /></span><div><h2>Security</h2><p>How Grand Health Storage protects access.</p></div></header><div className="security-cards"><article><LockKeyhole /><div><strong>Secure authentication</strong><span>Authorization Code Flow with PKCE. MFA availability is managed by Cognito and may vary by account.</span></div></article><article><ShieldCheck /><div><strong>Private file storage</strong><span>Files are stored privately in S3 and accessed only through the authorized API.</span></div></article><article><Download /><div><strong>Temporary downloads</strong><span>Download links expire quickly and are not stored by this application.</span></div></article></div></section>
    <section className="settings-section panel"><header><span className="settings-icon"><LogOut /></span><div><h2>Account</h2><p>Signed in as {identity.email} with the {identity.role} role.</p></div></header><Button variant="danger-soft" onClick={signOut}><LogOut size={17} />Sign out</Button></section>
  </div>
}
