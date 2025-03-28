import { useState, useEffect } from 'react'
import { DetailedEquipmentData } from '@/lib/types'

export interface EquipmentsList {
  "chara": DetailedEquipmentData[],
  "weapon": DetailedEquipmentData[],
  "summon": DetailedEquipmentData[],
}

function normalizeElement(element: string) {
  switch (element) {
    case "1":
      return "火"
    case "2":
      return "水"
    case "3":
      return "土"
    case "4":
      return "风"
    case "5":
      return "光"
    case "6":
      return "暗"
    default:
      return element
  }
}

function parseListToDetailedEquipmentData(list: any): DetailedEquipmentData[] {
  const results = list.filter((item: any) =>
    !!item.ID && item.ID !== "0" && (item.rarity === "SSR" || item.rarity === "4")
  ).map((item: any) => {
    let categories = []
    if (item["category"]) {
      categories.push(item["category"])
    }
    if (item["category[]"]) {
      categories.push(...item["category[]"].split(";"))
    }
    if (item["tag[]"]) {
      categories.push(...item["tag[]"].split(";"))
    }
    const result = {
      id: item.ID,
      name: item.name_chs,
      categories,
      element: normalizeElement(item.element),
    }
    return result
  })
  return results
}

export function useEquipmentsList() {
  const [equipmentsList, setEquipmentsList] = useState<EquipmentsList>({
    chara: [],
    weapon: [],
    summon: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchEquipmentsList() {
      try {
        setLoading(true)
        let data: EquipmentsList = {
          chara: [],
          weapon: [],
          summon: [],
        }
        for (const type of ["chara", "weapon", "summon"]) {
          const response = await fetch(`/list/${type}.json`)
          if (!response.ok) {
            throw new Error('Failed to fetch equipments')
          }
          const json_data = await response.json()
          data[type as keyof EquipmentsList] = parseListToDetailedEquipmentData(json_data)
        }
        setEquipmentsList(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchEquipmentsList()
  }, [])

  return { equipmentsList, loading, error }
} 