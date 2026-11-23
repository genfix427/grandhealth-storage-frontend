import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import FileEditorModal from './FileEditorModal.jsx'
import { PREVIEW_KINDS } from '../../utils/previewTypes.js'

const wordMocks = vi.hoisted(() => ({
  importDocx: vi.fn().mockResolvedValue(undefined),
  destroy: vi.fn(),
  toBlob: vi.fn().mockResolvedValue(new Blob(['edited docx'])),
  onUpdate: null,
}))

vi.mock('@raazkhnl/rk-editor-ui', () => ({
  EditorShell: class {
    constructor(options) {
      wordMocks.onUpdate = options.onUpdate
      this.editor = {
        importDocx: wordMocks.importDocx,
        styleManager: {},
        getJSON: () => ({ type: 'doc', content: [] }),
        getPageLayout: () => ({ pageSize: 'Letter' }),
      }
    }
    destroy() { wordMocks.destroy() }
  },
}))

vi.mock('@raazkhnl/rk-editor-core', () => ({
  ExportEngine: class { toBlob(...args) { return wordMocks.toBlob(...args) } },
}))

afterEach(() => vi.restoreAllMocks())

describe('file editor', () => {
  it('edits text and saves a new secure cloud copy', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('original text', { status: 200, headers: { 'content-length': '13' } })))
    const filesApi = { saveEditedCopy: vi.fn().mockResolvedValue({ key: 'company/notes-edited.txt' }) }
    const onSaved = vi.fn()
    render(<FileEditorModal file={{ key: 'company/notes.txt', name: 'notes.txt', size: 13 }} kind={PREVIEW_KINDS.TEXT} url="https://s3.example/notes" filesApi={filesApi} onClose={vi.fn()} onDownload={vi.fn()} onSaved={onSaved} />)
    const editor = await screen.findByRole('textbox', { name: /edit contents/i })
    fireEvent.change(editor, { target: { value: 'updated text' } })
    fireEvent.click(screen.getByRole('button', { name: /save edited copy/i }))
    await waitFor(() => expect(filesApi.saveEditedCopy).toHaveBeenCalledWith(expect.objectContaining({ filename: 'notes-edited.txt', folder: '', data: expect.any(Blob) })))
    expect(onSaved).toHaveBeenCalled()
    expect(await screen.findByText(/saved securely as notes-edited.txt/i)).toBeInTheDocument()
  })

  it('supports revised copies for binary formats while enforcing the extension', async () => {
    const filesApi = { saveEditedCopy: vi.fn().mockResolvedValue({ key: 'company/scan-edited.pdf' }) }
    const { container } = render(<FileEditorModal file={{ key: 'company/scan.pdf', name: 'scan.pdf', size: 100 }} kind={PREVIEW_KINDS.PDF} filesApi={filesApi} onClose={vi.fn()} onDownload={vi.fn()} />)
    const input = container.querySelector('input[type="file"]')
    fireEvent.change(input, { target: { files: [new File(['bad'], 'scan.docx')] } })
    expect(await screen.findByText(/choose a .pdf file/i)).toBeInTheDocument()
    fireEvent.change(input, { target: { files: [new File(['revised'], 'scan-revised.pdf')] } })
    fireEvent.click(screen.getByRole('button', { name: /save edited copy/i }))
    await waitFor(() => expect(filesApi.saveEditedCopy).toHaveBeenCalledWith(expect.objectContaining({ filename: 'scan-edited.pdf', data: expect.any(File) })))
  })

  it('opens DOCX files in the browser editor and saves an exported DOCX revision', async () => {
    wordMocks.importDocx.mockResolvedValue(undefined)
    wordMocks.toBlob.mockResolvedValue(new Blob(['edited docx']))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('docx bytes', { status: 200, headers: { 'content-length': '10' } })))
    const filesApi = { saveEditedCopy: vi.fn().mockResolvedValue({ key: 'company/report-edited.docx' }) }
    render(<FileEditorModal file={{ key: 'company/report.docx', name: 'report.docx', size: 10 }} kind={PREVIEW_KINDS.DOCX} url="https://s3.example/report" filesApi={filesApi} onClose={vi.fn()} onDownload={vi.fn()} />)
    await waitFor(() => expect(wordMocks.importDocx).toHaveBeenCalledWith(expect.objectContaining({ name: 'report.docx' })))
    expect(screen.queryByText(/native app workflow/i)).not.toBeInTheDocument()
    act(() => wordMocks.onUpdate())
    const saveButton = screen.getByRole('button', { name: /save edited copy/i })
    await waitFor(() => expect(saveButton).toBeEnabled())
    fireEvent.click(saveButton)
    await waitFor(() => expect(filesApi.saveEditedCopy).toHaveBeenCalledWith(expect.objectContaining({ filename: 'report-edited.docx', data: expect.any(Blob) })))
  })
})
