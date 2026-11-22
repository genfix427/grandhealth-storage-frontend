import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Download, Eye, MoreHorizontal, Trash2 } from 'lucide-react'

const MENU_WIDTH = 160
const MENU_GAP = 6

export default function FileActionsMenu({ file, onPreview, onDownload, onDelete, canDelete, downloading }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  const updatePosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    const menuHeight = menuRef.current?.offsetHeight || (canDelete ? 128 : 88)
    const below = rect.bottom + MENU_GAP
    const top = below + menuHeight <= window.innerHeight - 8 ? below : Math.max(8, rect.top - menuHeight - MENU_GAP)
    const left = Math.max(8, Math.min(window.innerWidth - MENU_WIDTH - 8, rect.right - MENU_WIDTH))
    setPosition({ top, left })
  }, [canDelete])

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (event.key === 'Escape') { setOpen(false); return }
      if (event.type === 'pointerdown' && !buttonRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false)
    }
    const reposition = () => updatePosition()
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', close)
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [open, updatePosition])

  const act = (callback) => (event) => {
    event.stopPropagation()
    setOpen(false)
    callback(file)
  }

  return <div className="file-actions-menu" onClick={(event) => event.stopPropagation()}>
    <button ref={buttonRef} className="icon-btn" onClick={(event) => { event.stopPropagation(); if (!open) updatePosition(); setOpen((value) => !value) }} aria-haspopup="menu" aria-expanded={open} aria-label={`Actions for ${file.name}`}><MoreHorizontal size={18} /></button>
    {open && createPortal(<div ref={menuRef} className="file-actions-popover" role="menu" style={position}><button role="menuitem" onClick={act(onPreview)}><Eye size={16} />Preview</button><button role="menuitem" disabled={downloading} onClick={act(onDownload)}><Download size={16} />Download</button>{canDelete && <button className="danger-menu-item" role="menuitem" onClick={act(onDelete)}><Trash2 size={16} />Delete</button>}</div>, document.body)}
  </div>
}
