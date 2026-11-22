import { Check, Download } from 'lucide-react'
import FileIcon from './FileIcon.jsx'
import FileActionsMenu from './FileActionsMenu.jsx'
import { formatBytes, formatRelativeDate } from '../../utils/formatters.js'

export default function FileCard({ file, selected, onSelect, onPreview, onDownload, onDelete, canDelete, downloading }) {
  return <article className={`file-card ${selected ? 'selected' : ''}`} onClick={onSelect} onDoubleClick={() => onPreview(file)}>
    <div className="file-card-top"><button className={`select-circle ${selected ? 'checked' : ''}`} onClick={(event) => { event.stopPropagation(); onSelect() }} aria-label={`Select ${file.name}`}>{selected && <Check size={13} />}</button><FileActionsMenu file={file} onPreview={onPreview} onDownload={onDownload} onDelete={onDelete} canDelete={canDelete} downloading={downloading} /></div>
    <div className="file-preview"><FileIcon name={file.name} size={36} /><span>{file.name.split('.').pop()?.toUpperCase() || 'FILE'}</span></div>
    <div className="file-card-meta"><div><strong title={file.name}>{file.name}</strong><span>{formatBytes(file.size)} · {formatRelativeDate(file.lastModified)}</span></div><button className="icon-btn" disabled={downloading} onClick={(event) => { event.stopPropagation(); onDownload(file) }} aria-label={`Download ${file.name}`}><Download size={17} /></button></div>
  </article>
}
