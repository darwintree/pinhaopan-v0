import { useState, useEffect } from 'react'
import quest from '@/public/list/quest.json'

export interface Quest {
  quest: string
  name: string
  image?: string
  customImage?: string
  category: string
}

interface RawQuest {
  chapter_id: string
  quest_name: string
  thumbnail_image?: string
  custom_thumbnail_image?: string
  category: string
}

export function useQuestList() {
  const [questList, setQuestList] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchQuestList() {
      try {
        setLoading(true)
        const jsonData = quest as RawQuest[]
        setQuestList(jsonData.map(quest => ({
          quest: quest.chapter_id,
          name: quest.quest_name,
          image: quest.thumbnail_image,
          customImage: quest.custom_thumbnail_image,
          category: quest.category
        })))
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchQuestList()
  }, [])

  return { questList, loading, error }
}
