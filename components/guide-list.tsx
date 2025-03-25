"use client"

import { useState } from "react"
import { ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { GuideData } from "@/lib/types"

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
        <h2 className="text-xl font-semibold">攻略列表</h2>
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
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>副本名称</TableHead>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => handleSort("time")}>
                  消耗时间
                  {sortField === "time" ? (
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
              <TableHead className="hidden md:table-cell">队伍配置</TableHead>
              <TableHead className="hidden md:table-cell">武器/召唤石</TableHead>
              <TableHead>
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
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">加载中...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : sortedGuides.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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

function GuideListItem({ guide }: GuideListItemProps) {
  return (
    <TableRow className="cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50">
      <TableCell className="font-medium">{guide.name}</TableCell>
      <TableCell>{guide.time} 分钟</TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex -space-x-2">
          {guide.team.map((character, i) => (
            <div
              key={i}
              className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-900"
              title={character}
            />
          ))}
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                武器
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-3 gap-1">
                {guide.weapons.map((weapon, i) => (
                  <div key={i} className="h-10 w-10 rounded bg-slate-200 dark:bg-slate-700" title={weapon} />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                召唤石
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-2 gap-1">
                {guide.summons.map((summon, i) => (
                  <div key={i} className="h-12 w-12 rounded bg-slate-200 dark:bg-slate-700" title={summon} />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </TableCell>
      <TableCell>{new Date(guide.date).toLocaleDateString()}</TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          {guide.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </TableCell>
    </TableRow>
  )
}

