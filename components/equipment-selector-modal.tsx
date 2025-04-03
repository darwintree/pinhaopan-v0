"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { useEquipmentsList } from "@/hooks/use-equipments-list"
import type { DetailedEquipmentData, EquipmentType } from "@/lib/types"
import { getEquipmentPhotoUrl } from "@/lib/asset"

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
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [elementFilter, setElementFilter] = useState<string>("all")
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)
  
  const { equipmentsList, loading, error } = useEquipmentsList()

  // 重置为第一页当过滤条件变化时
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, categoryFilter, elementFilter])

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
    const equipments = equipmentsList[type] || []
    return equipments.filter(item => {
      const matchesSearch = searchTerm === "" || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === "all" || 
        item.categories.some(cat => cat && cat.trim() === categoryFilter)
      const matchesElement = elementFilter === "all" || item.element === elementFilter
      return matchesSearch && matchesCategory && matchesElement
    })
  }

  // 获取当前页面应该显示的装备
  const getPaginatedEquipment = () => {
    const filteredItems = getFilteredEquipment()
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredItems.slice(startIndex, startIndex + itemsPerPage)
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
  const paginatedEquipment = getPaginatedEquipment()
  const categories = getCategories()
  const elements = getElements()
  
  // 计算总页数
  const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage)

  // 处理翻页
  const goToPage = (page: number) => {
    setCurrentPage(page)
    // 滚动到顶部
    const contentElement = document.querySelector('.overflow-y-auto')
    if (contentElement) {
      contentElement.scrollTop = 0
    }
  }

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
                <SelectItem value="all">全部类别</SelectItem>
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
            ) : filteredEquipment.length > 0 ? (
              paginatedEquipment.map((item) => (
                <button
                  key={`${type}-${item.id}`}
                  className="flex flex-col items-center p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => handleSelect(item)}
                >
                  <div className="w-full relative pb-[100%] mb-2 rounded overflow-hidden bg-slate-200 dark:bg-slate-700">
                    <img
                      src={getEquipmentPhotoUrl(item.id, type)}
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
          
          {/* 分页导航 */}
          {filteredEquipment.length > itemsPerPage && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="text-sm text-muted-foreground">
                显示 {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredEquipment.length)} 项，共 {filteredEquipment.length} 项
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                  <span className="sr-only">第一页</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">上一页</span>
                </Button>
                <span className="text-sm">
                  第 {currentPage} 页，共 {totalPages} 页
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">下一页</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                  <span className="sr-only">最后一页</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

