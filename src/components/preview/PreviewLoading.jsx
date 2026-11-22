import { LoaderCircle } from 'lucide-react'

export default function PreviewLoading({ label = 'Preparing secure preview…' }) {
  return <div className="preview-message"><LoaderCircle className="spin" size={30} /><strong>{label}</strong><span>The signed link is kept only for this preview session.</span></div>
}
