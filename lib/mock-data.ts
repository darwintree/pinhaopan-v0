import type { GuideData } from "./types"

// Equipment related types
export type EquipmentType = "summon" | "chara" | "weapon"
export type Equipment = {
  id: string
  name: string
  element: string
  category: string
  image: string
}

// Available tags for filtering
export const availableTags = ["速刷", "新手向", "无氪", "高难度", "稳定", "高伤害", "自动化"]

// Available weapons and summons for filtering
export const availableWeapons = ["光剑", "暗刀", "水弓", "火杖", "土枪", "风拳"]
export const availableSummons = ["巴哈姆特", "路西法", "宙斯", "提亚马特", "欧罗巴"]

// Mock equipment data
export const mockEquipment = {
  summon: [
    { id: "s1", name: "巴哈姆特", element: "dark", category: "main", image: "/placeholder.svg?height=80&width=80" },
    { id: "s2", name: "路西法", element: "dark", category: "sub", image: "/placeholder.svg?height=80&width=80" },
    { id: "s3", name: "宙斯", element: "light", category: "main", image: "/placeholder.svg?height=80&width=80" },
    { id: "s4", name: "提亚马特", element: "wind", category: "main", image: "/placeholder.svg?height=80&width=80" },
    { id: "s5", name: "欧罗巴", element: "water", category: "main", image: "/placeholder.svg?height=80&width=80" },
    { id: "s6", name: "阿格尼", element: "fire", category: "main", image: "/placeholder.svg?height=80&width=80" },
    { id: "s7", name: "泰坦", element: "earth", category: "main", image: "/placeholder.svg?height=80&width=80" },
    { id: "s8", name: "西芙", element: "water", category: "sub", image: "/placeholder.svg?height=80&width=80" },
  ],
  chara: [
    { id: "c1", name: "角色1", element: "fire", category: "attacker", image: "/placeholder.svg?height=80&width=80" },
    { id: "c2", name: "角色2", element: "water", category: "defender", image: "/placeholder.svg?height=80&width=80" },
    { id: "c3", name: "角色3", element: "earth", category: "healer", image: "/placeholder.svg?height=80&width=80" },
    { id: "c4", name: "角色4", element: "wind", category: "attacker", image: "/placeholder.svg?height=80&width=80" },
    { id: "c5", name: "角色5", element: "light", category: "support", image: "/placeholder.svg?height=80&width=80" },
    { id: "c6", name: "角色6", element: "dark", category: "attacker", image: "/placeholder.svg?height=80&width=80" },
  ],
  weapon: [
    { id: "w1", name: "光剑", element: "light", category: "sword", image: "/placeholder.svg?height=80&width=80" },
    { id: "w2", name: "暗刀", element: "dark", category: "dagger", image: "/placeholder.svg?height=80&width=80" },
    { id: "w3", name: "水弓", element: "water", category: "bow", image: "/placeholder.svg?height=80&width=80" },
    { id: "w4", name: "火杖", element: "fire", category: "staff", image: "/placeholder.svg?height=80&width=80" },
    { id: "w5", name: "土枪", element: "earth", category: "spear", image: "/placeholder.svg?height=80&width=80" },
    { id: "w6", name: "风拳", element: "wind", category: "fist", image: "/placeholder.svg?height=80&width=80" },
    { id: "w7", name: "光杖", element: "light", category: "staff", image: "/placeholder.svg?height=80&width=80" },
    { id: "w8", name: "暗枪", element: "dark", category: "spear", image: "/placeholder.svg?height=80&width=80" },
    { id: "w9", name: "水刀", element: "water", category: "dagger", image: "/placeholder.svg?height=80&width=80" },
  ],
}

// Filter options for equipment
export const filterOptions = {
  summon: {
    elements: ["fire", "water", "earth", "wind", "light", "dark"],
    categories: ["main", "sub"],
  },
  chara: {
    elements: ["fire", "water", "earth", "wind", "light", "dark"],
    categories: ["attacker", "defender", "healer", "support"],
  },
  weapon: {
    elements: ["fire", "water", "earth", "wind", "light", "dark"],
    categories: ["sword", "dagger", "bow", "staff", "spear", "fist", "gun", "harp"],
  },
}

// Name translations
export const elementNames = {
  fire: "火",
  water: "水",
  earth: "土",
  wind: "风",
  light: "光",
  dark: "暗",
}

export const categoryNames = {
  // Summon categories
  main: "主召唤石",
  sub: "副召唤石",

  // Character categories
  attacker: "攻击手",
  defender: "防御手",
  healer: "治疗师",
  support: "辅助",

  // Weapon categories
  sword: "剑",
  dagger: "短剑",
  bow: "弓",
  staff: "杖",
  spear: "枪",
  fist: "拳",
  gun: "铳",
  harp: "竖琴",
}

export const mockGuides: GuideData[] = [
  {
    id: "1",
    name: "普罗米修斯HL",
    time: 5,
    date: "2023-12-15",
    team: ["角色1", "角色2", "角色3", "角色4", "角色5"],
    weapons: ["光剑", "光剑", "光剑", "光杖", "光杖", "光杖", "光弓", "光弓", "光弓"],
    summons: ["路西法", "宙斯", "巴哈姆特", "欧罗巴"],
    tags: ["速刷", "高伤害"],
    description: "这是一个普罗米修斯HL的速刷攻略",
  },
  {
    id: "2",
    name: "巴布萨HL",
    time: 8,
    date: "2023-12-10",
    team: ["角色1", "角色2", "角色3", "角色4"],
    weapons: ["水弓", "水弓", "水杖", "水杖", "水剑", "水剑"],
    summons: ["提亚马特", "欧罗巴"],
    tags: ["新手向", "稳定"],
    description: "这是一个巴布萨HL的新手攻略",
  },
  {
    id: "3",
    name: "路西法HL",
    time: 15,
    date: "2023-12-05",
    team: ["角色1", "角色2", "角色3", "角色4", "角色5"],
    weapons: ["暗刀", "暗刀", "暗刀", "暗杖", "暗杖", "暗杖"],
    summons: ["巴哈姆特", "路西法"],
    tags: ["高难度", "无氪"],
    description: "这是一个路西法HL的高难度攻略",
  },
  {
    id: "4",
    name: "阿努比斯HL",
    time: 10,
    date: "2023-11-28",
    team: ["角色1", "角色2", "角色3"],
    weapons: ["土枪", "土枪", "土枪", "土杖", "土杖"],
    summons: ["提亚马特", "宙斯"],
    tags: ["自动化", "稳定"],
    description: "这是一个阿努比斯HL的自动化攻略",
  },
  {
    id: "5",
    name: "修罗HL",
    time: 20,
    date: "2023-11-20",
    team: ["角色1", "角色2", "角色3", "角色4"],
    weapons: ["风拳", "风拳", "风拳", "风弓", "风弓"],
    summons: ["宙斯", "欧罗巴"],
    tags: ["高难度", "高伤害"],
    description: "这是一个修罗HL的高难度攻略",
  },
  {
    id: "6",
    name: "赫克托尔HL",
    time: 7,
    date: "2023-11-15",
    team: ["角色1", "角色2", "角色3", "角色4", "角色5"],
    weapons: ["火杖", "火杖", "火杖", "火剑", "火剑"],
    summons: ["巴哈姆特", "提亚马特"],
    tags: ["速刷", "新手向"],
    description: "这是一个赫克托尔HL的速刷攻略",
  },
]

// Mock recognition results
export const mockRecognitionResults = {
  weapon: {
    // 模拟不同位置的武器识别结果
    positions: [
      { id: 0, name: "光剑", confidence: 0.95 },
      { id: 1, name: "暗刀", confidence: 0.92 },
      { id: 2, name: "水弓", confidence: 0.88 },
      { id: 3, name: "火杖", confidence: 0.85 },
      { id: 4, name: "土枪", confidence: 0.90 },
      { id: 5, name: "风拳", confidence: 0.87 },
      { id: 6, name: "光杖", confidence: 0.86 },
      { id: 7, name: "暗枪", confidence: 0.89 },
      { id: 8, name: "水刀", confidence: 0.91 },
    ],
  },
  chara: {
    positions: [
      { id: 0, name: "角色1", confidence: 0.95 },
      { id: 1, name: "角色2", confidence: 0.92 },
      { id: 2, name: "角色3", confidence: 0.88 },
      { id: 3, name: "角色4", confidence: 0.85 },
      { id: 4, name: "角色5", confidence: 0.90 },
    ],
  },
  summon: {
    positions: [
      { id: 0, name: "巴哈姆特", confidence: 0.95 },
      { id: 1, name: "路西法", confidence: 0.92 },
      { id: 2, name: "宙斯", confidence: 0.88 },
      { id: 3, name: "提亚马特", confidence: 0.85 },
    ],
  },
}

