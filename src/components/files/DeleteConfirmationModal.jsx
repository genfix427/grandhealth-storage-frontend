import { useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import Button from '../ui/Button.jsx'
import Modal from '../ui/Modal.jsx'

export default function DeleteConfirmationModal({ target, deleting, onClose, onConfirm }) {
  const [confirmation, setConfirmation] = useState('')
  if (!target) return null
  const isFolder = target.type === 'folder'
  const close = () => {
    if (deleting) return
    setConfirmation('')
    onClose()
  }
  const submit = async (event) => {
    event.preventDefault()
    if (confirmation !== 'delete' || deleting) return
    await onConfirm()
    setConfirmation('')
  }
  return <Modal open onClose={close} title={`Delete ${isFolder ? 'folder' : 'file'}?`} description="This action is permanent and cannot be undone.">
    <form onSubmit={submit}>
      <div className="delete-confirm-body">
        <span className="delete-warning-icon"><AlertTriangle size={24} /></span>
        <div><strong>{target.name}</strong><p>{isFolder ? 'The folder and every file and subfolder inside it will be permanently deleted.' : 'This file will be permanently removed from private storage.'}</p></div>
        <label htmlFor="delete-confirmation">Type <b>delete</b> to confirm</label>
        <input id="delete-confirmation" autoFocus autoComplete="off" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="delete" aria-describedby="delete-confirm-help" />
        <small id="delete-confirm-help">Only Grand Health administrators can complete this action.</small>
      </div>
      <footer className="modal-footer"><Button variant="ghost" onClick={close} disabled={deleting}>Cancel</Button><Button type="submit" variant="danger" loading={deleting} disabled={confirmation !== 'delete'}><Trash2 size={17} />Delete permanently</Button></footer>
    </form>
  </Modal>
}
