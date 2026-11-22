import { Cloud, Files, KeyRound, Server, ShieldCheck, Trash2, UserCog } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { PERMISSIONS } from '../auth/permissions.js'

export default function AdminOverview() {
  const { can } = useAuth()
  if (!can(PERMISSIONS.VIEW_ADMIN)) return <Navigate to="/dashboard" replace />
  return <div className="page narrow-page"><div className="page-title"><div><span className="eyebrow"><ShieldCheck size={15} />Administration</span><h2>Admin overview</h2><p>Verified capabilities available through the current storage API.</p></div></div>
    <div className="admin-notice"><ShieldCheck /><div><strong>Backend authorization remains the security boundary.</strong><span>This page reflects your Admin Cognito group for navigation only.</span></div></div>
    <section className="panel capability-panel"><header><div><h2>Available capabilities</h2><p>Actions supported by the connected Lambda and API Gateway.</p></div></header><div className="capability-grid"><article><Files /><strong>Browse files</strong><span>Paginated folder and file listings</span></article><article><Cloud /><strong>Secure uploads</strong><span>Presigned S3 PUT, up to 100 MB</span></article><article><KeyRound /><strong>Secure downloads</strong><span>Short-lived presigned links</span></article><article><Trash2 /><strong>Admin deletion</strong><span>Typed confirmation for files and folders</span></article><article><Server /><strong>Protected API</strong><span>Cognito access-token authorization</span></article></div></section>
    <section className="panel unavailable-panel"><header><div><h2>Not available in the current backend</h2><p>These controls are intentionally not shown elsewhere in the application.</p></div></header><div className="unavailable-tags"><span>Employee management</span><span>Group changes</span><span>Rename</span><span>Move files</span><span>Audit logs</span><span>Storage analytics</span><span>Sharing</span><span>Version history</span></div><div className="admin-explainer"><UserCog /><p>Adding any of these features requires new, authorized backend endpoints. The frontend does not simulate them.</p></div></section>
  </div>
}
