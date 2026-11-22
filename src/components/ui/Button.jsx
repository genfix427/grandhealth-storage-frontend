import { LoaderCircle } from 'lucide-react'

export default function Button({ children, variant = 'primary', size = 'md', loading = false, className = '', type = 'button', ...props }) {
  return <button type={type} className={`btn btn-${variant} btn-${size} ${className}`} disabled={loading || props.disabled} {...props}>
    {loading && <LoaderCircle className="spin" size={17} />}{children}
  </button>
}
