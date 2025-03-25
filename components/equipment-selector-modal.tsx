"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, X } from "lucide-react"
import type { EquipmentType, Equipment } from "@/lib/mock-data"

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
  const [filterOptions, setFilterOptions] = useState<{
    elements: string[]
    categories: string[]
  }>({ elements: [], categories: [] })
  const [elementNames, setElementNames] = useState<Record<string, string>>({})
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

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

  // Fetch equipment data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          type,
          search: searchTerm,
          element: elementFilter,
          category: categoryFilter,
        })
        const response = await fetch(`/api/equipment?${params}`)
        const data = await response.json()
        
        setFilteredEquipment(data.equipment)
        setFilterOptions(data.filterOptions)
        setElementNames(data.elementNames)
        setCategoryNames(data.categoryNames)
      } catch (error) {
        console.error("Failed to fetch equipment data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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
                {filterOptions.elements.map((element) => (
                  <SelectItem key={element} value={element}>
                    {elementNames[element] || element}
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
                {filterOptions.categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {categoryNames[category] || category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 pr-2 -mr-2">
          <div className="grid grid-cols-4 gap-3">
            {loading ? (
              <div className="col-span-4 py-8 text-center text-muted-foreground">加载中...</div>
            ) : filteredEquipment.length > 0 ? (
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
                      {elementNames[item.element] || item.element}
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

