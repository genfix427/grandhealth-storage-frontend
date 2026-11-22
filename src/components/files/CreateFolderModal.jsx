import { useState } from 'react'
import { FolderPlus } from 'lucide-react'
import { toast } from 'sonner'
import { createFolder } from '../../api/createFolder.js'
import { validateFolderName } from '../../utils/validators.js'
import Button from '../ui/Button.jsx'
import Modal from '../ui/Modal.jsx'

export default function CreateFolderModal({ open, onClose, parentFolder, filesApi, onComplete }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  const resetAndClose = () => {
    if (creating) return
    setName('')
    setError('')
    onClose()
  }

  const submit = async (event) => {
    event.preventDefault()
    const validationError = validateFolderName(name)
    if (validationError) { setError(validationError); return }
    setCreating(true)
    setError('')
    try {
      await createFolder(filesApi, parentFolder, name)
      toast.success(`Folder “${name}” created`)
      await onComplete()
      setName('')
      onClose()
    } catch (cause) {
      setError(cause?.status === 403 ? 'You do not have permission to create folders here.' : cause?.message || 'Folder creation failed. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  return <Modal open={open} onClose={resetAndClose} title="Create folder" description={`Create a private folder inside ${parentFolder || 'My Files'}.`}>
    <form onSubmit={submit}>
      <div className="create-folder-body">
        <label htmlFor="folder-name">Folder name</label>
        <div className={`folder-name-control ${error ? 'invalid' : ''}`}><FolderPlus size={19} /><input id="folder-name" autoFocus value={name} maxLength={100} onChange={(event) => { setName(event.target.value); if (error) setError('') }} placeholder="e.g. Professional Portfolio" aria-describedby={error ? 'folder-name-error' : 'folder-name-help'} aria-invalid={Boolean(error)} /></div>
        {error ? <small id="folder-name-error" className="field-error" role="alert">{error}</small> : <small id="folder-name-help">Spaces are allowed. Folder names cannot contain path characters such as / or \.</small>}
      </div>
      <footer className="modal-footer"><Button variant="ghost" onClick={resetAndClose} disabled={creating}>Cancel</Button><Button type="submit" loading={creating} disabled={!name.trim()}><FolderPlus size={17} />Create folder</Button></footer>
    </form>
  </Modal>
}
