"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, X } from "lucide-react"
import { useEquipmentsList } from "@/hooks/use-equipments-list"
import type { DetailedEquipmentData, EquipmentType } from "@/lib/types"
import { getPhotoUrl } from "@/lib/utils"

interface EquipmentSelectorModalProps {
  type: EquipmentType
  onSelect: (equipment: DetailedEquipmentData) => void
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
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [elementFilter, setElementFilter] = useState<string>("all")
  
  const { equipmentsList, loading, error } = useEquipmentsList()

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

  // Filter equipment based on search term, category and element
  const getFilteredEquipment = () => {
    // 如果没有选择类别，返回空数组
    if (categoryFilter === "") {
      return []
    }
    
    const equipments = equipmentsList[type] || []
    return equipments.filter(item => {
      const matchesSearch = searchTerm === "" || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = item.categories.some(cat => cat && cat.trim() === categoryFilter)
      const matchesElement = elementFilter === "all" || item.element === elementFilter
      return matchesSearch && matchesCategory && matchesElement
    })
  }

  // Get unique categories for the current equipment type
  const getCategories = () => {
    const equipments = equipmentsList[type] || []
    const categories = new Set<string>()
    equipments.forEach(item => {
      item.categories.forEach(category => {
        // Only add non-empty categories
        if (category && category.trim() !== '') {
          categories.add(category.trim())
        }
      })
    })
    return Array.from(categories).sort()
  }

  // Get unique elements for the current equipment type
  const getElements = () => {
    const equipments = equipmentsList[type] || []
    const elements = new Set<string>()
    equipments.forEach(item => {
      if (item.element && item.element.trim() !== '') {
        elements.add(item.element.trim())
      }
    })
    return Array.from(elements).sort()
  }

  const filteredEquipment = getFilteredEquipment()
  const categories = getCategories()
  const elements = getElements()

  // Handle equipment selection
  const handleSelect = (equipment: DetailedEquipmentData) => {
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
                {elements.map((element) => (
                  <SelectItem key={element} value={element}>
                    {element}
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
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 pr-2 -mr-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {loading ? (
              <div key="loading" className="col-span-full py-8 text-center text-muted-foreground">加载中...</div>
            ) : error ? (
              <div key="error" className="col-span-full py-8 text-center text-red-500">加载失败: {error.message}</div>
            ) : categoryFilter === "" ? (
              <div key="no-category" className="col-span-full py-8 text-center text-muted-foreground">
                请选择类别以查看装备
              </div>
            ) : filteredEquipment.length > 0 ? (
              filteredEquipment.map((item) => (
                <button
                  key={`${type}-${item.id}`}
                  className="flex flex-col items-center p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => handleSelect(item)}
                >
                  <div className="w-full relative pb-[100%] mb-2 rounded overflow-hidden bg-slate-200 dark:bg-slate-700">
                    <img
                      src={getPhotoUrl(item.id, type)}
                      alt={item.name}
                      className="absolute inset-0 w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg"
                      }}
                      onLoad={(e) => {
                        const img = e.target as HTMLImageElement;
                        const container = img.parentElement;
                        if (container) {
                          const ratio = (img.naturalHeight / img.naturalWidth) * 100;
                          container.style.paddingBottom = `${ratio}%`;
                        }
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-center line-clamp-2">{item.name}</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700">
                      {item.element}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700">
                      {item.categories[0]}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div key="empty" className="col-span-full py-8 text-center text-muted-foreground">没有找到符合条件的{getTitle()}</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

