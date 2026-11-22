import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import FileTable from './FileTable.jsx'

describe('file table', () => {
  it('opens preview directly from the filename without selecting or downloading', () => {
    const file = { key: 'company/Data/notes.env', name: 'notes.env', size: 20, lastModified: '2026-01-01' }
    const onPreview = vi.fn()
    const onSelect = vi.fn()
    const onDownload = vi.fn()
    render(<FileTable files={[file]} onPreview={onPreview} onSelect={onSelect} onDownload={onDownload} />)

    fireEvent.click(screen.getByRole('button', { name: /preview notes.env/i }))
    expect(onPreview).toHaveBeenCalledWith(file)
    expect(onSelect).not.toHaveBeenCalled()
    expect(onDownload).not.toHaveBeenCalled()
  })
})
