import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { env } from '../config/env.js'
import { useAuth } from '../auth/useAuth.js'
import { createApiClient } from '../api/apiClient.js'
import { createFilesApi } from '../api/filesApi.js'

export function useFilesApi() {
  const { getAccessToken } = useAuth()
  return useMemo(() => createFilesApi(createApiClient({ baseUrl: env.apiBaseUrl, getAccessToken })), [getAccessToken])
}

export function useFiles(folder = '') {
  const filesApi = useFilesApi()
  return useInfiniteQuery({
    queryKey: ['files', folder],
    queryFn: ({ pageParam, signal }) => filesApi.list({ folder, cursor: pageParam, signal }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage?.nextCursor || undefined,
  })
}
