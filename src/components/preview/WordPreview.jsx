import { useEffect, useRef, useState } from 'react'
import { PREVIEW_LIMITS } from '../../utils/previewTypes.js'
import { fetchPreviewBuffer, previewErrorMessage } from '../../utils/previewHelpers.js'
import PreviewLoading from './PreviewLoading.jsx'
import PreviewError from './PreviewError.jsx'

export default function WordPreview({ url, file, zoom, signal, onDownload }) {
  const containerRef = useRef(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  useEffect(() => {
    let active = true
    const container = containerRef.current
    ;(async () => {
      setStatus('loading')
      try {
        const [buffer, docx, { default: DOMPurify }] = await Promise.all([
          fetchPreviewBuffer(url, { signal, maxBytes: PREVIEW_LIMITS.docx, expectedBytes: Number(file.size) }),
          import('docx-preview'), import('dompurify'),
        ])
        if (!active) return
        const detachedBody = document.createElement('div')
        const detachedStyles = document.createElement('div')
        await docx.renderAsync(buffer, detachedBody, detachedStyles, { inWrapper: true, breakPages: true, renderHeaders: true, renderFooters: true, renderFootnotes: true, renderEndnotes: true, renderAltChunks: false, useBase64URL: true, experimental: false })
        if (!active || !container) return
        const safeBody = DOMPurify.sanitize(detachedBody.innerHTML, { FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'], ALLOW_UNKNOWN_PROTOCOLS: false })
        const style = document.createElement('style')
        style.textContent = detachedStyles.textContent || ''
        container.replaceChildren(style)
        const content = document.createElement('div')
        content.innerHTML = safeBody
        container.appendChild(content)
        setStatus('ready')
      } catch (cause) { if (cause?.name !== 'AbortError' && active) { setError(cause); setStatus('error') } }
    })()
    return () => { active = false; container?.replaceChildren() }
  }, [url, file.size, signal])
  return <div className="word-preview-scroll">{status === 'loading' && <PreviewLoading label="Rendering Word document…" />}{status === 'error' && <PreviewError message={previewErrorMessage(error)} onDownload={() => onDownload(file)} />}<div className="word-preview" ref={containerRef} style={{ transform: `scale(${zoom})`, width: `${100 / zoom}%` }} /></div>
}
