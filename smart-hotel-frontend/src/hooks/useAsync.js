import { useCallback, useEffect, useState } from 'react'

export function useAsync(fetcher, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await fetcher()
      setData(result)
      return result
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Có lỗi xảy ra')
      throw err
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => {
    reload().catch(() => {})
  }, [reload])

  return { data, loading, error, reload, setData }
}

export function usePagination(initial = { page: 1, pageSize: 20 }) {
  const [page, setPage] = useState(initial.page)
  const [pageSize, setPageSize] = useState(initial.pageSize)
  const [meta, setMeta] = useState({})

  return { page, setPage, pageSize, setPageSize, meta, setMeta }
}

export function getErrorMessage(err) {
  return err?.response?.data?.error?.message || err?.message || 'Có lỗi xảy ra'
}
