"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { GuideData } from "@/lib/types"
import React from "react"
import { GuideListItem } from "@/components/browse/guide-list-item"

interface GuideListProps {
  guides: GuideData[]
  loading: boolean
}

export function GuideList({ guides, loading }: GuideListProps) {
  const [isAnyLightboxOpen, setIsAnyLightboxOpen] = useState(false)

  return (
    <div className="rounded-lg backdrop-blur-lg bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">配置列表</h2>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>副本</TableHead>
              <TableHead className="hidden md:table-cell">队伍配置</TableHead>
              <TableHead className="hidden md:table-cell">武器</TableHead>
              <TableHead className="hidden md:table-cell">召唤石</TableHead>
              <TableHead className="md:hidden p-1 text-center">装备</TableHead>
              <TableHead>耗时</TableHead>
              <TableHead className="hidden md:table-cell">发布时间</TableHead>
              <TableHead className="hidden md:table-cell">标签</TableHead>
              <TableHead className="hidden md:table-cell">备注</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">加载中...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : guides.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              guides.map((guide) => (
                <GuideListItem 
                  key={guide.id} 
                  guide={guide} 
                  isAnyLightboxOpen={isAnyLightboxOpen}
                  setIsAnyLightboxOpen={setIsAnyLightboxOpen}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

