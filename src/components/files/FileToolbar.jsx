import { Filter, FolderPlus, Grid2X2, List, Plus, RefreshCw, Search, SlidersHorizontal } from 'lucide-react'
import Button from '../ui/Button.jsx'

export default function FileToolbar({ search, onSearch, view, onView, sort, onSort, type, onType, onUpload, onCreateFolder, onRefresh, canUpload, refreshing }) {
  return <div className="file-toolbar">
    <label className="search-input"><Search size={18} /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search loaded files" aria-label="Search loaded files" />{search && <button onClick={() => onSearch('')}>Clear</button>}</label>
    <div className="toolbar-controls">
      <label className="select-control"><SlidersHorizontal size={16} /><select value={sort} onChange={(event) => onSort(event.target.value)} aria-label="Sort files"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option><option value="largest">Largest first</option><option value="smallest">Smallest first</option></select></label>
      <label className="select-control"><Filter size={16} /><select value={type} onChange={(event) => onType(event.target.value)} aria-label="Filter file type"><option value="all">All types</option><option value="pdf">PDF</option><option value="word">Documents</option><option value="sheet">Spreadsheets</option><option value="slides">Presentations</option><option value="image">Images</option><option value="archive">Archives</option><option value="other">Other</option></select></label>
      <button className="icon-btn bordered" onClick={onRefresh} aria-label="Refresh files"><RefreshCw className={refreshing ? 'spin' : ''} size={18} /></button>
      <div className="view-toggle" aria-label="File view"><button className={view === 'grid' ? 'active' : ''} onClick={() => onView('grid')} aria-label="Grid view"><Grid2X2 size={17} /></button><button className={view === 'list' ? 'active' : ''} onClick={() => onView('list')} aria-label="List view"><List size={18} /></button></div>
      {canUpload && <div className="toolbar-primary-actions"><Button variant="secondary" onClick={onCreateFolder}><FolderPlus size={18} />New folder</Button><Button onClick={onUpload}><Plus size={18} />Upload</Button></div>}
    </div>
  </div>
}
