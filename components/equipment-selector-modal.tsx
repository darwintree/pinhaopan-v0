"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, X } from "lucide-react"

// Mock data for equipment
const mockEquipment = {
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

// Element and category options for each equipment type
const filterOptions = {
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

// Element name translations
const elementNames = {
  fire: "火",
  water: "水",
  earth: "土",
  wind: "风",
  light: "光",
  dark: "暗",
}

// Category name translations
const categoryNames = {
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

// Type definitions
type EquipmentType = "summon" | "chara" | "weapon"
type Equipment = {
  id: string
  name: string
  element: string
  category: string
  image: string
}

interface EquipmentSelectorModalProps {
  type: EquipmentType
  onSelect: (equipment: Equipment) => void
  buttonLabel?: string
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
}

export function EquipmentSelectorModal({
  type,
  onSelect,
  buttonLabel,
  buttonVariant = "outline",
}: EquipmentSelectorModalProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [elementFilter, setElementFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([])

  // Set the title based on equipment type
  const getTitle = () => {
    switch (type) {
      case "summon":
        return "选择召唤石"
      case "chara":
        return "选择角色"
      case "weapon":
        return "选择武器"
      default:
        return "选择装备"
    }
  }

  // Get the default button label if not provided
  const getDefaultButtonLabel = () => {
    switch (type) {
      case "summon":
        return "选择召唤石"
      case "chara":
        return "选择角色"
      case "weapon":
        return "选择武器"
      default:
        return "选择装备"
    }
  }

  // Filter equipment based on search term and filters
  useEffect(() => {
    const equipment = mockEquipment[type]
    let filtered = [...equipment]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Apply element filter
    if (elementFilter !== "all") {
      filtered = filtered.filter((item) => item.element === elementFilter)
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter)
    }

    setFilteredEquipment(filtered)
  }, [type, searchTerm, elementFilter, categoryFilter])

  // Handle equipment selection
  const handleSelect = (equipment: Equipment) => {
    onSelect(equipment)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} size="sm">
          {buttonLabel || getDefaultButtonLabel()}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 my-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索名称..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Label className="sr-only">筛选</Label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <Label htmlFor="element-filter" className="text-xs mb-1 block">
              属性
            </Label>
            <Select value={elementFilter} onValueChange={setElementFilter}>
              <SelectTrigger id="element-filter">
                <SelectValue placeholder="选择属性" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部属性</SelectItem>
                {filterOptions[type].elements.map((element) => (
                  <SelectItem key={element} value={element}>
                    {elementNames[element as keyof typeof elementNames] || element}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="category-filter" className="text-xs mb-1 block">
              类别
            </Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger id="category-filter">
                <SelectValue placeholder="选择类别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类别</SelectItem>
                {filterOptions[type].categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {categoryNames[category as keyof typeof categoryNames] || category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 pr-2 -mr-2">
          <div className="grid grid-cols-4 gap-3">
            {filteredEquipment.length > 0 ? (
              filteredEquipment.map((item) => (
                <button
                  key={item.id}
                  className="flex flex-col items-center p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => handleSelect(item)}
                >
                  <div className="w-16 h-16 mb-2 rounded overflow-hidden bg-slate-200 dark:bg-slate-700">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-medium text-center line-clamp-2">{item.name}</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700">
                      {elementNames[item.element as keyof typeof elementNames] || item.element}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="col-span-4 py-8 text-center text-muted-foreground">没有找到符合条件的{getTitle()}</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

