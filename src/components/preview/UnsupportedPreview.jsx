import { Download, FileQuestion, Presentation } from 'lucide-react'
import Button from '../ui/Button.jsx'
import { getFileExtension } from '../../utils/fileTypes.js'
import { PREVIEW_KINDS } from '../../utils/previewTypes.js'

export default function UnsupportedPreview({ file, kind, onDownload }) {
  const powerpoint = kind === PREVIEW_KINDS.POWERPOINT
  const legacyWord = kind === PREVIEW_KINDS.LEGACY_DOC
  return <div className="unsupported-preview"><span>{powerpoint ? <Presentation size={38} /> : <FileQuestion size={38} />}</span><h2>{powerpoint ? 'Presentation conversion required' : legacyWord ? 'Legacy Word preview unavailable' : 'Preview not supported'}</h2><p>{powerpoint ? 'Private PPT and PPTX files need an organization-controlled conversion service that produces PDF or slide images. This application never sends private files to a public online viewer.' : legacyWord ? 'Legacy DOC files require a secure server-side conversion service. DOCX files can be previewed directly.' : `A secure renderer is not available for .${getFileExtension(file.name) || 'this'} files.`}</p><Button variant="secondary" onClick={() => onDownload(file)}><Download size={17} />Download original</Button></div>
}
