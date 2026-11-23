/* eslint-disable react-hooks/set-state-in-effect -- signed preview state intentionally resets when its external file key or retry changes. */
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import PreviewHeader from './PreviewHeader.jsx'
import PreviewToolbar from './PreviewToolbar.jsx'
import PreviewLoading from './PreviewLoading.jsx'
import PreviewError from './PreviewError.jsx'
import { getPreviewKind, getPreviewLimitError, previewNeedsSignedUrl, supportsRotation, supportsZoom, PREVIEW_KINDS } from '../../utils/previewTypes.js'
import { isInteractiveTarget, previewErrorMessage } from '../../utils/previewHelpers.js'

const ImagePreview = lazy(() => import('./ImagePreview.jsx'))
const PdfPreview = lazy(() => import('./PdfPreview.jsx'))
const WordPreview = lazy(() => import('./WordPreview.jsx'))
const LegacyWordPreview = lazy(() => import('./LegacyWordPreview.jsx'))
const SpreadsheetPreview = lazy(() => import('./SpreadsheetPreview.jsx'))
const TextPreview = lazy(() => import('./TextPreview.jsx'))
const VideoPreview = lazy(() => import('./VideoPreview.jsx'))
const AudioPreview = lazy(() => import('./AudioPreview.jsx'))
const UnsupportedPreview = lazy(() => import('./UnsupportedPreview.jsx'))
const GoogleWorkspacePreview = lazy(() => import('./GoogleWorkspacePreview.jsx'))
const FileEditorModal = lazy(() => import('./FileEditorModal.jsx'))

export default function FilePreviewModal({ file, filesApi, canEdit = false, onClose, onDownload, onSaved, onPrevious, onNext, hasPrevious, hasNext }) {
  const rootRef = useRef(null)
  const [source, setSource] = useState(null)
  const [sourceSignal, setSourceSignal] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [fitMode, setFitMode] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const kind = getPreviewKind(file)
  const limitError = getPreviewLimitError(file, kind)

  useEffect(() => {
    setZoom(1); setRotation(0); setFitMode(true); setError(null); setSource(null); setEditorOpen(false)
    if (!previewNeedsSignedUrl(kind)) { setStatus('ready'); return undefined }
    if (limitError) { setStatus('error'); setError(new Error('FILE_TOO_LARGE')); return undefined }
    const controller = new AbortController()
    setSourceSignal(controller.signal)
    setStatus('loading')
    filesApi.createPreviewUrl(file.key, controller.signal).then((result) => {
      if (!result?.url) throw new Error('PREVIEW_FETCH_FAILED')
      setSource(result)
      setStatus('ready')
    }).catch((cause) => { if (cause?.name !== 'AbortError') { setError(cause); setStatus('error') } })
    return () => controller.abort()
  }, [file.key, filesApi, kind, limitError, retryKey])

  const changeZoom = useCallback((amount) => { setFitMode(false); setZoom((value) => Math.min(3, Math.max(.4, Number((value + amount).toFixed(2))))) }, [])
  const fit = useCallback(() => { setFitMode(true); setZoom(1) }, [])
  const original = useCallback(() => { setFitMode(false); setZoom(1) }, [])
  const retry = useCallback(() => setRetryKey((value) => value + 1), [])

  useEffect(() => {
    const keydown = (event) => {
      if (editorOpen) return
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (isInteractiveTarget(event.target)) return
      if (event.key === 'ArrowLeft' && hasPrevious) { event.preventDefault(); onPrevious() }
      else if (event.key === 'ArrowRight' && hasNext) { event.preventDefault(); onNext() }
      else if ((event.key === '+' || event.key === '=') && supportsZoom(kind)) { event.preventDefault(); changeZoom(.15) }
      else if (event.key === '-' && supportsZoom(kind)) { event.preventDefault(); changeZoom(-.15) }
    }
    document.addEventListener('keydown', keydown)
    document.body.classList.add('preview-open')
    return () => { document.removeEventListener('keydown', keydown); document.body.classList.remove('preview-open') }
  }, [changeZoom, editorOpen, hasNext, hasPrevious, kind, onClose, onNext, onPrevious])

  useEffect(() => {
    const update = () => setFullscreen(document.fullscreenElement === rootRef.current)
    document.addEventListener('fullscreenchange', update)
    return () => document.removeEventListener('fullscreenchange', update)
  }, [])
  const toggleFullscreen = async () => { if (document.fullscreenElement) await document.exitFullscreen(); else await rootRef.current?.requestFullscreen() }

  let content
  const rendererError = useCallback((cause) => { setError(cause); setStatus('error') }, [])
  if (status === 'loading') content = <PreviewLoading />
  else if (status === 'error') content = <PreviewError message={limitError || previewErrorMessage(error)} onRetry={limitError ? null : retry} onDownload={() => onDownload(file)} />
  else {
    const props = { url: source?.url, file, signal: sourceSignal, zoom, rotation, fitMode, onFit: fit, onError: rendererError, onDownload }
    if (kind === PREVIEW_KINDS.IMAGE) content = <ImagePreview {...props} />
    else if (kind === PREVIEW_KINDS.PDF) content = <PdfPreview {...props} />
    else if (kind === PREVIEW_KINDS.DOCX) content = <WordPreview {...props} />
    else if (kind === PREVIEW_KINDS.LEGACY_DOC) content = <LegacyWordPreview {...props} />
    else if (kind === PREVIEW_KINDS.SPREADSHEET) content = <SpreadsheetPreview {...props} />
    else if (kind === PREVIEW_KINDS.TEXT) content = <TextPreview {...props} />
    else if (kind === PREVIEW_KINDS.VIDEO) content = <VideoPreview {...props} />
    else if (kind === PREVIEW_KINDS.AUDIO) content = <AudioPreview {...props} />
    else if (kind === PREVIEW_KINDS.GOOGLE) content = <GoogleWorkspacePreview file={file} />
    else content = <UnsupportedPreview file={file} kind={kind} onDownload={onDownload} />
  }

  return createPortal(<div className="file-preview-modal" ref={rootRef} role="dialog" aria-modal="true" aria-label={`Preview ${file.name}`}>
    <PreviewHeader file={file} canEdit={canEdit} onEdit={() => setEditorOpen(true)} onDownload={onDownload} onClose={onClose} />
    <PreviewToolbar hasPrevious={hasPrevious} hasNext={hasNext} onPrevious={onPrevious} onNext={onNext} zoom={zoom} onZoom={changeZoom} canZoom={supportsZoom(kind)} canRotate={supportsRotation(kind)} onRotate={() => setRotation((value) => (value + 90) % 360)} onFit={fit} onOriginal={original} fullscreen={fullscreen} onFullscreen={toggleFullscreen} />
    <main className={`preview-canvas preview-kind-${kind}`}><Suspense fallback={<PreviewLoading label="Loading preview tools…" />}>{content}</Suspense></main>
    {editorOpen && <Suspense fallback={<PreviewLoading label="Loading editor…" />}><FileEditorModal file={file} kind={kind} url={source?.url} signal={sourceSignal} filesApi={filesApi} onClose={() => setEditorOpen(false)} onDownload={onDownload} onSaved={onSaved} /></Suspense>}
  </div>, document.body)
}
