import { CircleAlert, Download, RefreshCw } from 'lucide-react'
import Button from '../ui/Button.jsx'

export default function PreviewError({ message, onRetry, onDownload }) {
  return <div className="preview-message preview-error"><CircleAlert size={32} /><strong>Preview unavailable</strong><span>{message}</span><div>{onRetry && <Button variant="secondary" onClick={onRetry}><RefreshCw size={16} />Retry preview</Button>}<Button variant="secondary" onClick={onDownload}><Download size={16} />Download original</Button></div></div>
}
