import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useFilePreview } from './useFilePreview.js'

const files = [{ key: 'a', name: 'a.pdf' }, { key: 'b', name: 'b.pdf' }, { key: 'c', name: 'c.pdf' }]

describe('file preview navigation', () => {
  it('opens, navigates, and closes within the visible file collection', () => {
    const { result } = renderHook(() => useFilePreview(files))
    act(() => result.current.openPreview(files[1]))
    expect(result.current.file).toEqual(files[1])
    expect(result.current.hasPrevious).toBe(true)
    expect(result.current.hasNext).toBe(true)
    act(() => result.current.next())
    expect(result.current.file).toEqual(files[2])
    act(() => result.current.previous())
    expect(result.current.file).toEqual(files[1])
    act(() => result.current.closePreview())
    expect(result.current.file).toBeNull()
  })
})
