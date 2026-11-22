import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, CloudUpload, FolderOpen, SearchX } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../auth/useAuth.js'
import { PERMISSIONS } from '../auth/permissions.js'
import { useDebounce } from '../hooks/useDebounce.js'
import { useFiles, useFilesApi } from '../hooks/useFiles.js'
import { useFilePreview } from '../hooks/useFilePreview.js'
import { getFileType } from '../utils/fileTypes.js'
import { isFolderMarker, normalizeFolder } from '../utils/validators.js'
import Button from '../components/ui/Button.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import LoadingSkeleton from '../components/ui/LoadingSkeleton.jsx'
import FileBreadcrumbs from '../components/files/FileBreadcrumbs.jsx'
import FileToolbar from '../components/files/FileToolbar.jsx'
import FolderCard from '../components/files/FolderCard.jsx'
import FileCard from '../components/files/FileCard.jsx'
import FileTable from '../components/files/FileTable.jsx'
import FileDetailsPanel from '../components/files/FileDetailsPanel.jsx'
import UploadManager from '../components/files/UploadManager.jsx'
import CreateFolderModal from '../components/files/CreateFolderModal.jsx'
import DeleteConfirmationModal from '../components/files/DeleteConfirmationModal.jsx'

const FilePreviewModal = lazy(() => import('../components/preview/FilePreviewModal.jsx'))

export default function MyFiles() {
  const [params, setParams] = useSearchParams()
  const folder = normalizeFolder(params.get('folder') || '')
  const query = useFiles(folder)
  const filesApi = useFilesApi()
  const { can } = useAuth()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [view, setView] = useState(() => localStorage.getItem('ghs-file-view') || 'grid')
  const [sort, setSort] = useState(() => localStorage.getItem('ghs-file-sort') || 'newest')
  const [type, setType] = useState('all')
  const [selected, setSelected] = useState(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { localStorage.setItem('ghs-file-view', view) }, [view])
  useEffect(() => { localStorage.setItem('ghs-file-sort', sort) }, [sort])

  const loadedFiles = useMemo(() => (query.data?.pages.flatMap((page) => page.files || []) || []).filter((file) => !isFolderMarker(file)), [query.data])
  const folders = useMemo(() => [...new Set(query.data?.pages.flatMap((page) => page.folders || []) || [])], [query.data])
  const files = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase()
    const filtered = loadedFiles.filter((file) => {
      const fileType = getFileType(file.name)
      const typeMatch = type === 'all' || fileType === type || (type === 'other' && !['pdf', 'word', 'sheet', 'slides', 'image', 'archive'].includes(fileType))
      return typeMatch && (!needle || file.name.toLowerCase().includes(needle))
    })
    return filtered.sort((a, b) => {
      if (sort === 'name-asc') return a.name.localeCompare(b.name)
      if (sort === 'name-desc') return b.name.localeCompare(a.name)
      if (sort === 'oldest') return new Date(a.lastModified) - new Date(b.lastModified)
      if (sort === 'largest') return b.size - a.size
      if (sort === 'smallest') return a.size - b.size
      return new Date(b.lastModified) - new Date(a.lastModified)
    })
  }, [loadedFiles, debouncedSearch, type, sort])
  const preview = useFilePreview(files)
  const canDeleteFiles = can(PERMISSIONS.DELETE_FILES)
  const canDeleteFolders = can(PERMISSIONS.DELETE_FOLDERS)

  const navigateFolder = (nextFolder) => {
    setSelected(null)
    setSearch('')
    setParams(nextFolder ? { folder: nextFolder } : {})
  }
  const goBack = () => { const parts = folder.split('/').filter(Boolean); parts.pop(); navigateFolder(parts.length ? `${parts.join('/')}/` : '') }
  const download = async (file) => {
    setDownloading(true)
    try {
      const { url } = await filesApi.createDownloadUrl(file.key)
      const link = document.createElement('a'); link.href = url; link.download = file.name; link.rel = 'noopener'; document.body.appendChild(link); link.click(); link.remove()
      toast.success('Your secure download has started.')
    } catch (error) { toast.error(error.message || 'File download failed. Please try again.') }
    finally { setDownloading(false) }
  }
  const requestFileDelete = (file) => setDeleteTarget({ type: 'file', name: file.name, file })
  const requestFolderDelete = (folderPath, name) => setDeleteTarget({ type: 'folder', name, folder: normalizeFolder(folderPath) })
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.type === 'file') {
        await filesApi.deleteFile(deleteTarget.file.key)
        if (selected?.key === deleteTarget.file.key) setSelected(null)
        if (preview.file?.key === deleteTarget.file.key) preview.closePreview()
        toast.success(`“${deleteTarget.name}” was permanently deleted.`)
      } else {
        await filesApi.deleteFolder(deleteTarget.folder)
        toast.success(`Folder “${deleteTarget.name}” and its contents were permanently deleted.`)
      }
      setDeleteTarget(null)
      await query.refetch()
    } catch (error) {
      toast.error(error?.message || 'Deletion failed. Nothing else was changed.')
    } finally {
      setDeleting(false)
    }
  }

  return <div className={`page files-page ${selected ? 'has-details' : ''}`}>
    <div className="files-main">
      <div className="files-heading"><div>{folder && <button className="back-btn" onClick={goBack} aria-label="Go back"><ChevronLeft size={20} /></button>}<div><FileBreadcrumbs folder={folder} onNavigate={navigateFolder} /><p>{loadedFiles.length} files and {folders.length} folders currently loaded</p></div></div><span className="search-scope">Search applies to loaded results</span></div>
      <FileToolbar search={search} onSearch={setSearch} view={view} onView={setView} sort={sort} onSort={setSort} type={type} onType={setType} onUpload={() => setUploadOpen(true)} onCreateFolder={() => setCreateFolderOpen(true)} onRefresh={query.refetch} canUpload={can(PERMISSIONS.UPLOAD_FILES)} refreshing={query.isFetching} />
      {query.isLoading ? <LoadingSkeleton rows={view === 'grid' ? 8 : 6} cards={view === 'grid'} /> : query.isError ? <ErrorState message={query.error.status === 500 ? 'The request reached AWS, but the storage service failed. Check the Lambda logs and its S3 permissions.' : query.error.message} requestId={query.error.requestId} onRetry={query.refetch} /> : <>
        {folders.length > 0 && !debouncedSearch && type === 'all' && <section className="folder-section"><h2>Folders</h2><div className="folder-grid">{folders.map((item) => <FolderCard key={item} folder={item} onOpen={() => navigateFolder(normalizeFolder(item))} onDelete={requestFolderDelete} canDelete={canDeleteFolders} />)}</div></section>}
        <section className="file-section"><div className="file-section-title"><h2>Files</h2><span>{files.length} visible</span></div>
          {files.length ? view === 'grid' ? <div className="file-grid">{files.map((file) => <FileCard key={file.key} file={file} selected={selected?.key === file.key} onSelect={() => setSelected(file)} onPreview={preview.openPreview} onDownload={download} onDelete={requestFileDelete} canDelete={canDeleteFiles} downloading={downloading} />)}</div> : <FileTable files={files} selectedKey={selected?.key} onSelect={setSelected} onPreview={preview.openPreview} onDownload={download} onDelete={requestFileDelete} canDelete={canDeleteFiles} downloading={downloading} /> : <EmptyState icon={debouncedSearch || type !== 'all' ? SearchX : FolderOpen} title={debouncedSearch || type !== 'all' ? 'No matching loaded files' : 'This folder is empty'} description={debouncedSearch || type !== 'all' ? 'Try changing your search or filter. Search only covers results already loaded.' : can(PERMISSIONS.UPLOAD_FILES) ? 'Create a folder or upload a file to organize this location.' : 'There are no files available in this folder.'} action={can(PERMISSIONS.UPLOAD_FILES) && !debouncedSearch && type === 'all' ? <div className="empty-actions"><Button variant="secondary" onClick={() => setCreateFolderOpen(true)}><FolderOpen size={17} />New folder</Button><Button onClick={() => setUploadOpen(true)}><CloudUpload size={17} />Upload files</Button></div> : null} />}
        </section>
        {query.hasNextPage && <div className="load-more"><Button variant="secondary" loading={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>Load more results</Button><span>Additional API pages are available.</span></div>}
      </>}
    </div>
    <FileDetailsPanel file={selected} onClose={() => setSelected(null)} onPreview={preview.openPreview} onDownload={download} onDelete={requestFileDelete} canDelete={canDeleteFiles} downloading={downloading} />
    <UploadManager open={uploadOpen} onClose={() => setUploadOpen(false)} folder={folder} filesApi={filesApi} onComplete={query.refetch} />
    <CreateFolderModal open={createFolderOpen} onClose={() => setCreateFolderOpen(false)} parentFolder={folder} filesApi={filesApi} onComplete={query.refetch} />
    <DeleteConfirmationModal target={deleteTarget} deleting={deleting} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
    {preview.file && <Suspense fallback={null}><FilePreviewModal key={preview.file.key} file={preview.file} filesApi={filesApi} onClose={preview.closePreview} onDownload={download} onPrevious={preview.previous} onNext={preview.next} hasPrevious={preview.hasPrevious} hasNext={preview.hasNext} /></Suspense>}
  </div>
}
