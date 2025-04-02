export interface GuideData {
  id: string
  quest: string
  time: number
  date: number
  charas: EquipmentData[]
  weapons: EquipmentData[]
  summons: EquipmentData[]
  tags: string[]
  description: string
}


// 发布攻略时，需要提交的数据
export interface GuidePostData {
  quest: string  // 副本id
  time?: number  // 通关时间(可选)
  charas: EquipmentData[]  // 角色
  charasBase64: string  // 角色图片base64 宽度不超过600px 高度不超过600px, 否则按比例缩放
  weapons: EquipmentData[]  // 武器
  weaponsBase64: string  // 武器图片base64 宽度不超过600px 高度不超过600px, 否则按比例缩放
  summons: EquipmentData[]  // 召唤
  summonsBase64: string  // 召唤图片base64 宽度不超过600px 高度不超过600px, 否则按比例缩放
  tags: string[]  // 检查是否在tagList内
  description: string  // 备注
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
  categories: string[]
  element: string
}

export interface EquipmentFilterCondition extends EquipmentData {
  include: boolean  // true 表示包含，false 表示排除
  count: number
}

export type EquipmentType = "summon" | "chara" | "weapon"

export function getEquipmentImage(id: string, type: EquipmentType) {
  return `/equipment/${type}/${id}.png`
}

export type DetectEquipmentType = "weapon/main" | "weapon/normal" | "summon/party_main" | "summon/party_sub" | "chara"

export interface EquipmentDetectResults {
  id: string
  confidence: number
}[]

// API 查询参数类型
export interface GuideQueryParams {
  quest?: string
  tags?: string[]
  timeRange?: [number, number]
  dateRange?: [Date, Date]
  sort?: {
    field: "time" | "date"
    direction: "asc" | "desc"
  }
  weaponConditions?: EquipmentFilterCondition[]
  summonConditions?: EquipmentFilterCondition[]
  charaConditions?: EquipmentFilterCondition[]
}
