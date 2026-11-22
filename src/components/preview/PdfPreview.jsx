import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import PreviewLoading from './PreviewLoading.jsx'

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

export default function PdfPreview({ url, file, zoom, fitMode, onFit, onError }) {
  const stageRef = useRef(null)
  const [pdf, setPdf] = useState(null)
  const [pages, setPages] = useState(0)
  const [page, setPage] = useState(1)
  const [bounds, setBounds] = useState({ width: 760, height: 900 })
  const [pageMetrics, setPageMetrics] = useState({ width: 612, ratio: 612 / 792 })
  const [pdfFit, setPdfFit] = useState('page')
  const [search, setSearch] = useState('')
  const [matches, setMatches] = useState(0)

  useEffect(() => {
    const node = stageRef.current
    if (!node) return undefined
    const update = () => setBounds({
      width: Math.max(280, node.clientWidth - 48),
      height: Math.max(320, node.clientHeight - 93),
    })
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!pdf) return undefined
    let active = true
    pdf.getPage(page).then((pdfPage) => {
      if (!active) return
      const viewport = pdfPage.getViewport({ scale: 1 })
      setPageMetrics({ width: viewport.width, ratio: viewport.width / viewport.height })
    }).catch(() => {})
    return () => { active = false }
  }, [pdf, page])

  useEffect(() => {
    if (!pdf || !search.trim()) return undefined
    let active = true
    pdf.getPage(page).then((pdfPage) => pdfPage.getTextContent()).then((content) => {
      if (!active) return
      const haystack = content.items.map((item) => item.str).join(' ').toLowerCase()
      const needle = search.trim().toLowerCase()
      setMatches(needle ? haystack.split(needle).length - 1 : 0)
    }).catch(() => active && setMatches(0))
    return () => { active = false }
  }, [pdf, page, search])

  const fitWidth = Math.min(960, bounds.width)
  const fitPage = Math.min(fitWidth, bounds.height * pageMetrics.ratio)
  const renderWidth = fitMode ? (pdfFit === 'width' ? fitWidth : fitPage) : pageMetrics.width
  const chooseFit = (mode) => {
    setPdfFit(mode)
    onFit()
  }

  return <div className="pdf-preview" ref={stageRef}>
    <div className="pdf-subtoolbar">
      <button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Previous PDF page"><ChevronLeft size={17} /></button>
      <label><input type="number" min="1" max={pages || 1} value={page} onChange={(event) => setPage(Math.min(pages || 1, Math.max(1, Number(event.target.value) || 1)))} aria-label="PDF page" /><span>of {pages || '—'}</span></label>
      <button disabled={!pages || page >= pages} onClick={() => setPage((value) => Math.min(pages, value + 1))} aria-label="Next PDF page"><ChevronRight size={17} /></button>
      <div className="pdf-fit-options" aria-label="PDF fit mode">
        <button className={fitMode && pdfFit === 'width' ? 'active' : ''} onClick={() => chooseFit('width')}>Fit width</button>
        <button className={fitMode && pdfFit === 'page' ? 'active' : ''} onClick={() => chooseFit('page')}>Fit page</button>
      </div>
      <label className="pdf-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this page" /><span>{search ? `${matches} found` : ''}</span></label>
    </div>
    <div className="pdf-page-scroll">
      <Document file={url} loading={<PreviewLoading label="Loading PDF…" />} onLoadSuccess={(document) => { setPdf(document); setPages(document.numPages); setPage(1) }} onLoadError={onError} options={{ cMapPacked: true }}>
        <Page pageNumber={page} width={renderWidth} scale={zoom} renderAnnotationLayer renderTextLayer loading={<PreviewLoading label={`Rendering page ${page}…`} />} />
      </Document>
    </div>
    <span className="preview-sr-status" aria-live="polite">{file.name}, page {page} of {pages || 0}</span>
  </div>
}
