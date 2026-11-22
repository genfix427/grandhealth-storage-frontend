import { useCallback, useRef, useState } from 'react'
import { CheckCircle2, CircleAlert, CloudUpload, File, RotateCcw, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import { formatBytes } from '../../utils/formatters.js'
import { validateUploadFile } from '../../utils/validators.js'

function uploadToS3(url, file, onProgress, onRegister) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    onRegister(xhr)
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', 'application/octet-stream')
    xhr.upload.onprogress = (event) => event.lengthComputable && onProgress(Math.round((event.loaded / event.total) * 100))
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('S3_UPLOAD_FAILED'))
    xhr.onerror = () => reject(new Error('NETWORK_ERROR'))
    xhr.onabort = () => reject(new DOMException('Upload cancelled', 'AbortError'))
    xhr.send(file)
  })
}

export default function UploadManager({ open, onClose, folder, filesApi, onComplete }) {
  const [items, setItems] = useState([])
  const [dragging, setDragging] = useState(false)
  const controllers = useRef(new Map())
  const inputRef = useRef(null)
  const patchItem = (id, patch) => setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item))
  const renameItem = (id, name) => setItems((current) => current.map((item) => {
    if (item.id !== id) return item
    const error = validateUploadFile({ name, size: item.file.size })
    return { ...item, name, error, status: error ? 'invalid' : 'ready' }
  }))

  const addFiles = useCallback((selected) => {
    const next = [...selected].map((file) => ({ id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`, file, name: file.name, progress: 0, status: validateUploadFile(file) ? 'invalid' : 'ready', error: validateUploadFile(file) }))
    setItems((current) => [...current, ...next])
  }, [])

  const uploadOne = async (item) => {
    patchItem(item.id, { status: 'preparing', error: null, progress: 0 })
    try {
      const response = await filesApi.createUploadUrl({ filename: item.name, folder, size: item.file.size })
      await uploadToS3(response.url, item.file, (progress) => patchItem(item.id, { status: 'uploading', progress }), (xhr) => controllers.current.set(item.id, xhr))
      controllers.current.delete(item.id)
      patchItem(item.id, { status: 'complete', progress: 100, key: response.key })
      return true
    } catch (error) {
      controllers.current.delete(item.id)
      if (error?.name === 'AbortError') patchItem(item.id, { status: 'cancelled', error: 'Upload cancelled.' })
      else patchItem(item.id, { status: 'failed', error: 'File upload failed. Please try again.' })
      return false
    }
  }

  const uploadAll = async () => {
    const pending = items.filter((item) => ['ready', 'failed', 'cancelled'].includes(item.status) && !item.error?.includes('Use only') && !item.error?.includes('larger'))
    if (!pending.length) return
    const results = await Promise.all(pending.map(uploadOne))
    const successful = results.filter(Boolean).length
    if (successful) { toast.success(`${successful} ${successful === 1 ? 'file' : 'files'} uploaded securely`); onComplete() }
  }

  const active = items.some((item) => ['preparing', 'uploading'].includes(item.status))
  const resetAndClose = () => { if (active) return; setItems([]); onClose() }
  return <Modal open={open} onClose={resetAndClose} title="Upload files" description={`Files will be added to ${folder || 'My Files'}. Maximum 100 MB per file.`} size="lg">
    <div className="upload-body">
      <div className={`dropzone ${dragging ? 'dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files) }}>
        <CloudUpload size={30} /><strong>Drop files here to upload</strong><span>or choose files from your computer</span><Button variant="secondary" onClick={() => inputRef.current?.click()}>Choose files</Button><input ref={inputRef} type="file" multiple hidden onChange={(event) => { addFiles(event.target.files); event.target.value = '' }} />
      </div>
      {items.length > 0 && <div className="upload-list">{items.map((item) => <div className="upload-item" key={item.id}>
        <span className="upload-file-icon"><File size={20} /></span><div className="upload-info"><div>{item.status === 'invalid' ? <input className="upload-name-input" value={item.name} onChange={(event) => renameItem(item.id, event.target.value)} aria-label={`Rename ${item.name}`} /> : <strong>{item.name}</strong>}<span>{formatBytes(item.file.size)}</span></div><div className="progress-track"><span style={{ width: `${item.progress}%` }} /></div><small className={`status-${item.status}`}>{item.error || ({ ready: 'Ready to upload', preparing: 'Preparing secure upload…', uploading: `${item.progress}% uploaded`, complete: 'Upload complete', failed: 'Upload failed', cancelled: 'Cancelled', invalid: 'Needs attention' }[item.status])}</small></div>
        {item.status === 'complete' ? <CheckCircle2 className="success-icon" size={20} /> : item.status === 'invalid' ? <CircleAlert className="danger-icon" size={20} /> : ['failed', 'cancelled'].includes(item.status) ? <button className="icon-btn" onClick={() => uploadOne(item)} aria-label="Retry upload"><RotateCcw size={17} /></button> : item.status === 'uploading' ? <button className="icon-btn" onClick={() => controllers.current.get(item.id)?.abort()} aria-label="Cancel upload"><X size={17} /></button> : <button className="icon-btn" onClick={() => setItems((current) => current.filter(({ id }) => id !== item.id))} aria-label="Remove file"><Trash2 size={17} /></button>}
      </div>)}</div>}
    </div>
    <footer className="modal-footer"><Button variant="ghost" onClick={resetAndClose} disabled={active}>Close</Button><Button onClick={uploadAll} disabled={!items.some((item) => ['ready', 'failed', 'cancelled'].includes(item.status)) || active} loading={active}><CloudUpload size={17} />Upload {items.filter((item) => item.status === 'ready').length || ''} files</Button></footer>
  </Modal>
}
