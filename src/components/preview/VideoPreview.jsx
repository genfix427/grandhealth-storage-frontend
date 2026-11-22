import { useRef, useState } from 'react'
import { Film } from 'lucide-react'

export default function VideoPreview({ url, file, onError }) {
  const mediaRef = useRef(null)
  const [ready, setReady] = useState(false)
  return <div className="media-preview"><div className="media-frame">{!ready && <div className="preview-inline-loader"><Film size={25} />Loading video metadata…</div>}<video ref={mediaRef} src={url} controls preload="metadata" playsInline onLoadedMetadata={() => setReady(true)} onError={() => onError(new Error('UNSUPPORTED_CODEC'))}>Your browser cannot play this video.</video></div><div className="media-options"><span>{file.name}</span><label>Speed<select defaultValue="1" onChange={(event) => { if (mediaRef.current) mediaRef.current.playbackRate = Number(event.target.value) }}><option value="0.5">0.5×</option><option value="0.75">0.75×</option><option value="1">Normal</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label></div></div>
}
