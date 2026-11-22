import { ShieldCheck } from 'lucide-react'

export default function BrandMark({ compact = false }) {
  return <div className="brand-mark"><span className="brand-icon"><ShieldCheck size={21} strokeWidth={2.4} /></span>{!compact && <span><strong>Grand Health</strong><small>Storage</small></span>}</div>
}
