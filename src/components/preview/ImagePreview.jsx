import { useState } from 'react'
import { ImageOff } from 'lucide-react'

export default function ImagePreview({ url, file, zoom, rotation, fitMode, onError }) {
  const [loaded, setLoaded] = useState(false)
  return <div className={`image-preview-stage ${fitMode ? 'fit' : 'original'}`}>
    {!loaded && <div className="preview-inline-loader">Loading image…</div>}
    <img
      src={url}
      alt={file.name}
      draggable="false"
      onLoad={() => setLoaded(true)}
      onError={() => onError(new Error('PREVIEW_FETCH_FAILED'))}
      style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, visibility: loaded ? 'visible' : 'hidden' }}
    />
    {!url && <div className="preview-message"><ImageOff /><span>Image unavailable.</span></div>}
  </div>
}
