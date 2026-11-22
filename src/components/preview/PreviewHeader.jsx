import { Download, X } from 'lucide-react'
import FileIcon from '../files/FileIcon.jsx'
import { formatBytes, formatDate } from '../../utils/formatters.js'

export default function PreviewHeader({ file, onDownload, onClose }) {
  return <header className="preview-header"><div className="preview-file-meta"><FileIcon name={file.name} /><div><strong title={file.name}>{file.name}</strong><span>{formatBytes(file.size)} · {formatDate(file.lastModified)}</span></div></div><div><button onClick={() => onDownload(file)} title="Download original"><Download size={19} /><span>Download</span></button><button onClick={onClose} aria-label="Close preview" title="Close preview"><X size={22} /></button></div></header>
}
