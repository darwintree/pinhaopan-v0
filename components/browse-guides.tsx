"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { GuideData, EquipmentFilterCondition } from "@/lib/types"
import { GuideList } from "@/components/guide-list"
import { QuestSelector } from "@/components/input/quest-selector"
import { getGuides, GuidesResponse } from "@/lib/remote-db"
import { useGuideFilters } from "@/hooks/use-guide-filters"
import { GuideFilterPanel } from "./guide-filter-panel"

const PAGE_SIZE = 10

export function BrowseGuides() {
  // --- Pagination and Sorting States (Remain in component for now) ---
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalGuides, setTotalGuides] = useState(0)
  const [sortField, setSortField] = useState<"time" | "date" | "turn" | "contribution">("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedQuest, setSelectedQuest] = useState<string>("") // Keep Quest selection separate for now

  // --- Data states ---
  const [guides, setGuides] = useState<GuideData[]>([])
  const [loading, setLoading] = useState(false)

  // --- Pagination Helper ---
  const resetPage = useCallback(() => {
    setCurrentPage(1)
  }, [])

  // --- Instantiate Filter Hook ---
  const { filters, handlers, filterCount } = useGuideFilters({ resetPage })

  // --- Quest Update Handler (Keep separate or integrate into filters?) ---
  // For now, keeping it separate seems reasonable as it's at the top level.
  const handleQuestSelect = useCallback((quest: string) => {
    setSelectedQuest(quest)
    resetPage()
  }, [resetPage])

  // --- Sorting Update Handler (Remains) ---
  const handleSortChange = useCallback((field: "time" | "date" | "turn" | "contribution") => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection("asc") // Default to asc when changing field
    }
    resetPage()
  }, [sortField, resetPage])

  // Fetch guides data from API - Update dependencies
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const queryObj: any = {
          page: currentPage,
          pageSize: PAGE_SIZE,
          sort: { field: sortField, direction: sortDirection }
        }

        // Use state/filters from component scope and hook
        if (selectedQuest) queryObj.quest = selectedQuest
        if (filters.selectedTags.length > 0) queryObj.tags = filters.selectedTags
        if (filters.timeFilterEnabled) queryObj.timeRange = filters.debouncedTimeRange // Use debounced value
        if (filters.dateRange?.from && filters.dateRange?.to) {
             queryObj.dateRange = [
               filters.dateRange.from.setHours(0, 0, 0, 0),
               filters.dateRange.to.setHours(23, 59, 59, 999)
             ]
        }
        if (filters.selectedWeaponConditions.length > 0) queryObj.weaponConditions = filters.selectedWeaponConditions
        if (filters.selectedSummonConditions.length > 0) queryObj.summonConditions = filters.selectedSummonConditions
        if (filters.selectedCharaConditions.length > 0) queryObj.charaConditions = filters.selectedCharaConditions

        const result: GuidesResponse = await getGuides(queryObj)

        if (result && Array.isArray(result.guides) && typeof result.total === 'number' && typeof result.page === 'number' && typeof result.pageSize === 'number' && typeof result.totalPages === 'number') {
          setGuides(result.guides)
          setTotalGuides(result.total)
          setTotalPages(result.totalPages)
           // Ensure currentPage is valid after fetch
           if (result.page !== currentPage && currentPage > result.totalPages) {
               setCurrentPage(result.totalPages > 0 ? result.totalPages : 1);
           } else if (result.page !== currentPage) {
              // This case might be less common, but sync if API confirms a different page
              // setCurrentPage(result.page); // Decide if this sync is desired
           }
        } else {
           console.error("Invalid API response format:", result)
           setGuides([])
           setTotalGuides(0)
           setTotalPages(1)
           setCurrentPage(1)
        }
      } catch (error) {
        console.error("Failed to fetch guides data:", error)
        setGuides([])
        setTotalGuides(0)
        setTotalPages(1)
        setCurrentPage(1)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [
    selectedQuest,
    // Use values from the filters object in dependencies
    filters.selectedTags,
    filters.debouncedTimeRange,
    filters.dateRange,
    filters.selectedWeaponConditions,
    filters.selectedSummonConditions,
    filters.selectedCharaConditions,
    filters.timeFilterEnabled, // Add this dependency
    sortField,
    sortDirection,
    currentPage, // Keep currentPage dependency
  ])

  // --- Pagination handlers (Remain) ---
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }
  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)))
  }

  // --- Render ---
  return (
    <div className="space-y-6">
      <QuestSelector
        selectedQuest={selectedQuest}
        onQuestSelect={handleQuestSelect} // Keep using the component's handler
      />
      {/* Filter section - Replaced with GuideFilterPanel */}
      <GuideFilterPanel
        filters={filters}
        handlers={handlers}
        filterCount={filterCount}
      />

      {/* Sorting Controls and GuideList Section */}
      <div className="rounded-lg backdrop-blur-lg bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">配置列表</h2>
          {/* Sorting Controls - Use component's state and handler */}
          <div className="flex items-center space-x-2">
            <Select
              value={sortField}
              onValueChange={(value) => handleSortChange(value as "time" | "date" | "turn" | "contribution")}
            >
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">发布时间</SelectItem>
                <SelectItem value="time">消耗时间</SelectItem>
                <SelectItem value="turn">回合数</SelectItem>
                <SelectItem value="contribution">贡献度</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleSortChange(sortField)}
              className="h-9 w-9 bg-white/60 dark:bg-slate-800/60"
            >
              {sortDirection === "asc" ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
              <span className="sr-only">切换排序方向</span>
            </Button>
          </div>
        </div>

        <GuideList guides={guides} loading={loading} />
      </div>

      {!loading && totalGuides > 0 && (
         <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-900/40 rounded-b-lg">
          <div className="text-sm text-muted-foreground hidden sm:block">
             第 {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalGuides)} - {Math.min(currentPage * PAGE_SIZE, totalGuides)} 项，共 {totalGuides} 项
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
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">上一页</span>
            </Button>
            <span className="text-sm px-2 font-medium tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleNextPage}
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
       {!loading && totalGuides === 0 && (
         <div className="text-center py-10 text-muted-foreground">
           没有找到匹配的配置。
         </div>
       )}
    </div>
  )
}

