"use client"

import { useState, useEffect } from "react"
import { ArrowUpDown, ArrowDown, ArrowUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { GuideData } from "@/lib/types"
import { getGuidePhotoUrl, getQuestPhotoUrl } from "@/lib/asset"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { useRouter } from "next/navigation"
import { useQuestList } from "@/hooks/use-quest-list"
import React from "react"
import { useTagList } from "@/hooks/use-tag-list"

interface GuideListProps {
  guides: GuideData[]
  loading: boolean
}

export function GuideList({ guides, loading }: GuideListProps) {
  // Sorting states
  const [sortField, setSortField] = useState<"time" | "date">("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Handle sort change
  const handleSort = (field: "time" | "date") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Sort guides based on current sort settings
  const sortedGuides = [...guides].sort((a, b) => {
    if (sortField === "time") {
      return sortDirection === "asc" ? a.time - b.time : b.time - a.time
    } else {
      // Sort by date
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA
    }
  })

  return (
    <div className="rounded-lg backdrop-blur-lg bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">配置列表</h2>
        <div className="flex items-center space-x-2">
          <Select
            defaultValue={sortField}
            onValueChange={(value) => {
              setSortField(value as "time" | "date")
              // Reset sort direction when changing fields
              setSortDirection("desc")
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="排序方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">按发布时间</SelectItem>
              <SelectItem value="time">按消耗时间</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
            className="h-10 w-10 bg-white/60 dark:bg-slate-800/60"
          >
            {sortDirection === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>副本</TableHead>
              <TableHead className="hidden md:table-cell">队伍配置</TableHead>
              <TableHead className="hidden md:table-cell">武器</TableHead>
              <TableHead className="hidden md:table-cell">召唤石</TableHead>
              {/* 移动端装备合并表头 */}
              <TableHead className="md:hidden p-1 text-center">装备</TableHead>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => handleSort("time")}>
                  消耗时间
                  {sortField === "time" ? (
                    sortDirection === "asc" ? (
                      <ArrowUp className="ml-1 h-4 w-4 hidden md:inline" />
                    ) : (
                      <ArrowDown className="ml-1 h-4 w-4 hidden md:inline" />
                    )
                  ) : (
                    <ArrowUpDown className="ml-1 h-4 w-4 opacity-50 hidden md:inline" />
                  )}
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <div className="flex items-center cursor-pointer" onClick={() => handleSort("date")}>
                  发布时间
                  {sortField === "date" ? (
                    sortDirection === "asc" ? (
                      <ArrowUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ArrowDown className="ml-1 h-4 w-4" />
                    )
                  ) : (
                    <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
                  )}
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell">标签</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">加载中...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : sortedGuides.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              sortedGuides.map((guide) => (
                <GuideListItem key={guide.id} guide={guide} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

interface GuideListItemProps {
  guide: GuideData
}

interface EquipmentImageProps {
  guideId: string
  type: "chara" | "weapon" | "summon"
  alt: string
  size?: "normal" | "small"
}

function EquipmentImage({ guideId, type, alt, size = "normal" }: EquipmentImageProps) {
  const [showModal, setShowModal] = useState(false)
  const [showPopover, setShowPopover] = useState(false)
  const [preventNavigation, setPreventNavigation] = useState(false)
  const imageUrl = getGuidePhotoUrl(guideId, type)
  
  // 使用useEffect监听preventNavigation状态，自动重置
  useEffect(() => {
    if (preventNavigation) {
      // 设置一个短暂的超时，然后重置状态
      const timer = setTimeout(() => {
        setPreventNavigation(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [preventNavigation]);

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowModal(true)
    setShowPopover(false) // 关闭预览
  }

  return (
    <div onClick={(e) => {
      if (preventNavigation) {
        e.stopPropagation();
      }
    }}>
      <Popover open={showPopover} onOpenChange={setShowPopover}>
        <PopoverTrigger asChild>
          <div 
            className="cursor-zoom-in"
            onMouseEnter={() => setShowPopover(true)}
            onMouseLeave={() => setShowPopover(false)}
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={imageUrl}
              alt={alt}
              className={`${size === "small" ? "h-8" : "h-12"} w-auto rounded transition-transform hover:scale-105`}
              onClick={handleImageClick}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="p-0 border-none shadow-xl" 
          side="top"
          onMouseEnter={() => setShowPopover(true)}
          onMouseLeave={() => setShowPopover(false)}
          onClick={(e) => e.stopPropagation()}
        >
          <img 
            src={imageUrl}
            alt={alt}
            className="max-h-[300px] w-auto rounded cursor-zoom-in"
            onClick={handleImageClick}
          />
        </PopoverContent>
      </Popover>

      <Dialog 
        open={showModal} 
        onOpenChange={(open) => {
          setShowModal(open);
          // 如果是要关闭对话框，激活导航阻止
          if (!open) {
            setPreventNavigation(true);
          }
        }}
      >
        <DialogContent 
          className="max-w-[95vw] w-fit p-0 [&>button]:text-white [&>button]:hover:bg-transparent [&>button]:focus-visible:ring-0"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogTitle asChild>
            <VisuallyHidden>
              {`${type.charAt(0).toUpperCase() + type.slice(1)} Image Preview`}
            </VisuallyHidden>
          </DialogTitle>
          <img 
            src={imageUrl}
            alt={alt}
            className="max-h-[90vh] w-auto rounded"
            onClick={(e) => e.stopPropagation()}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function GuideListItem({ guide }: GuideListItemProps) {
  const router = useRouter()
  const { questList } = useQuestList()
  const { tagList } = useTagList()
  
  // 查找对应的quest信息
  const questInfo = questList.find(q => q.quest === guide.quest)
  
  // 使用quest信息，如果找不到则使用默认值
  const questName = questInfo?.name || guide.quest
  const questImageUrl = getQuestPhotoUrl(questInfo?.image)

  // 过滤出在标签列表中的标签，并获取它们的颜色信息
  const validTags = guide.tags.filter(tag => 
    tagList.some(t => t.name === tag)
  ).map(tag => ({
    name: tag,
    color: tagList.find(t => t.name === tag)?.color || ""
  }));

  return (
    <TableRow 
      className="cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
      onClick={() => router.push(`/guide/${guide.id}`)}
    >
      {/* 副本 */}
      <TableCell className="font-medium">
        <div className="flex items-center">
          <img 
            src={questImageUrl}
            alt={questName}
            className="h-8 w-auto rounded transition-transform hover:scale-105"
          />
          <span className="ml-2 hidden md:inline">{questName}</span>
        </div>
      </TableCell>
      
      {/* 角色 - 桌面端 */}
      <TableCell className="hidden md:table-cell">
        <div className="flex items-center">
          <EquipmentImage 
            guideId={guide.id}
            type="chara"
            alt="Team composition"
          />
        </div>
      </TableCell>
      
      {/* 武器 - 桌面端 */}
      <TableCell className="hidden md:table-cell">
        <div className="flex items-center">
          <EquipmentImage 
            guideId={guide.id}
            type="weapon"
            alt="Weapons"
          />
        </div>
      </TableCell>
      
      {/* 召唤石 - 桌面端 */}
      <TableCell className="hidden md:table-cell">
        <div className="flex items-center">
          <EquipmentImage 
            guideId={guide.id}
            type="summon"
            alt="Summons"
          />
        </div>
      </TableCell>
      
      {/* 装备合并 - 移动端 */}
      <TableCell className="md:hidden p-1">
        <div className="flex items-center justify-center space-x-1">
          <EquipmentImage 
            guideId={guide.id}
            type="chara"
            alt="Team composition"
            size="small"
          />
          <EquipmentImage 
            guideId={guide.id}
            type="weapon"
            alt="Weapons"
            size="small"
          />
          <EquipmentImage 
            guideId={guide.id}
            type="summon"
            alt="Summons"
            size="small"
          />
        </div>
      </TableCell>
      
      {/* 消耗时间 */}
      <TableCell>
        {Math.floor(guide.time / 60)}:{(guide.time % 60).toString().padStart(2, '0')}
      </TableCell>
      
      {/* 发布时间 - 桌面端 */}
      <TableCell className="hidden md:table-cell">{new Date(guide.date).toLocaleDateString()}</TableCell>
      
      {/* 标签 - 桌面端 */}
      <TableCell className="hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          {validTags.map((tag) => (
            <Badge 
              key={tag.name} 
              variant="outline" 
              className="text-xs"
              style={{
                borderColor: tag.color,
                color: tag.color,
                backgroundColor: tag.color ? `${tag.color}20` : undefined
              }}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      </TableCell>
    </TableRow>
  )
}

