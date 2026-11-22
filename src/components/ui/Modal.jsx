import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, description, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined
    const close = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', close)
    document.body.classList.add('modal-open')
    return () => { document.removeEventListener('keydown', close); document.body.classList.remove('modal-open') }
  }, [open, onClose])
  if (!open) return null
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header className="modal-header">
        <div><h2 id="modal-title">{title}</h2>{description && <p>{description}</p>}</div>
        <button className="icon-btn" onClick={onClose} aria-label="Close dialog"><X size={20} /></button>
      </header>
      {children}
    </section>
  </div>
}
