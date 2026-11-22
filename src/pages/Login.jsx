import { CheckCircle2, KeyRound, LoaderCircle, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import BrandMark from '../components/ui/BrandMark.jsx'
import Button from '../components/ui/Button.jsx'

export default function Login() {
  const { isAuthenticated, status, signIn, error, configurationErrors } = useAuth()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  const loading = status === 'loading'
  return <main className="login-page">
    <section className="login-story">
      <BrandMark />
      <div className="story-copy"><span className="eyebrow"><ShieldCheck size={15} />Private company workspace</span><h1>Your company files.<br /><em>Protected, organized, ready.</em></h1><p>Grand Health Storage gives your team one secure place for the documents that keep work moving.</p><div className="security-list"><span><CheckCircle2 />Private AWS storage</span><span><CheckCircle2 />Temporary secure downloads</span><span><CheckCircle2 />Role-based access</span></div></div>
      <div className="login-visual" aria-hidden="true"><div className="vault-ring ring-one" /><div className="vault-ring ring-two" /><div className="vault-core"><LockKeyhole size={34} /><span>Encrypted<br />workspace</span></div><div className="floating-file file-a">PDF</div><div className="floating-file file-b">DOC</div><div className="floating-file file-c">XLS</div></div>
      <p className="login-footer">Grand Health Institute · Authorized access only</p>
    </section>
    <section className="login-panel"><div className="login-card"><div className="mobile-login-brand"><BrandMark /></div><span className="login-icon"><KeyRound size={22} /></span><h2>Welcome back</h2><p>Sign in through Grand Health’s secure authentication system to continue.</p>
      {configurationErrors.length > 0 && <div className="config-alert" role="alert"><strong>Configuration needed</strong>{configurationErrors.map((message) => <span key={message}>{message}</span>)}<small>Add the real Cognito hosted UI domain to your local <code>.env</code> file.</small></div>}
      {error && <div className="inline-error" role="alert">{String(error?.error || error?.message || '').includes('invalid_scope') ? 'Cognito rejected the configured OAuth scopes. Use scopes enabled on the app client.' : 'Sign-in could not be completed. Please try again.'}</div>}
      <Button className="signin-btn" onClick={signIn} disabled={configurationErrors.length > 0} loading={loading}>{loading ? 'Connecting securely…' : 'Sign in with Grand Health'}</Button>
      <div className="login-assurance"><LockKeyhole size={15} /><span>Your password and authenticator codes are handled by AWS Cognito and are never visible to this application.</span></div>
    </div></section>
  </main>
}
