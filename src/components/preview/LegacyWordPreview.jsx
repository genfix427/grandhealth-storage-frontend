import { useEffect, useRef, useState } from 'react'
import { PREVIEW_KINDS, PREVIEW_LIMITS } from '../../utils/previewTypes.js'
import { fetchPreviewBuffer, previewErrorMessage } from '../../utils/previewHelpers.js'
import PreviewLoading from './PreviewLoading.jsx'
import PreviewError from './PreviewError.jsx'

const ZIP_SIGNATURES = new Set(['504b0304', '504b0506', '504b0708'])
const OLE_SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]

function signature(buffer, length) {
  return Array.from(new Uint8Array(buffer, 0, Math.min(length, buffer.byteLength)))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function isZipDocument(buffer) {
  return buffer?.byteLength >= 4 && ZIP_SIGNATURES.has(signature(buffer, 4))
}

export function isOleDocument(buffer) {
  if (!buffer || buffer.byteLength < OLE_SIGNATURE.length) return false
  const bytes = new Uint8Array(buffer, 0, OLE_SIGNATURE.length)
  return OLE_SIGNATURE.every((byte, index) => bytes[index] === byte)
}

async function renderMislabeledDocx(buffer, container) {
  const [docx, { default: DOMPurify }] = await Promise.all([import('docx-preview'), import('dompurify')])
  const detachedBody = document.createElement('div')
  const detachedStyles = document.createElement('div')
  await docx.renderAsync(buffer, detachedBody, detachedStyles, {
    inWrapper: true,
    breakPages: true,
    renderHeaders: true,
    renderFooters: true,
    renderFootnotes: true,
    renderEndnotes: true,
    renderAltChunks: false,
    useBase64URL: true,
    experimental: false,
  })
  const style = document.createElement('style')
  style.textContent = detachedStyles.textContent || ''
  const content = document.createElement('div')
  content.innerHTML = DOMPurify.sanitize(detachedBody.innerHTML, {
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    ALLOW_UNKNOWN_PROTOCOLS: false,
  })
  container.replaceChildren(style, content)
  container.dataset.documentFormat = 'docx'
}

function normalizeLegacyDocError(cause) {
  const passthroughCodes = new Set([
    'FILE_TOO_LARGE',
    'PREVIEW_NETWORK_OR_CORS',
    'PREVIEW_URL_EXPIRED',
    'PREVIEW_NOT_FOUND',
    'PREVIEW_FETCH_FAILED',
  ])
  if (passthroughCodes.has(cause?.message)) return cause
  if (/encrypted/i.test(cause?.message || '')) return new Error('LEGACY_DOC_ENCRYPTED')
  if (cause?.message === 'INVALID_LEGACY_DOC') return cause
  return new Error('LEGACY_DOC_UNSUPPORTED', { cause })
}

export default function LegacyWordPreview({ url, file, zoom, signal, onDownload }) {
  const containerRef = useRef(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    const container = containerRef.current

    ;(async () => {
      setStatus('loading')
      setError(null)
      try {
        const buffer = await fetchPreviewBuffer(url, {
          signal,
          maxBytes: PREVIEW_LIMITS[PREVIEW_KINDS.LEGACY_DOC],
          expectedBytes: Number(file.size),
        })
        if (!active || !container) return

        if (isZipDocument(buffer)) {
          await renderMislabeledDocx(buffer, container)
        } else {
          if (!isOleDocument(buffer)) throw new Error('INVALID_LEGACY_DOC')
          const { parseMsDocToHtml, mountMsDoc } = await import('@file-viewer/doc')
          const rendered = await parseMsDocToHtml(buffer, {
            parseOptions: { maxPictureBytes: 12 * 1024 * 1024 },
            renderOptions: { externalLinkPolicy: 'block', externalResourcePolicy: 'block' },
          })
          if (!active || !container) return
          mountMsDoc(container, rendered)
          container.dataset.documentFormat = 'doc'
        }

        if (active) setStatus('ready')
      } catch (cause) {
        if (cause?.name !== 'AbortError' && active) {
          setError(normalizeLegacyDocError(cause))
          setStatus('error')
        }
      }
    })()

    return () => {
      active = false
      container?.replaceChildren()
    }
  }, [url, file.size, signal])

  return (
    <div className="legacy-word-preview-scroll">
      {status === 'loading' && <PreviewLoading label="Rendering legacy Word document…" />}
      {status === 'error' && <PreviewError message={previewErrorMessage(error)} onDownload={() => onDownload(file)} />}
      <div
        className="legacy-word-preview"
        ref={containerRef}
        aria-hidden={status !== 'ready'}
        style={{ transform: `scale(${zoom})`, width: `${100 / zoom}%` }}
      />
    </div>
  )
}
