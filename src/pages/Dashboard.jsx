import { lazy, Suspense, useMemo, useState } from 'react'
import { ArrowUpRight, Cloud, Files, FolderOpen, HardDrive, LockKeyhole, Plus, ShieldCheck, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { toast } from 'sonner'
import { useAuth } from '../auth/useAuth.js'
import { PERMISSIONS } from '../auth/permissions.js'
import { useFiles, useFilesApi } from '../hooks/useFiles.js'
import { useFilePreview } from '../hooks/useFilePreview.js'
import { formatBytes, formatRelativeDate } from '../utils/formatters.js'
import { getFileType } from '../utils/fileTypes.js'
import { isFolderMarker } from '../utils/validators.js'
import Button from '../components/ui/Button.jsx'
import LoadingSkeleton from '../components/ui/LoadingSkeleton.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import FileIcon from '../components/files/FileIcon.jsx'
import UploadManager from '../components/files/UploadManager.jsx'

const FilePreviewModal = lazy(() => import('../components/preview/FilePreviewModal.jsx'))

const palette = ['#2563eb', '#14b8a6', '#8b5cf6', '#f59e0b', '#64748b']

function StatCard({ icon: Icon, label, value, note, tone }) {
  return <article className="stat-card"><span className={`stat-icon ${tone}`}><Icon size={20} /></span><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { identity, can } = useAuth()
  const query = useFiles('')
  const filesApi = useFilesApi()
  const [uploadOpen, setUploadOpen] = useState(false)
  const files = useMemo(() => (query.data?.pages.flatMap((page) => page.files || []) || []).filter((file) => !isFolderMarker(file)), [query.data])
  const folders = useMemo(() => query.data?.pages.flatMap((page) => page.folders || []) || [], [query.data])
  const totalSize = files.reduce((sum, file) => sum + (Number(file.size) || 0), 0)
  const breakdown = useMemo(() => Object.entries(files.reduce((acc, file) => { const type = getFileType(file.name); acc[type] = (acc[type] || 0) + 1; return acc }, {})).map(([name, value]) => ({ name, value })), [files])
  const recent = [...files].sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified)).slice(0, 5)
  const preview = useFilePreview(recent)
  const download = async (file) => {
    try {
      const { url } = await filesApi.createDownloadUrl(file.key)
      const link = document.createElement('a'); link.href = url; link.download = file.name; link.rel = 'noopener'; document.body.appendChild(link); link.click(); link.remove()
      toast.success('Your secure download has started.')
    } catch (error) { toast.error(error.message || 'File download failed. Please try again.') }
  }

  return <div className="page dashboard-page">
    <section className="welcome-card"><div><span className="eyebrow light"><ShieldCheck size={15} />Secure workspace</span><h2>Welcome to Grand Health Storage</h2><p>Your secure workspace for company files.</p><div className="welcome-actions">{can(PERMISSIONS.UPLOAD_FILES) && <Button variant="white" onClick={() => setUploadOpen(true)}><Plus size={18} />Quick upload</Button>}<Button variant="glass" onClick={() => navigate('/files')}><FolderOpen size={18} />Browse files</Button></div></div><div className="welcome-orb" aria-hidden="true"><Cloud size={54} /><span className="orb-lock"><LockKeyhole size={18} /></span></div></section>
    <div className="section-heading"><div><h2>Workspace snapshot</h2><p>Calculated from the results currently loaded from the API.</p></div><span className="data-scope">Loaded results only</span></div>
    {query.isLoading ? <LoadingSkeleton rows={4} cards /> : query.isError ? <ErrorState message={query.error.status === 500 ? 'The request reached AWS, but the storage service failed. Check the Lambda logs and its S3 permissions.' : query.error.message} requestId={query.error.requestId} onRetry={query.refetch} /> : <div className="stats-grid"><StatCard icon={Files} label="Files loaded" value={files.length} note="Current root results" tone="blue" /><StatCard icon={FolderOpen} label="Folders loaded" value={folders.length} note="Current root results" tone="teal" /><StatCard icon={HardDrive} label="Loaded file size" value={formatBytes(totalSize)} note="Not total storage usage" tone="violet" /><StatCard icon={UserRound} label="Current role" value={identity.role} note="From Cognito groups" tone="amber" /></div>}
    <div className="dashboard-grid">
      <section className="panel recent-panel"><header><div><h2>Recently modified</h2><p>From currently loaded files · select a file to preview</p></div><button className="text-link" onClick={() => navigate('/files')}>View all <ArrowUpRight size={15} /></button></header>{recent.length ? <div className="recent-list">{recent.map((file) => <button key={file.key} onClick={() => preview.openPreview(file)}><FileIcon name={file.name} /><span><strong>{file.name}</strong><small>{formatBytes(file.size)}</small></span><time>{formatRelativeDate(file.lastModified)}</time></button>)}</div> : <div className="mini-empty"><Files size={24} /><span>No files are loaded yet.</span></div>}</section>
      <section className="panel breakdown-panel"><header><div><h2>Loaded file types</h2><p>Breakdown of visible results</p></div></header>{breakdown.length ? <div className="chart-wrap"><ResponsiveContainer width="100%" height={210}><PieChart><Pie data={breakdown} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3}>{breakdown.map((entry, index) => <Cell key={entry.name} fill={palette[index % palette.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="chart-center"><strong>{files.length}</strong><span>files</span></div><div className="chart-legend">{breakdown.slice(0, 5).map((item, index) => <span key={item.name}><i style={{ background: palette[index % palette.length] }} />{item.name}<b>{item.value}</b></span>)}</div></div> : <div className="mini-empty"><HardDrive size={24} /><span>File types appear after files load.</span></div>}</section>
      <section className="panel security-panel"><span className="security-shield"><ShieldCheck size={28} /></span><div><h2>Protected by design</h2><p>Files stay private in AWS S3. Access is authorized through Cognito, and downloads use short-lived links.</p><ul><li>Role-based access</li><li>No AWS keys in your browser</li><li>Temporary file links</li></ul></div></section>
    </div>
    <UploadManager open={uploadOpen} onClose={() => setUploadOpen(false)} folder="" filesApi={filesApi} onComplete={query.refetch} />
    {preview.file && <Suspense fallback={null}><FilePreviewModal key={preview.file.key} file={preview.file} filesApi={filesApi} onClose={preview.closePreview} onDownload={download} onPrevious={preview.previous} onNext={preview.next} hasPrevious={preview.hasPrevious} hasNext={preview.hasNext} /></Suspense>}
  </div>
}
