const typeMap = {
  pdf: ['pdf'], word: ['doc', 'docx'], sheet: ['xls', 'xlsx', 'csv'], slides: ['ppt', 'pptx'],
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'heic'], video: ['mp4', 'mov', 'avi', 'webm', 'ogv'],
  audio: ['mp3', 'wav', 'm4a', 'ogg', 'oga', 'aac', 'flac'], archive: ['zip', 'rar', '7z', 'tar', 'gz'], text: ['txt', 'md', 'rtf', 'json', 'xml', 'log', 'js', 'jsx', 'ts', 'tsx', 'css', 'html', 'sql', 'py', 'java', 'yml', 'yaml', 'env', 'ini', 'conf', 'config', 'properties', 'toml', 'gitignore', 'dockerfile'],
}

export function getFileExtension(name = '') { return name.includes('.') ? name.split('.').pop().toLowerCase() : '' }
export function getFileType(name = '') {
  const extension = getFileExtension(name)
  return Object.entries(typeMap).find(([, extensions]) => extensions.includes(extension))?.[0] || 'file'
}
export function getTypeLabel(name = '') {
  const extension = getFileExtension(name)
  return extension ? `${extension.toUpperCase()} file` : 'File'
}
