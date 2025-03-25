export interface GuideData {
  id: string
  name: string
  time: number
  date: string
  team: string[]
  weapons: string[]
  summons: string[]
  tags: string[]
  description: string
}

interface EquipmentProperties {
  lv?: number
  luci2?: string
  luci3?: string
  u1?: string
  u2?: string
  u3?: string
  awake?: string
}

export interface EquipmentData {
  id: string
  type: EquipmentType
  properties?: EquipmentProperties
}

// 根据id和type可以取得的详细数据
export interface DetailedEquipmentData extends EquipmentData {
  name: string
  category: string
}

export interface EquipmentFilterCondition extends EquipmentData {
  include: boolean  // true 表示包含，false 表示排除
  count: number
}

export type EquipmentType = "summon" | "chara" | "weapon"

export function getEquipmentImage(id: string, type: EquipmentType) {
  return `/equipment/${type}/${id}.png`
}

