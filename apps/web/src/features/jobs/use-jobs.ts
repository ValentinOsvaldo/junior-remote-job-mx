import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { useDeferredValue } from 'react'
import { fetchJobsPage } from '../../lib/jobs-source.ts'
import { useStore } from '../../store/filters.ts'

/** Shared by the list, the filters (facets) and the result count; react-query dedupes by key. */
export function useJobs() {
  const q = useDeferredValue(useStore((s) => s.q)) // keep typing responsive
  const filters = useStore((s) => s.filters)
  const sort = useStore((s) => s.sort)
  const saved = useStore((s) => s.saved)
  const query = { q, filters, sort, saved: filters.savedOnly ? saved : [] }

  return useInfiniteQuery({
    queryKey: ['jobs', query],
    queryFn: ({ pageParam }) => fetchJobsPage(query, pageParam),
    initialPageParam: 0,
    getNextPageParam: (page) => page.nextCursor,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  })
}
