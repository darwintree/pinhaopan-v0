"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronDown, ChevronUp, Filter, Clock, Calendar, Sword, X, Plus, Users, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/date-range-picker"
import type { GuideData, EquipmentFilterCondition } from "@/lib/types"
import { GuideList } from "@/components/guide-list"
import { EquipmentSelector } from "@/components/equipment-selector"
import { QuestSelector } from "@/components/quest-selector"
import { TagSelector } from "@/components/tag-selector"
import { ToggleInput } from "@/components/ui/toggle-input"
import { getGuides, GuidesResponse } from "@/lib/remote-db"
import { useGuideFilters } from "@/hooks/useGuideFilters"

const PAGE_SIZE = 10

// Helper functions can remain or be moved to utils
const getTimeScaleConfig: (scale: "small" | "medium" | "large") => { max: number, step: number } = (scale: "small" | "medium" | "large") => {
  switch (scale) {
    case "small": return { max: 600, step: 5 }
    case "medium": return { max: 1800, step: 30 }
    case "large": return { max: 5400, step: 60 }
    default: return { max: 600, step: 5 }
  }
}
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

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
      {/* Filter section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">筛选条件</h2>
            {/* Use filterCount from hook */}
            {filterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filterCount}
              </Badge>
            )}
          </div>
          {/* Use filterCount and handler from hook */}
          {filterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handlers.handleResetFilters}>
              <X className="mr-2 h-4 w-4" />
              重置
            </Button>
          )}
        </div>
        {/* Basic filter */}
        <Card className="overflow-hidden backdrop-blur-lg bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <div
            className="flex items-center justify-between p-4 cursor-pointer"
            // Use state and handler from hook
            onClick={() => handlers.setBasicFilterOpen(!filters.basicFilterOpen)}
          >
            <h3 className="font-medium">标签筛选</h3>
            <Button variant="ghost" size="sm">
              {/* Use state from hook */}
              {filters.basicFilterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          {/* Use state from hook */}
          {filters.basicFilterOpen && (
            <CardContent className="p-4 pt-0">
              <TagSelector
                // Use state and handler from hook
                selectedTags={filters.selectedTags}
                onTagSelect={handlers.handleTagSelect}
              />
            </CardContent>
          )}
        </Card>
        {/* Time filter */}
        <Card className="overflow-hidden backdrop-blur-lg bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <div
            className="flex items-center justify-between p-4 cursor-pointer"
            // Use state and handler from hook
            onClick={() => handlers.setTimeFilterOpen(!filters.timeFilterOpen)}
          >
            <h3 className="font-medium">时间筛选</h3>
            <Button variant="ghost" size="sm">
              {/* Use state from hook */}
              {filters.timeFilterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          {/* Use state from hook */}
          {filters.timeFilterOpen && (
            <CardContent className="p-4 pt-0 grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <ToggleInput
                  id="timeFilter"
                  label="消耗时间"
                  tooltipText="按完成副本所需时间筛选"
                  // Use state and handler from hook
                  enabled={filters.timeFilterEnabled}
                  onToggle={handlers.handleTimeFilterToggle}
                >
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm text-muted-foreground">
                        {/* Use state from hook */}
                        {formatTime(filters.timeRange[0])} - {formatTime(filters.timeRange[1])}
                      </span>
                    </div>
                    <Select
                      // Use state and handler from hook
                      value={filters.timeScale}
                      onValueChange={handlers.handleTimeScaleChange}
                    >
                      <SelectTrigger className="w-[110px] h-8">
                        <SelectValue placeholder="时间范围" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">0-10分钟</SelectItem>
                        <SelectItem value="medium">0-30分钟</SelectItem>
                        <SelectItem value="large">0-90分钟</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Slider
                    // Use helper and state from hook
                    max={getTimeScaleConfig(filters.timeScale).max}
                    step={getTimeScaleConfig(filters.timeScale).step}
                    value={filters.timeRange}
                    onValueChange={handlers.handleTimeRangeChange} // Use the direct change handler
                    className="mt-2"
                  />
                </ToggleInput>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  发布时间
                </Label>
                <DateRangePicker
                  // Use state and handler from hook
                  date={filters.dateRange}
                  setDate={handlers.setDateRange} // Pass the setState from the hook
                />
              </div>
            </CardContent>
          )}
        </Card>
        {/* Config filter */}
        <Card className="overflow-hidden backdrop-blur-lg bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <div
            className="flex items-center justify-between p-4 cursor-pointer"
            // Use state and handler from hook
            onClick={() => handlers.setConfigFilterOpen(!filters.configFilterOpen)}
          >
            <h3 className="font-medium">配置筛选</h3>
            <Button variant="ghost" size="sm">
              {/* Use state from hook */}
              {filters.configFilterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          {/* Use state from hook */}
          {filters.configFilterOpen && (
            <CardContent className="p-4 pt-0 grid gap-4">
              {/* Weapon conditions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Sword className="h-4 w-4" />
                    武器条件
                    {/* Use state from hook */}
                    {filters.selectedWeaponConditions.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {filters.selectedWeaponConditions.length}
                      </Badge>
                    )}
                  </Label>
                  {/* Use handler from hook */}
                  <Button variant="outline" size="sm" onClick={handlers.handleAddWeaponCondition} className="h-8">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    添加条件
                  </Button>
                </div>
                 {/* Use state from hook */}
                {filters.selectedWeaponConditions.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic">点击"添加条件"按钮来创建武器筛选条件</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Use state and handlers from hook */}
                    {filters.selectedWeaponConditions.map((condition, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-2 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <Select
                            value={condition.include ? "include" : "exclude"}
                            onValueChange={(value) => handlers.handleUpdateWeaponCondition(index, "include", value === "include")}
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue placeholder="类型" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="include">包含</SelectItem>
                              <SelectItem value="exclude">排除</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlers.handleRemoveWeaponCondition(index)}
                            className="h-8 w-8 ml-auto"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <EquipmentSelector
                          index={index + 1} // Keep index for display/key
                          type="weapon"
                          label={condition.include ? `需要${condition.count}把` : "排除"}
                          rectangle={{ width: 160, height: 100 }}
                          recognizedEquipments={condition.id ? [{ id: condition.id, confidence: 1 }] : undefined}
                          onEquipmentSelect={(equipment) => handlers.handleUpdateWeaponCondition(index, "id", equipment.id)}
                          isHovered={false}
                          onMouseEnter={() => {}}
                          onMouseLeave={() => {}}
                        />
                        {condition.include && (
                          <Select
                            value={condition.count.toString()} // Ensure value is string for Select
                            onValueChange={(value) => handlers.handleUpdateWeaponCondition(index, "count", value)} // Pass string value, handler converts
                          >
                            <SelectTrigger className="w-full h-8">
                              <SelectValue placeholder="数量" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 11 }, (_, i) => i).map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num} 把
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Summon conditions */}
               <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>
                    召唤石条件
                     {/* Use state from hook */}
                    {filters.selectedSummonConditions.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {filters.selectedSummonConditions.length}
                      </Badge>
                    )}
                  </Label>
                   {/* Use handler from hook */}
                  <Button variant="outline" size="sm" onClick={handlers.handleAddSummonCondition} className="h-8">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    添加条件
                  </Button>
                </div>
                 {/* Use state from hook */}
                {filters.selectedSummonConditions.length === 0 ? (
                   <div className="text-sm text-muted-foreground italic">点击"添加条件"按钮来创建召唤石筛选条件</div>
                 ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                     {/* Use state and handlers from hook */}
                    {filters.selectedSummonConditions.map((condition, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-2 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <Select
                            value={condition.include ? "include" : "exclude"}
                            onValueChange={(value) => handlers.handleUpdateSummonCondition(index, "include", value === "include")}
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue placeholder="类型" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="include">包含</SelectItem>
                              <SelectItem value="exclude">排除</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlers.handleRemoveSummonCondition(index)}
                            className="h-8 w-8 ml-auto"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <EquipmentSelector
                           index={index + 1} // Keep index for display/key
                           type="summon"
                           label={condition.include ? "需要" : "排除"} // Simplified label for now
                           rectangle={{ width: 160, height: 100 }}
                           recognizedEquipments={condition.id ? [{ id: condition.id, confidence: 1 }] : undefined}
                           onEquipmentSelect={(equipment) => handlers.handleUpdateSummonCondition(index, "id", equipment.id)}
                           isHovered={false}
                           onMouseEnter={() => {}}
                           onMouseLeave={() => {}}
                        />
                         {/* Add count selector for summons if needed later */}
                         {/* {condition.include && ( ... count select UI ... )} */}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Chara conditions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    角色条件
                     {/* Use state from hook */}
                    {filters.selectedCharaConditions.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {filters.selectedCharaConditions.length}
                      </Badge>
                    )}
                  </Label>
                   {/* Use handler from hook */}
                  <Button variant="outline" size="sm" onClick={handlers.handleAddCharaCondition} className="h-8">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    添加条件
                  </Button>
                </div>
                 {/* Use state from hook */}
                {filters.selectedCharaConditions.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic">点击"添加条件"按钮来创建角色筛选条件</div>
                 ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                     {/* Use state and handlers from hook */}
                    {filters.selectedCharaConditions.map((condition, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-2 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <Select
                            value={condition.include ? "include" : "exclude"}
                            onValueChange={(value) => handlers.handleUpdateCharaCondition(index, "include", value === "include")}
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue placeholder="类型" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="include">包含</SelectItem>
                              <SelectItem value="exclude">排除</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlers.handleRemoveCharaCondition(index)}
                            className="h-8 w-8 ml-auto"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <EquipmentSelector
                          index={index + 1}
                          type="chara"
                          label={condition.include ? "需要" : "排除"}
                          rectangle={{ width: 160, height: 100 }}
                          recognizedEquipments={condition.id ? [{ id: condition.id, confidence: 1 }] : undefined}
                          onEquipmentSelect={(equipment) => handlers.handleUpdateCharaCondition(index, "id", equipment.id)}
                          isHovered={false}
                          onMouseEnter={() => {}}
                          onMouseLeave={() => {}}
                        />
                        {/* Add count selector for charas if needed later */}
                         {/* {condition.include && ( ... count select UI ... )} */}
                      </div>
                    ))}
                  </div>
                 )}
              </div>
              {/* Condition explanation - No changes needed here */}
              <div className="text-xs text-muted-foreground bg-slate-100/50 dark:bg-slate-800/50 p-2 rounded-md mt-2">
                <p>所有条件使用AND逻辑（全部满足）。例如：</p>
                <ul className="list-disc list-inside mt-1">
                  <li>包含3把光剑 + 排除暗刀 = 必须有3把光剑且不能有暗刀</li>
                  <li>包含巴哈姆特 + 排除路西法 = 必须有巴哈姆特且不能有路西法</li>
                  <li>包含水狗 + 排除火狐 = 必须有水狗且不能有火狐</li>
                </ul>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
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

