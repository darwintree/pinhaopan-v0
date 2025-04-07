"use client"

import { useState, useEffect } from "react"
import { ArrowUpDown, ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { GuideData } from "@/lib/types"
import { getQuestPhotoUrl } from "@/lib/asset"
import { useRouter } from "next/navigation"
import { useQuestList } from "@/hooks/use-quest-list"
import React from "react"
import { useTagList } from "@/hooks/use-tag-list"
import { EquipmentImage } from "@/components/equipment-image"

interface GuideListProps {
  guides: GuideData[]
  loading: boolean
}

export function GuideList({ guides, loading }: GuideListProps) {
  // Sorting states
  const [sortField, setSortField] = useState<"time" | "date">("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10 // 每页显示数量

  // Handle sort change
  const handleSort = (field: "time" | "date") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
    // 排序改变时，重置到第一页
    setCurrentPage(1)
  }

  // Sort guides based on current sort settings
  const sortedGuides = [...guides]
    .filter(guide => {
      // 当按时间排序时，过滤掉没有时间值的配置
      if (sortField === "time" && (guide.time === undefined || guide.time === null)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortField === "time") {
        // 由于前面已过滤，这里的time值保证存在
        const timeA = a.time || 0;
        const timeB = b.time || 0;
        return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
      } else {
        // Sort by date
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA
      }
    })
  
  // 计算总页数
  const totalPages = Math.ceil(sortedGuides.length / itemsPerPage)
  
  // 处理页面变更
  const goToPage = (page: number) => {
    setCurrentPage(page)
  }
  
  // 获取当前页的数据
  const currentGuides = sortedGuides.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  
  // 当数据变化可能导致当前页码超出总页数时，调整当前页码
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [sortedGuides.length, totalPages, currentPage])

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
              // 重置到第一页
              setCurrentPage(1)
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
              <TableHead className="hidden md:table-cell">备注</TableHead>
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
              currentGuides.map((guide) => (
                <GuideListItem key={guide.id} guide={guide} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* 分页控件 */}
      {!loading && sortedGuides.length > itemsPerPage && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/50 dark:border-slate-700/50">
          <div className="text-sm text-muted-foreground hidden sm:block">
            显示 {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, sortedGuides.length)} 项，共 {sortedGuides.length} 项
          </div>
          <div className="flex items-center space-x-2 mx-auto sm:mx-0">
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
            <span className="text-sm px-2">
              {currentPage} / {totalPages}
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
  )
}

interface GuideListItemProps {
  guide: GuideData
}

function GuideListItem({ guide }: GuideListItemProps) {
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
      onClick={() => window.open(`/guide/${guide.id}`, '_blank')}
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
        {guide.time ? `${Math.floor(guide.time / 60)}:${(guide.time % 60).toString().padStart(2, '0')}` : '-'}
        {guide.turn ? `/${guide.turn}t` : '/-'}
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
      
      {/* 描述 */}
      <TableCell className="hidden md:table-cell">{guide.description}</TableCell>
    </TableRow>
  )
}

