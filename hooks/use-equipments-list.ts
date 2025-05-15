import { useState, useEffect } from 'react'
import { DetailedEquipmentData } from '@/lib/types'
import chara from '@/public/list/chara.json'
import weapon from '@/public/list/weapon.json'
import summon from '@/public/list/summon.json'


export interface EquipmentsList {
  "chara": DetailedEquipmentData[],
  "weapon": DetailedEquipmentData[],
  "summon": DetailedEquipmentData[],
}

const seriesNameToChineseMap = {
  "[レヴァンスウェポン]": "[六属高难(机神)]",
  "[マグナシリーズ]": "[方阵1.0]",
  "[レガリアシリーズ]": "[方阵2.0]",
  "[マグナ・リバースシリーズ]": "[方阵3.0]",
  "[ワールドシリーズ]": "[世界琴]",
  "[リミテッドシリーズ]": "[LM]",
  "[エニアドシリーズ]": "[九柱神]",
  "[アンセスタルシリーズ]": "[龙武(掉落)]",
  "[ドラゴニックウェポン]": "[龙武(制作)]",
  "[ドラゴニックウェポン・オリジン]": "[龙武·起源]",
  "[アストラルウェポン]": "[巴布武]",
  "[オメガウェポン]": "[U武]",
  "[バハムートウェポン]": "[巴武]",
  "[ルミナスシリーズ]": "[新石油(150金月)]",
  "[スペリオルシリーズ]": "[石油武(100金月)]",
  "[ヴィンテージシリーズ]": "[金月武(30金月)]",
}

function seriesNameToChinese(seriesName: string) {
  if (seriesName in seriesNameToChineseMap) {
    return seriesNameToChineseMap[seriesName as keyof typeof seriesNameToChineseMap]
  }
  return seriesName
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
    if (item["series_name"]) {
      categories.push(seriesNameToChinese(item["series_name"]))
    }
    const result = {
      id: item.ID,
      name: item.name_chs,
      categories,
      element: normalizeElement(item.element),
      awaken: item["awaken[]"] ? item["awaken[]"].split(";").filter((awaken: string) => !awaken.startsWith("EX")) : undefined,
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
          chara: parseListToDetailedEquipmentData(chara),
          weapon: parseListToDetailedEquipmentData(weapon),
          summon: parseListToDetailedEquipmentData(summon),
        }
        data.chara.forEach((chara) => {
          chara.awaken = ["攻击","防御","连击"]
        })
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