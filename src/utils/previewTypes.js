import { getFileExtension } from './fileTypes.js'

export const PREVIEW_KINDS = Object.freeze({
  IMAGE: 'image', PDF: 'pdf', DOCX: 'docx', SPREADSHEET: 'spreadsheet',
  TEXT: 'text', VIDEO: 'video', AUDIO: 'audio', POWERPOINT: 'powerpoint',
  LEGACY_DOC: 'legacy-doc', GOOGLE: 'google', UNSUPPORTED: 'unsupported',
})

const extensionKinds = {
  jpg: 'image', jpeg: 'image', png: 'image', webp: 'image', gif: 'image', bmp: 'image', svg: 'image',
  pdf: 'pdf', docx: 'docx', doc: 'legacy-doc', xlsx: 'spreadsheet', xls: 'spreadsheet', csv: 'spreadsheet',
  pptx: 'powerpoint', ppt: 'powerpoint', mp4: 'video', webm: 'video', ogv: 'video',
  mp3: 'audio', wav: 'audio', ogg: 'audio', oga: 'audio', m4a: 'audio', aac: 'audio', flac: 'audio',
  txt: 'text', json: 'text', xml: 'text', md: 'text', log: 'text', js: 'text', jsx: 'text',
  ts: 'text', tsx: 'text', css: 'text', html: 'text', htm: 'text', sql: 'text', py: 'text',
  java: 'text', yml: 'text', yaml: 'text', sh: 'text', env: 'text', ini: 'text', conf: 'text',
  config: 'text', properties: 'text', toml: 'text', gitignore: 'text', dockerfile: 'text',
}

export const PREVIEW_LIMITS = Object.freeze({
  text: 5 * 1024 * 1024,
  docx: 50 * 1024 * 1024,
  'legacy-doc': 50 * 1024 * 1024,
  spreadsheet: 25 * 1024 * 1024,
})

const googleMimeKinds = new Set([
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.spreadsheet',
  'application/vnd.google-apps.presentation',
])

export function getPreviewKind(file = {}) {
  if (file.googleType || googleMimeKinds.has(file.mimeType)) return PREVIEW_KINDS.GOOGLE
  const extensionKind = extensionKinds[getFileExtension(file.name)]
  if (extensionKind) return extensionKind
  const mimeType = String(file.mimeType || file.type || '').toLowerCase().split(';')[0]
  if (mimeType.startsWith('text/') || ['application/json', 'application/xml', 'application/x-yaml', 'application/toml', 'application/x-env'].includes(mimeType)) return PREVIEW_KINDS.TEXT
  return PREVIEW_KINDS.UNSUPPORTED
}

export function previewNeedsSignedUrl(kind) {
  return ![PREVIEW_KINDS.POWERPOINT, PREVIEW_KINDS.GOOGLE, PREVIEW_KINDS.UNSUPPORTED].includes(kind)
}

export function getPreviewLimitError(file, kind = getPreviewKind(file)) {
  const limit = PREVIEW_LIMITS[kind]
  if (!limit || !Number.isFinite(Number(file?.size)) || Number(file.size) <= limit) return null
  const size = Math.round(limit / (1024 * 1024))
  return `This ${kind} preview is limited to ${size} MB to protect browser performance. Download the original file instead.`
}

export function supportsZoom(kind) { return [PREVIEW_KINDS.IMAGE, PREVIEW_KINDS.PDF, PREVIEW_KINDS.DOCX, PREVIEW_KINDS.LEGACY_DOC].includes(kind) }
export function supportsRotation(kind) { return kind === PREVIEW_KINDS.IMAGE }

export function getTextLanguage(name = '') {
  const extension = getFileExtension(name)
  return ({ js: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'tsx', css: 'css', html: 'markup', htm: 'markup', xml: 'markup', json: 'json', sql: 'sql', py: 'python', java: 'java', sh: 'bash', yml: 'yaml', yaml: 'yaml', md: 'markdown' })[extension] || 'text'
}
