/* eslint-disable react-hooks/incompatible-library -- TanStack Virtual is intentionally used with React 19's useFlushSync disabled. */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { PREVIEW_LIMITS } from '../../utils/previewTypes.js'
import { columnLabel, fetchPreviewBuffer, previewErrorMessage } from '../../utils/previewHelpers.js'
import PreviewLoading from './PreviewLoading.jsx'
import PreviewError from './PreviewError.jsx'

const CELL_WIDTH = 160

export default function SpreadsheetPreview({ url, file, signal, onDownload }) {
  const viewportRef = useRef(null)
  const [workbook, setWorkbook] = useState(null)
  const [sheetName, setSheetName] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState(null)
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [buffer, XLSX] = await Promise.all([fetchPreviewBuffer(url, { signal, maxBytes: PREVIEW_LIMITS.spreadsheet, expectedBytes: Number(file.size) }), import('xlsx')])
        if (!active) return
        const parsed = XLSX.read(buffer, { type: 'array', cellDates: true, cellFormula: false, cellStyles: false })
        const sheets = Object.fromEntries(parsed.SheetNames.map((name) => [name, XLSX.utils.sheet_to_json(parsed.Sheets[name], { header: 1, raw: false, defval: '', blankrows: true })]))
        setWorkbook({ names: parsed.SheetNames, sheets })
        setSheetName(parsed.SheetNames[0] || '')
      } catch (cause) { if (cause?.name !== 'AbortError' && active) setError(cause) }
    })()
    return () => { active = false }
  }, [url, file.size, signal])
  const rows = useMemo(() => workbook?.sheets[sheetName] || [], [workbook, sheetName])
  const visibleRows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return rows.map((row, index) => ({ row, index })).filter(({ row }) => !needle || row.some((cell) => String(cell).toLowerCase().includes(needle)))
  }, [rows, search])
  const columns = Math.min(200, rows.reduce((maximum, row) => Math.max(maximum, row.length), 0))
  const rowVirtualizer = useVirtualizer({ count: visibleRows.length, getScrollElement: () => viewportRef.current, estimateSize: () => 35, overscan: 12, useFlushSync: false })
  if (error) return <PreviewError message={previewErrorMessage(error)} onDownload={() => onDownload(file)} />
  if (!workbook) return <PreviewLoading label="Reading spreadsheet…" />
  if (!workbook.names.length) return <PreviewError message="This workbook does not contain a readable worksheet." onDownload={() => onDownload(file)} />
  return <div className="sheet-preview">
    <div className="sheet-tools"><div className="sheet-tabs">{workbook.names.map((name) => <button className={name === sheetName ? 'active' : ''} key={name} onClick={() => setSheetName(name)}>{name}</button>)}</div><label><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search worksheet" /><span>{search ? `${visibleRows.length} rows` : `${rows.length} rows`}</span></label></div>
    <div className="sheet-viewport" ref={viewportRef}>
      <div className="sheet-header" style={{ width: 54 + columns * CELL_WIDTH }}><span>#</span>{Array.from({ length: columns }, (_, index) => <b key={index}>{columnLabel(index)}</b>)}</div>
      <div className="sheet-virtual" style={{ height: rowVirtualizer.getTotalSize(), width: 54 + columns * CELL_WIDTH }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => { const item = visibleRows[virtualRow.index]; return <div className="sheet-row" key={`${sheetName}-${item.index}`} style={{ transform: `translateY(${virtualRow.start}px)`, height: virtualRow.size, width: 54 + columns * CELL_WIDTH }}><span>{item.index + 1}</span>{Array.from({ length: columns }, (_, column) => { const value = String(item.row[column] ?? ''); const match = search && value.toLowerCase().includes(search.toLowerCase()); return <div title={value} key={column}>{match ? <mark>{value}</mark> : value}</div> })}</div> })}
      </div>
    </div>
    <p className="sheet-disclaimer">Read-only preview. Formulas, macros, external links, and full Excel formatting are not executed.</p>
  </div>
}
