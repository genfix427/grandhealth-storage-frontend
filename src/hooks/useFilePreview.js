import { useCallback, useMemo, useState } from 'react'

export function useFilePreview(files = []) {
  const [activeKey, setActiveKey] = useState(null)
  const activeIndex = useMemo(() => files.findIndex((file) => file.key === activeKey), [files, activeKey])
  const file = activeIndex >= 0 ? files[activeIndex] : null

  const openPreview = useCallback((nextFile) => setActiveKey(nextFile?.key || null), [])
  const closePreview = useCallback(() => setActiveKey(null), [])
  const previous = useCallback(() => { if (activeIndex > 0) setActiveKey(files[activeIndex - 1].key) }, [activeIndex, files])
  const next = useCallback(() => { if (activeIndex >= 0 && activeIndex < files.length - 1) setActiveKey(files[activeIndex + 1].key) }, [activeIndex, files])

  return { file, openPreview, closePreview, previous, next, hasPrevious: activeIndex > 0, hasNext: activeIndex >= 0 && activeIndex < files.length - 1 }
}
