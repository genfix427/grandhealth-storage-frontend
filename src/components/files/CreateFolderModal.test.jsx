import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createFolder } from '../../api/createFolder.js'
import CreateFolderModal from './CreateFolderModal.jsx'

vi.mock('../../api/createFolder.js', () => ({ createFolder: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }))

describe('create folder modal', () => {
  it('creates a folder with spaces and refreshes the current listing', async () => {
    createFolder.mockResolvedValue('reports/Annual Reports/')
    const onClose = vi.fn()
    const onComplete = vi.fn().mockResolvedValue(undefined)
    const filesApi = {}

    render(<CreateFolderModal open onClose={onClose} parentFolder="reports/" filesApi={filesApi} onComplete={onComplete} />)
    fireEvent.change(screen.getByLabelText('Folder name'), { target: { value: 'Annual Reports' } })
    fireEvent.click(screen.getByRole('button', { name: /create folder/i }))

    await waitFor(() => expect(createFolder).toHaveBeenCalledWith(filesApi, 'reports/', 'Annual Reports'))
    expect(onComplete).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })
})
