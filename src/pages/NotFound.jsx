import { FileQuestion } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'

export default function NotFound() {
  return <main className="not-found"><FileQuestion size={38} /><span>404</span><h1>That page is not in this workspace</h1><p>The link may be outdated, or you may not have access to that location.</p><Button><Link to="/dashboard">Return to dashboard</Link></Button></main>
}
