/* eslint-disable react-hooks/incompatible-library -- TanStack Virtual is intentionally used with React 19's useFlushSync disabled. */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Clipboard, FileCode2, Search, WrapText } from 'lucide-react'
import { Highlight, themes } from 'prism-react-renderer'
import { useVirtualizer } from '@tanstack/react-virtual'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getFileExtension } from '../../utils/fileTypes.js'
import { getTextLanguage, PREVIEW_LIMITS } from '../../utils/previewTypes.js'
import { fetchPreviewBuffer } from '../../utils/previewHelpers.js'
import PreviewLoading from './PreviewLoading.jsx'

function VirtualCodeLines({ tokens, getLineProps, getTokenProps, wrap, search }) {
  const viewportRef = useRef(null)
  const virtualizer = useVirtualizer({ count: tokens.length, getScrollElement: () => viewportRef.current, estimateSize: () => wrap ? 35 : 24, overscan: 18, useFlushSync: false })
  return <div className={`code-viewport ${wrap ? 'wrap' : ''}`} ref={viewportRef}><div className="code-virtual" style={{ height: virtualizer.getTotalSize() }}>{virtualizer.getVirtualItems().map((virtualLine) => { const line = tokens[virtualLine.index]; const lineText = line.map((token) => token.content).join(''); const matches = search && lineText.toLowerCase().includes(search.toLowerCase()); return <div {...getLineProps({ line, key: virtualLine.index })} className={`code-line ${matches ? 'match' : ''}`} key={virtualLine.index} style={{ transform: `translateY(${virtualLine.start}px)`, minHeight: virtualLine.size }}><span className="line-number">{virtualLine.index + 1}</span><span className="line-content">{line.map((token, key) => <span {...getTokenProps({ token, key })} key={key} />)}</span></div> })}</div></div>
}

export default function TextPreview({ url, file, signal, onError }) {
  const [content, setContent] = useState(null)
  const [search, setSearch] = useState('')
  const [wrap, setWrap] = useState(true)
  const [markdown, setMarkdown] = useState(getFileExtension(file.name) === 'md')
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    let active = true
    fetchPreviewBuffer(url, { signal, maxBytes: PREVIEW_LIMITS.text, expectedBytes: Number(file.size) }).then((buffer) => {
      if (!active) return
      let text = new TextDecoder('utf-8', { fatal: false }).decode(buffer)
      if (getFileExtension(file.name) === 'json') { try { text = JSON.stringify(JSON.parse(text), null, 2) } catch { /* show malformed JSON as text */ } }
      setContent(text)
    }).catch((cause) => { if (cause?.name !== 'AbortError' && active) onError(cause) })
    return () => { active = false }
  }, [url, file.name, file.size, signal, onError])
  const matches = useMemo(() => search && content ? content.toLowerCase().split(search.toLowerCase()).length - 1 : 0, [content, search])
  const copy = async () => { await navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 1500) }
  if (content === null) return <PreviewLoading label="Loading text preview…" />
  return <div className="text-preview">
    <div className="text-tools"><label><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search in file" /><span>{search ? `${matches} found` : ''}</span></label><button className={wrap ? 'active' : ''} onClick={() => setWrap((value) => !value)}><WrapText size={16} />Wrap</button>{getFileExtension(file.name) === 'md' && <button className={markdown ? 'active' : ''} onClick={() => setMarkdown((value) => !value)}><FileCode2 size={16} />{markdown ? 'Source' : 'Rendered'}</button>}<button onClick={copy}>{copied ? <Check size={16} /> : <Clipboard size={16} />}{copied ? 'Copied' : 'Copy'}</button></div>
    {markdown ? <div className="markdown-preview"><ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{ img: ({ alt }) => <span className="markdown-image-omitted">[Image omitted: {alt || 'untrusted source'}]</span>, a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer noopener">{children}</a> }}>{content}</ReactMarkdown></div> : <Highlight theme={themes.vsDark} code={content} language={getTextLanguage(file.name)}>{({ tokens, getLineProps, getTokenProps }) => <VirtualCodeLines tokens={tokens} getLineProps={getLineProps} getTokenProps={getTokenProps} wrap={wrap} search={search} />}</Highlight>}
  </div>
}
