import { ExternalLink, FileQuestion } from 'lucide-react'
import { env } from '../../config/env.js'
import Button from '../ui/Button.jsx'

export default function GoogleWorkspacePreview({ file }) {
  const allowedLink = env.googleWorkspaceEnabled && /^https:\/\/(docs|drive)\.google\.com\//i.test(file.webViewLink || '')
  return <div className="unsupported-preview"><span><FileQuestion size={38} /></span><h2>Google Workspace integration</h2><p>{allowedLink ? 'Open this document in Google Workspace. Access remains controlled by its Google sharing permissions.' : 'Google Workspace is not configured for this deployment. It requires separate Google OAuth, read-only scopes, and backend token storage; AWS Cognito credentials are never reused.'}</p>{allowedLink && <Button variant="secondary" onClick={() => window.open(file.webViewLink, '_blank', 'noopener,noreferrer')}><ExternalLink size={17} />Open in Google Workspace</Button>}</div>
}
