/* eslint-disable react-hooks/incompatible-library -- TanStack Virtual is intentionally used for large editable worksheets. */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { AlertTriangle, CheckCircle2, Download, FilePenLine, Save, Upload, X } from 'lucide-react'
import Button from '../ui/Button.jsx'
import { formatBytes } from '../../utils/formatters.js'
import { getFileExtension } from '../../utils/fileTypes.js'
import { MAX_FILE_SIZE } from '../../utils/validators.js'
import { columnLabel, fetchPreviewBuffer, previewErrorMessage } from '../../utils/previewHelpers.js'
import { PREVIEW_KINDS, PREVIEW_LIMITS } from '../../utils/previewTypes.js'
import { canEditInBrowser, editedCopyName, folderFromObjectKey, hasMatchingExtension, textMimeType } from '../../utils/fileEditing.js'
import PreviewLoading from './PreviewLoading.jsx'
import '@raazkhnl/rk-editor-ui/styles.css'

const CELL_WIDTH = 160

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function SheetEditorGrid({ rows, search, onChange }) {
  const viewportRef = useRef(null)
  const visibleRows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return rows.map((row, index) => ({ row, index })).filter(({ row }) => !needle || row.some((cell) => String(cell ?? '').toLowerCase().includes(needle)))
  }, [rows, search])
  const columns = Math.min(200, Math.max(1, rows.reduce((maximum, row) => Math.max(maximum, row.length), 0)))
  const virtualizer = useVirtualizer({ count: visibleRows.length, getScrollElement: () => viewportRef.current, estimateSize: () => 39, overscan: 12, useFlushSync: false })

  return <div className="file-editor-sheet-viewport" ref={viewportRef}>
    <div className="file-editor-sheet-header" style={{ width: 54 + columns * CELL_WIDTH }}><span>#</span>{Array.from({ length: columns }, (_, index) => <b key={index}>{columnLabel(index)}</b>)}</div>
    <div className="file-editor-sheet-virtual" style={{ height: virtualizer.getTotalSize(), width: 54 + columns * CELL_WIDTH }}>
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const item = visibleRows[virtualRow.index]
        return <div className="file-editor-sheet-row" key={item.index} style={{ transform: `translateY(${virtualRow.start}px)`, height: virtualRow.size, width: 54 + columns * CELL_WIDTH }}>
          <span>{item.index + 1}</span>
          {Array.from({ length: columns }, (_, column) => <input key={column} value={String(item.row[column] ?? '')} onChange={(event) => onChange(item.index, column, event.target.value)} aria-label={`Row ${item.index + 1}, column ${columnLabel(column)}`} />)}
        </div>
      })}
    </div>
  </div>
}

export default function FileEditorModal({ file, kind, url, signal, filesApi, onClose, onDownload, onSaved }) {
  const inputRef = useRef(null)
  const wordContainerRef = useRef(null)
  const wordShellRef = useRef(null)
  const direct = canEditInBrowser(kind) && Boolean(url)
  const [status, setStatus] = useState(direct ? 'loading' : 'ready')
  const [error, setError] = useState('')
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedName, setSavedName] = useState('')
  const [text, setText] = useState('')
  const [originalText, setOriginalText] = useState('')
  const [sheetState, setSheetState] = useState(null)
  const [sheetName, setSheetName] = useState('')
  const [sheetSearch, setSheetSearch] = useState('')
  const [revisedFile, setRevisedFile] = useState(null)

  useEffect(() => {
    if (!direct) return undefined
    let active = true
    ;(async () => {
      setStatus('loading')
      setError('')
      try {
        if (kind === PREVIEW_KINDS.TEXT) {
          const buffer = await fetchPreviewBuffer(url, { signal, maxBytes: PREVIEW_LIMITS.text, expectedBytes: Number(file.size) })
          if (!active) return
          const value = new TextDecoder('utf-8', { fatal: false }).decode(buffer)
          setText(value)
          setOriginalText(value)
        } else if (kind === PREVIEW_KINDS.SPREADSHEET) {
          const [buffer, XLSX] = await Promise.all([
            fetchPreviewBuffer(url, { signal, maxBytes: PREVIEW_LIMITS.spreadsheet, expectedBytes: Number(file.size) }),
            import('xlsx'),
          ])
          if (!active) return
          const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, cellFormula: true, cellStyles: true })
          const rows = Object.fromEntries(workbook.SheetNames.map((name) => [name, XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, raw: false, defval: '', blankrows: true })]))
          setSheetState({ XLSX, workbook, rows })
          setSheetName(workbook.SheetNames[0] || '')
        } else if (kind === PREVIEW_KINDS.DOCX) {
          const [buffer, { EditorShell }] = await Promise.all([
            fetchPreviewBuffer(url, { signal, maxBytes: PREVIEW_LIMITS.docx, expectedBytes: Number(file.size) }),
            import('@raazkhnl/rk-editor-ui'),
          ])
          if (!active || !wordContainerRef.current) return
          let importing = true
          const shell = new EditorShell({
            container: wordContainerRef.current,
            initialContent: '<p></p>',
            theme: 'light',
            outline: false,
            propertyPanel: false,
            trackAuthor: 'Grand Health user',
            onUpdate: () => {
              if (!importing && active) {
                setDirty(true)
                setSavedName('')
              }
            },
          })
          wordShellRef.current = shell
          await shell.editor.importDocx(new File([buffer], file.name, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }))
          importing = false
        }
        setStatus('ready')
      } catch (cause) {
        if (cause?.name !== 'AbortError' && active) {
          setError(previewErrorMessage(cause))
          setStatus('error')
        }
      }
    })()
    return () => {
      active = false
      wordShellRef.current?.destroy()
      wordShellRef.current = null
    }
  }, [direct, file.name, file.size, kind, signal, url])

  const requestClose = () => {
    if (dirty && !window.confirm('Discard your unsaved changes?')) return
    onClose()
  }

  useEffect(() => {
    const keydown = (event) => {
      if (event.key === 'Escape') { event.stopImmediatePropagation(); requestClose() }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault() }
    }
    document.addEventListener('keydown', keydown, true)
    return () => document.removeEventListener('keydown', keydown, true)
  })

  const updateCell = (row, column, value) => {
    setSheetState((current) => {
      const nextRows = { ...current.rows, [sheetName]: current.rows[sheetName].map((cells, index) => index === row ? Object.assign([...cells], { [column]: value }) : cells) }
      const address = current.XLSX.utils.encode_cell({ r: row, c: column })
      const worksheet = current.workbook.Sheets[sheetName]
      const previous = worksheet[address] || {}
      worksheet[address] = { ...previous, t: 's', v: value, w: value }
      delete worksheet[address].f
      return { ...current, rows: nextRows }
    })
    setDirty(true)
    setSavedName('')
  }

  const validateText = () => {
    if (getFileExtension(file.name) !== 'json') return true
    try { JSON.parse(text); return true } catch {
      setError('This JSON is not valid yet. Fix the syntax before saving.')
      return false
    }
  }

  const createEditedBlob = async () => {
    if (direct && kind === PREVIEW_KINDS.TEXT) return new Blob([text], { type: textMimeType(file.name) })
    if (direct && kind === PREVIEW_KINDS.SPREADSHEET && sheetState) {
      const extension = getFileExtension(file.name)
      if (extension === 'csv') return new Blob([sheetState.XLSX.utils.sheet_to_csv(sheetState.workbook.Sheets[sheetName])], { type: 'text/csv;charset=utf-8' })
      const output = sheetState.XLSX.write(sheetState.workbook, { type: 'array', bookType: extension === 'xls' ? 'biff8' : 'xlsx', cellStyles: true })
      return new Blob([output], { type: 'application/octet-stream' })
    }
    if (direct && kind === PREVIEW_KINDS.DOCX && wordShellRef.current) {
      const { ExportEngine } = await import('@raazkhnl/rk-editor-core')
      const editor = wordShellRef.current.editor
      const exporter = new ExportEngine(editor.styleManager)
      return exporter.toBlob(editor.getJSON(), { filename: editedCopyName(file.name), pageLayout: editor.getPageLayout() })
    }
    return revisedFile
  }

  const save = async (downloadAfterSave = false) => {
    setError('')
    if (kind === PREVIEW_KINDS.TEXT && !validateText()) return
    let data
    try { data = await createEditedBlob() } catch (cause) {
      setError(cause?.message || 'The edited document could not be exported as DOCX.')
      return
    }
    if (!data) { setError('Select the revised file from your computer first.'); return }
    if (data.size <= 0 || data.size > MAX_FILE_SIZE) { setError('The revised file must be larger than 0 bytes and no more than 100 MB.'); return }
    const filename = editedCopyName(file.name)
    setSaving(true)
    try {
      const result = await filesApi.saveEditedCopy({ filename, folder: folderFromObjectKey(file.key), data })
      setSavedName(filename)
      setDirty(false)
      if (kind === PREVIEW_KINDS.TEXT) setOriginalText(text)
      if (downloadAfterSave) downloadBlob(data, filename)
      await onSaved?.(result)
    } catch (cause) {
      setError(cause?.message || 'The edited copy could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const selectRevision = (selected) => {
    setSavedName('')
    if (!selected) return
    if (!hasMatchingExtension(file.name, selected.name)) {
      setRevisedFile(null)
      setError(`Choose a .${getFileExtension(file.name) || 'matching'} file so the saved copy keeps the original format.`)
      return
    }
    if (selected.size <= 0 || selected.size > MAX_FILE_SIZE) {
      setRevisedFile(null)
      setError('The revised file must be larger than 0 bytes and no more than 100 MB.')
      return
    }
    setError('')
    setRevisedFile(selected)
    setDirty(true)
  }

  const canSave = direct ? dirty : Boolean(revisedFile)
  const rows = sheetState?.rows[sheetName] || []

  return <section className="file-editor-modal" role="dialog" aria-modal="true" aria-label={`Edit ${file.name}`}>
    <header className="file-editor-header">
      <div><span><FilePenLine size={18} />{direct ? 'Browser editor' : 'Native app workflow'}</span><h2>{file.name}</h2><p>The original remains unchanged. Saving creates <strong>{editedCopyName(file.name)}</strong> in the same folder.</p></div>
      <button onClick={requestClose} aria-label="Close editor"><X size={22} /></button>
    </header>

    {direct && kind === PREVIEW_KINDS.DOCX && <div className="file-editor-docx"><p><AlertTriangle size={15} />Complex Word-only layout, fields, comments, or tracked changes may be simplified when this browser editor exports the revision.</p><div className="file-editor-docx-host" ref={wordContainerRef} /></div>}
    {status === 'loading' && kind === PREVIEW_KINDS.DOCX && <div className="file-editor-loading overlay"><PreviewLoading label="Opening Word editor…" /></div>}
    {status === 'loading' && kind !== PREVIEW_KINDS.DOCX ? <div className="file-editor-loading"><PreviewLoading label="Preparing secure editor…" /></div> : status === 'error' && !direct ? null : <>
      {kind === PREVIEW_KINDS.TEXT && status === 'ready' && <div className="file-editor-text-wrap">
        <div className="file-editor-status"><span>{text.split('\n').length.toLocaleString()} lines</span><span>{text.length.toLocaleString()} characters</span><span>{dirty ? 'Unsaved changes' : 'No unsaved changes'}</span></div>
        <textarea className="file-editor-text" value={text} spellCheck={false} onChange={(event) => { setText(event.target.value); setDirty(event.target.value !== originalText); setSavedName(''); setError('') }} aria-label={`Edit contents of ${file.name}`} />
      </div>}

      {kind === PREVIEW_KINDS.SPREADSHEET && status === 'ready' && sheetState && <div className="file-editor-sheet">
        <div className="file-editor-sheet-tools"><div>{sheetState.workbook.SheetNames.map((name) => <button className={name === sheetName ? 'active' : ''} key={name} onClick={() => setSheetName(name)}>{name}</button>)}</div><input value={sheetSearch} onChange={(event) => setSheetSearch(event.target.value)} placeholder="Filter worksheet rows" aria-label="Filter worksheet rows" /></div>
        <SheetEditorGrid rows={rows} search={sheetSearch} onChange={updateCell} />
        <p className="file-editor-caution"><AlertTriangle size={16} />Editing a cell replaces that cell's formula with its new value. Complex Excel formatting and macros may not round-trip exactly.</p>
      </div>}

      {!direct && <div className="external-editor-workflow">
        <div className="external-editor-steps"><article><b>1</b><div><strong>Download the original</strong><p>Open it in the appropriate trusted desktop application and make your changes.</p><Button variant="secondary" onClick={() => onDownload(file)}><Download size={17} />Download original</Button></div></article><article><b>2</b><div><strong>Select your revised file</strong><p>Keep the same file extension. The browser checks the size and format before upload.</p><Button variant="secondary" onClick={() => inputRef.current?.click()}><Upload size={17} />Choose revised file</Button><input ref={inputRef} type="file" hidden accept={getFileExtension(file.name) ? `.${getFileExtension(file.name)}` : undefined} onChange={(event) => { selectRevision(event.target.files?.[0]); event.target.value = '' }} />{revisedFile && <span className="selected-revision"><CheckCircle2 size={16} /><strong>{revisedFile.name}</strong> · {formatBytes(revisedFile.size)}</span>}</div></article><article><b>3</b><div><strong>Save the revision</strong><p>A new private cloud object is created. The original is retained for safety.</p></div></article></div>
      </div>}
    </>}

    {(error || savedName) && <div className={`file-editor-notice ${savedName ? 'success' : 'error'}`} role="status">{savedName ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}<span>{savedName ? `Saved securely as ${savedName}.` : error}</span></div>}

    <footer className="file-editor-footer"><Button variant="ghost" onClick={requestClose}>Close</Button><Button variant="secondary" disabled={!canSave || saving || status !== 'ready'} loading={saving} onClick={() => save(true)}><Download size={17} />Save & download</Button><Button disabled={!canSave || saving || status !== 'ready'} loading={saving} onClick={() => save(false)}><Save size={17} />Save edited copy</Button></footer>
  </section>
}
