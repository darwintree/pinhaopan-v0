import { ChevronDown, ChevronUp, Filter, Clock, Calendar, Sword, X, Plus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/date-range-picker"
import type { UseGuideFiltersReturn } from "@/hooks/useGuideFilters" // Import the hook return type
import type { EquipmentFilterCondition } from "@/lib/types" // Keep this if needed by EquipmentSelector etc.
import { EquipmentSelector } from "@/components/equipment-selector"
import { TagSelector } from "@/components/tag-selector"
import { ToggleInput } from "@/components/ui/toggle-input"

// Helper functions moved here
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

// Define Props interface based on the hook's return type
interface GuideFilterPanelProps extends UseGuideFiltersReturn {}

export function GuideFilterPanel({ filters, handlers, filterCount }: GuideFilterPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">筛选条件</h2>
          {/* Use filterCount from props */}
          {filterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {filterCount}
            </Badge>
          )}
        </div>
        {/* Use filterCount and handler from props */}
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
          // Use state and handler from props
          onClick={() => handlers.setBasicFilterOpen(!filters.basicFilterOpen)}
        >
          <h3 className="font-medium">标签筛选</h3>
          <Button variant="ghost" size="sm">
            {/* Use state from props */}
            {filters.basicFilterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        {/* Use state from props */}
        {filters.basicFilterOpen && (
          <CardContent className="p-4 pt-0">
            <TagSelector
              // Use state and handler from props
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
          // Use state and handler from props
          onClick={() => handlers.setTimeFilterOpen(!filters.timeFilterOpen)}
        >
          <h3 className="font-medium">时间筛选</h3>
          <Button variant="ghost" size="sm">
            {/* Use state from props */}
            {filters.timeFilterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        {/* Use state from props */}
        {filters.timeFilterOpen && (
          <CardContent className="p-4 pt-0 grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <ToggleInput
                id="timeFilter"
                label="消耗时间"
                tooltipText="按完成副本所需时间筛选"
                // Use state and handler from props
                enabled={filters.timeFilterEnabled}
                onToggle={handlers.handleTimeFilterToggle}
              >
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm text-muted-foreground">
                      {/* Use state from props */}
                      {formatTime(filters.timeRange[0])} - {formatTime(filters.timeRange[1])}
                    </span>
                  </div>
                  <Select
                    // Use state and handler from props
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
                  // Use helper and state from props
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
                // Use state and handler from props
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
          // Use state and handler from props
          onClick={() => handlers.setConfigFilterOpen(!filters.configFilterOpen)}
        >
          <h3 className="font-medium">配置筛选</h3>
          <Button variant="ghost" size="sm">
            {/* Use state from props */}
            {filters.configFilterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        {/* Use state from props */}
        {filters.configFilterOpen && (
          <CardContent className="p-4 pt-0 grid gap-4">
            {/* Weapon conditions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Sword className="h-4 w-4" />
                  武器条件
                  {/* Use state from props */}
                  {filters.selectedWeaponConditions.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {filters.selectedWeaponConditions.length}
                    </Badge>
                  )}
                </Label>
                {/* Use handler from props */}
                <Button variant="outline" size="sm" onClick={handlers.handleAddWeaponCondition} className="h-8">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  添加条件
                </Button>
              </div>
               {/* Use state from props */}
              {filters.selectedWeaponConditions.length === 0 ? (
                <div className="text-sm text-muted-foreground italic">点击"添加条件"按钮来创建武器筛选条件</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Use state and handlers from props */}
                  {/* Fixing linter errors: Added types for map params */}
                  {filters.selectedWeaponConditions.map((condition: EquipmentFilterCondition, index: number) => (
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
                   {/* Use state from props */}
                  {filters.selectedSummonConditions.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {filters.selectedSummonConditions.length}
                    </Badge>
                  )}
                </Label>
                 {/* Use handler from props */}
                <Button variant="outline" size="sm" onClick={handlers.handleAddSummonCondition} className="h-8">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  添加条件
                </Button>
              </div>
               {/* Use state from props */}
              {filters.selectedSummonConditions.length === 0 ? (
                 <div className="text-sm text-muted-foreground italic">点击"添加条件"按钮来创建召唤石筛选条件</div>
               ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                   {/* Use state and handlers from props */}
                  {/* Fixing linter errors: Added types for map params */}
                  {filters.selectedSummonConditions.map((condition: EquipmentFilterCondition, index: number) => (
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
                   {/* Use state from props */}
                  {filters.selectedCharaConditions.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {filters.selectedCharaConditions.length}
                    </Badge>
                  )}
                </Label>
                 {/* Use handler from props */}
                <Button variant="outline" size="sm" onClick={handlers.handleAddCharaCondition} className="h-8">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  添加条件
                </Button>
              </div>
               {/* Use state from props */}
              {filters.selectedCharaConditions.length === 0 ? (
                <div className="text-sm text-muted-foreground italic">点击"添加条件"按钮来创建角色筛选条件</div>
               ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                   {/* Use state and handlers from props */}
                  {/* Fixing linter errors: Added types for map params */}
                  {filters.selectedCharaConditions.map((condition: EquipmentFilterCondition, index: number) => (
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
  )
} 