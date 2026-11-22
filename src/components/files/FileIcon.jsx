import { Archive, File, FileAudio, FileImage, FileSpreadsheet, FileText, FileType2, FileVideo, Presentation } from 'lucide-react'
import { getFileType } from '../../utils/fileTypes.js'

const icons = { pdf: FileType2, word: FileText, sheet: FileSpreadsheet, slides: Presentation, image: FileImage, video: FileVideo, audio: FileAudio, archive: Archive, text: FileText, file: File }

export default function FileIcon({ name, size = 21 }) {
  const type = getFileType(name)
  const Icon = icons[type]
  return <span className={`file-icon file-${type}`}><Icon size={size} /></span>
}
