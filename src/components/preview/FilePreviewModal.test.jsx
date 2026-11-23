import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import FilePreviewModal from './FilePreviewModal.jsx'

vi.mock('./TextPreview.jsx', () => ({ default: ({ file }) => <div>Text preview ready for {file.name}</div> }))
vi.mock('./LegacyWordPreview.jsx', () => ({ default: ({ file }) => <div>Legacy Word preview ready for {file.name}</div> }))
vi.mock('./FileEditorModal.jsx', () => ({ default: ({ file }) => <div role="dialog">Editor ready for {file.name}</div> }))

const baseProps = { onClose: vi.fn(), onDownload: vi.fn(), onPrevious: vi.fn(), onNext: vi.fn(), hasPrevious: true, hasNext: true }

describe('file preview modal', () => {
  it('opens an honest unsupported fallback and handles keyboard navigation', async () => {
    const props = { ...baseProps, onClose: vi.fn(), onPrevious: vi.fn(), onNext: vi.fn() }
    render(<FilePreviewModal {...props} file={{ key: 'archive', name: 'records.zip', size: 10, lastModified: '2026-01-01' }} filesApi={{ createPreviewUrl: vi.fn() }} />)
    expect(await screen.findByRole('dialog', { name: /preview records.zip/i })).toBeInTheDocument()
    expect(await screen.findByText('Preview not supported')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(props.onPrevious).toHaveBeenCalledOnce()
    expect(props.onNext).toHaveBeenCalledOnce()
    expect(props.onClose).toHaveBeenCalledOnce()
  })

  it('shows a retryable error when signed URL generation fails', async () => {
    const filesApi = { createPreviewUrl: vi.fn().mockRejectedValue(new Error('network')) }
    render(<FilePreviewModal {...baseProps} file={{ key: 'image', name: 'scan.png', size: 10, lastModified: '2026-01-01' }} filesApi={filesApi} />)
    await waitFor(() => expect(screen.getByText('Preview unavailable')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /retry preview/i })).toBeInTheDocument()
  })

  it('opens env files in the text preview renderer', async () => {
    const filesApi = { createPreviewUrl: vi.fn().mockResolvedValue({ url: 'https://s3.example/private-text' }) }
    render(<div className="page"><FilePreviewModal {...baseProps} file={{ key: 'company/Data/professional portfolio.env', name: 'professional portfolio.env', size: 378, lastModified: '2026-01-01' }} filesApi={filesApi} /></div>)
    expect(await screen.findByText('Text preview ready for professional portfolio.env')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: /preview professional portfolio.env/i }).parentElement).toBe(document.body)
    expect(filesApi.createPreviewUrl).toHaveBeenCalledWith('company/Data/professional portfolio.env', expect.any(AbortSignal))
  })

  it('loads a signed URL and opens legacy doc files in the local Word renderer', async () => {
    const filesApi = { createPreviewUrl: vi.fn().mockResolvedValue({ url: 'https://s3.example/private-doc' }) }
    render(<FilePreviewModal {...baseProps} file={{ key: 'records/letter.doc', name: 'letter.doc', size: 1536, lastModified: '2026-01-01' }} filesApi={filesApi} />)
    expect(await screen.findByText('Legacy Word preview ready for letter.doc')).toBeInTheDocument()
    expect(filesApi.createPreviewUrl).toHaveBeenCalledWith('records/letter.doc', expect.any(AbortSignal))
  })

  it('only exposes the editor to users with edit permission', async () => {
    const filesApi = { createPreviewUrl: vi.fn().mockResolvedValue({ url: 'https://s3.example/private-text' }) }
    const { rerender } = render(<FilePreviewModal {...baseProps} canEdit file={{ key: 'notes.txt', name: 'notes.txt', size: 10 }} filesApi={filesApi} />)
    const editButton = await screen.findByRole('button', { name: /edit/i })
    fireEvent.click(editButton)
    expect(await screen.findByText('Editor ready for notes.txt')).toBeInTheDocument()
    rerender(<FilePreviewModal {...baseProps} canEdit={false} file={{ key: 'notes.txt', name: 'notes.txt', size: 10 }} filesApi={filesApi} />)
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
  })
})
