import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import DeleteConfirmationModal from './DeleteConfirmationModal.jsx'

describe('delete confirmation modal', () => {
  it('requires the exact word delete before permanently deleting', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined)
    render(<DeleteConfirmationModal target={{ type: 'file', name: 'records.pdf' }} deleting={false} onClose={vi.fn()} onConfirm={onConfirm} />)
    const button = screen.getByRole('button', { name: /delete permanently/i })
    expect(button).toBeDisabled()
    fireEvent.change(screen.getByLabelText(/type delete to confirm/i), { target: { value: 'DELETE' } })
    expect(button).toBeDisabled()
    fireEvent.change(screen.getByLabelText(/type delete to confirm/i), { target: { value: 'delete' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    await waitFor(() => expect(onConfirm).toHaveBeenCalledOnce())
  })
})
