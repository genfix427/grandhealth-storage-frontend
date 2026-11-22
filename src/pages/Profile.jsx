import { AtSign, Fingerprint, KeyRound, LogOut, ShieldCheck, UserRound } from 'lucide-react'
import { useAuth } from '../auth/useAuth.js'
import Button from '../components/ui/Button.jsx'

export default function Profile() {
  const { identity, user, signOut } = useAuth()
  const issued = user?.profile?.auth_time ? new Date(user.profile.auth_time * 1000).toLocaleString() : 'Current browser session'
  return <div className="page narrow-page"><div className="page-title"><div><span className="eyebrow"><UserRound size={15} />Account</span><h2>Your profile</h2><p>Identity information supplied by Grand Health authentication.</p></div></div>
    <section className="profile-hero panel"><div className="avatar jumbo">{identity.name.slice(0, 2).toUpperCase()}</div><div><h2>{identity.name}</h2><p>{identity.email}</p><span className="role-badge"><ShieldCheck size={14} />{identity.role}</span></div></section>
    <section className="panel info-panel"><header><div><h2>Identity details</h2><p>These values are read-only in this workspace.</p></div></header><dl className="info-list"><div><dt><UserRound />Display name</dt><dd>{identity.name}</dd></div><div><dt><AtSign />Email address</dt><dd>{identity.email}</dd></div><div><dt><Fingerprint />Username</dt><dd>{identity.username}</dd></div><div><dt><ShieldCheck />Cognito group</dt><dd>{identity.groups.join(', ') || 'No recognized group (ReadOnly applied)'}</dd></div><div><dt><KeyRound />Authentication provider</dt><dd>AWS Cognito · OAuth 2.0 PKCE</dd></div><div><dt><KeyRound />Session started</dt><dd>{issued}</dd></div></dl></section>
    <section className="panel account-security"><span><ShieldCheck size={24} /></span><div><h2>Account security is centrally managed</h2><p>Password, MFA, and recovery settings are managed through Grand Health’s authentication system. Contact your administrator if account details need to change.</p></div></section>
    <Button variant="danger-soft" onClick={signOut}><LogOut size={17} />Sign out of this device</Button>
  </div>
}
