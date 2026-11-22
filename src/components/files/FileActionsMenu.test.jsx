import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import FileActionsMenu from './FileActionsMenu.jsx'

describe('file actions menu', () => {
  it('opens preview without triggering download', () => {
    const file = { key: 'file', name: 'report.pdf' }
    const onPreview = vi.fn()
    const onDownload = vi.fn()
    render(<FileActionsMenu file={file} onPreview={onPreview} onDownload={onDownload} />)
    fireEvent.click(screen.getByRole('button', { name: /actions for report.pdf/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /preview/i }))
    expect(onPreview).toHaveBeenCalledWith(file)
    expect(onDownload).not.toHaveBeenCalled()
  })

  it('shows the destructive action only when deletion is authorized', () => {
    const file = { key: 'file', name: 'report.pdf' }
    const onDelete = vi.fn()
    const { rerender } = render(<FileActionsMenu file={file} onPreview={vi.fn()} onDownload={vi.fn()} onDelete={onDelete} canDelete={false} />)
    fireEvent.click(screen.getByRole('button', { name: /actions for report.pdf/i }))
    expect(screen.queryByRole('menuitem', { name: /delete/i })).not.toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    rerender(<FileActionsMenu file={file} onPreview={vi.fn()} onDownload={vi.fn()} onDelete={onDelete} canDelete />)
    fireEvent.click(screen.getByRole('button', { name: /actions for report.pdf/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /delete/i }))
    expect(onDelete).toHaveBeenCalledWith(file)
  })
})
