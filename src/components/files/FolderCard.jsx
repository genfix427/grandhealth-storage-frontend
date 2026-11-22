import { Folder, Trash2 } from 'lucide-react'

export default function FolderCard({ folder, onOpen, onDelete, canDelete }) {
  const name = folder.split('/').filter(Boolean).pop()
  return <article className="folder-card">
    <button className="folder-card-open" onDoubleClick={onOpen} onClick={onOpen} aria-label={`Open folder ${name}`}><span className="folder-icon"><Folder size={23} fill="currentColor" /></span><span><strong>{name}</strong><small>Folder</small></span></button>
    {canDelete && <button className="icon-btn folder-delete" onClick={() => onDelete(folder, name)} aria-label={`Delete folder ${name}`} title={`Delete ${name}`}><Trash2 size={17} /></button>}
  </article>
}
