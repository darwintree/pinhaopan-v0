import { useState, useEffect } from 'react'

export interface Tag {
  name: string
  description: string
  categories: string[]
  color: string
}


export function useTagList() {
  const [tagList, setTagList] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchTagList() {
      try {
        setLoading(true)
        const response = await fetch('/list/tags.json')
        if (!response.ok) {
          throw new Error('Failed to fetch quest list')
        }
        const jsonData = await response.json() as Tag[]
        setTagList(jsonData)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchTagList()
  }, [])

  return { tagList, loading, error }
}
