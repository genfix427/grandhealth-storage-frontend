import { CircleAlert, RefreshCw } from 'lucide-react'
import Button from './Button.jsx'

export default function ErrorState({ title = 'We could not load this content', message, requestId, onRetry }) {
  return <div className="error-state"><CircleAlert size={28} /><h3>{title}</h3><p>{message || 'Please try again in a moment.'}</p>{requestId && <small className="error-reference">AWS request reference: {requestId}</small>}{onRetry && <Button variant="secondary" onClick={onRetry}><RefreshCw size={16} />Try again</Button>}</div>
}
