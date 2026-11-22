import { ChevronRight, House } from 'lucide-react'
import { buildBreadcrumbs } from '../../utils/validators.js'

export default function FileBreadcrumbs({ folder, onNavigate }) {
  return <nav className="breadcrumbs" aria-label="Folder breadcrumb">{buildBreadcrumbs(folder).map((crumb, index, all) => <span key={crumb.value}>{index > 0 && <ChevronRight size={15} />}<button onClick={() => onNavigate(crumb.value)} aria-current={index === all.length - 1 ? 'page' : undefined}>{index === 0 && <House size={15} />}{crumb.label}</button></span>)}</nav>
}
