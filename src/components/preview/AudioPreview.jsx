import { useRef, useState } from 'react'
import { AudioLines } from 'lucide-react'

export default function AudioPreview({ url, file, onError }) {
  const mediaRef = useRef(null)
  const [ready, setReady] = useState(false)
  return <div className="audio-preview"><div className="audio-art"><span><AudioLines size={46} /></span><h2>{file.name}</h2><p>{ready ? 'Ready to play' : 'Loading audio metadata…'}</p></div><audio ref={mediaRef} src={url} controls preload="metadata" onLoadedMetadata={() => setReady(true)} onError={() => onError(new Error('UNSUPPORTED_CODEC'))}>Your browser cannot play this audio.</audio><label>Playback speed<select defaultValue="1" onChange={(event) => { if (mediaRef.current) mediaRef.current.playbackRate = Number(event.target.value) }}><option value="0.5">0.5×</option><option value="0.75">0.75×</option><option value="1">Normal</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label></div>
}
