import { Check, Clipboard, Download, Eye, FileSearch, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import Button from '../ui/Button.jsx'
import FileIcon from './FileIcon.jsx'
import { formatBytes, formatDate } from '../../utils/formatters.js'
import { getTypeLabel } from '../../utils/fileTypes.js'

export default function FileDetailsPanel({ file, onClose, onPreview, onDownload, onDelete, canDelete, downloading }) {
  if (!file) return null
  const copy = async (value, label) => { await navigator.clipboard.writeText(value); toast.success(`${label} copied`) }
  return <aside className="details-panel">
    <header><div><span>File details</span><h2>{file.name}</h2></div><button className="icon-btn" onClick={onClose} aria-label="Close details"><X size={19} /></button></header>
    <button className="details-preview" onClick={() => onPreview(file)}><FileIcon name={file.name} size={42} /><FileSearch size={24} /><span>Open a secure, short-lived preview of this file.</span></button>
    <dl><div><dt>Type</dt><dd>{getTypeLabel(file.name)}</dd></div><div><dt>Size</dt><dd>{formatBytes(file.size)}</dd></div><div><dt>Last modified</dt><dd>{formatDate(file.lastModified)}</dd></div><div><dt>Object key</dt><dd className="object-key">{file.key}</dd></div></dl>
    <div className="details-actions"><Button onClick={() => onPreview(file)}><Eye size={17} />Preview</Button><Button variant="secondary" onClick={() => onDownload(file)} loading={downloading}><Download size={17} />Download</Button><Button variant="secondary" onClick={() => copy(file.name, 'Filename')}><Clipboard size={16} />Copy filename</Button><Button variant="secondary" onClick={() => copy(file.key, 'Object key')}><Check size={16} />Copy object key</Button>{canDelete && <Button variant="danger-soft" onClick={() => onDelete(file)}><Trash2 size={17} />Delete file</Button>}</div>
  </aside>
}
