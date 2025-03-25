"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Filter, Clock, Calendar, Sword, Search, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/date-range-picker"
import type { GuideData } from "@/lib/types"
import { mockGuides } from "@/lib/mock-data"
import { EquipmentSelectorModal } from "@/components/equipment-selector-modal"
import { GuideList } from "@/components/guide-list"

type WeaponCondition = {
  type: "include" | "exclude"
  weapon: string
  count: number
}

type SummonCondition = {
  type: "include" | "exclude"
  summon: string
}

export function BrowseGuides() {
  // Filter states
  const [basicFilterOpen, setBasicFilterOpen] = useState(true)
  const [timeFilterOpen, setTimeFilterOpen] = useState(false)
  const [configFilterOpen, setConfigFilterOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 30])
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [selectedWeapons, setSelectedWeapons] = useState<string[]>([])
  const [selectedSummons, setSelectedSummons] = useState<string[]>([])

  // Advanced filter states for weapons and summons
  interface WeaponCondition {
    type: "include" | "exclude"
    weapon: string
    count: number
  }

  interface SummonCondition {
    type: "include" | "exclude"
    summon: string
  }

  const [selectedWeaponConditions, setSelectedWeaponConditions] = useState<WeaponCondition[]>([])
  const [selectedSummonConditions, setSelectedSummonConditions] = useState<SummonCondition[]>([])

  // Add weapon condition
  const addWeaponCondition = () => {
    setSelectedWeaponConditions([
      ...selectedWeaponConditions,
      { type: "include", weapon: availableWeapons[0], count: 1 },
    ])
  }

  // Update weapon condition
  const updateWeaponCondition = (index: number, field: keyof WeaponCondition, value: any) => {
    const updatedConditions = [...selectedWeaponConditions]
    updatedConditions[index] = { ...updatedConditions[index], [field]: value }
    setSelectedWeaponConditions(updatedConditions)
  }

  // Remove weapon condition
  const removeWeaponCondition = (index: number) => {
    setSelectedWeaponConditions(selectedWeaponConditions.filter((_, i) => i !== index))
  }

  // Add summon condition
  const addSummonCondition = () => {
    setSelectedSummonConditions([...selectedSummonConditions, { type: "include", summon: availableSummons[0] }])
  }

  // Update summon condition
  const updateSummonCondition = (index: number, field: keyof SummonCondition, value: any) => {
    const updatedConditions = [...selectedSummonConditions]
    updatedConditions[index] = { ...updatedConditions[index], [field]: value }
    setSelectedSummonConditions(updatedConditions)
  }

  // Remove summon condition
  const removeSummonCondition = (index: number) => {
    setSelectedSummonConditions(selectedSummonConditions.filter((_, i) => i !== index))
  }

  // Sorting states
  const [sortField, setSortField] = useState<"time" | "date">("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Filtered and sorted guides
  const [guides, setGuides] = useState<GuideData[]>(mockGuides)

  // Filter count
  const filterCount = [
    searchTerm !== "",
    selectedTags.length > 0,
    timeRange[0] !== 0 || timeRange[1] !== 30,
    dateRange.from !== undefined || dateRange.to !== undefined,
    selectedWeaponConditions.length > 0,
    selectedSummonConditions.length > 0,
  ].filter(Boolean).length

  // Handle sort change
  const handleSort = (field: "time" | "date") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("")
    setSelectedTags([])
    setTimeRange([0, 30])
    setDateRange({ from: undefined, to: undefined })
    setSelectedWeapons([])
    setSelectedSummons([])
    setSelectedWeaponConditions([])
    setSelectedSummonConditions([])
  }

  // Available tags for filtering
  const availableTags = ["速刷", "新手向", "无氪", "高难度", "稳定", "高伤害", "自动化"]

  // Available weapons and summons for filtering
  const availableWeapons = ["光剑", "暗刀", "水弓", "火杖", "土枪", "风拳"]
  const availableSummons = ["巴哈姆特", "路西法", "宙斯", "提亚马特", "欧罗巴"]

  return (
    <div className="space-y-6">
      {/* Filter section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">筛选条件</h2>
            {filterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filterCount}
              </Badge>
            )}
          </div>

          {filterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X className="mr-2 h-4 w-4" />
              重置
            </Button>
          )}
        </div>

        {/* Basic filter */}
        <Card className="overflow-hidden backdrop-blur-lg bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <div
            className="flex items-center justify-between p-4 cursor-pointer"
            onClick={() => setBasicFilterOpen(!basicFilterOpen)}
          >
            <h3 className="font-medium">基本筛选</h3>
            <Button variant="ghost" size="sm">
              {basicFilterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {basicFilterOpen && (
            <CardContent className="p-4 pt-0 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="search">副本名称/关键词</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="搜索副本名称或关键词..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>标签</Label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          setSelectedTags(selectedTags.filter((t) => t !== tag))
                        } else {
                          setSelectedTags([...selectedTags, tag])
                        }
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Time filter */}
        <Card className="overflow-hidden backdrop-blur-lg bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <div
            className="flex items-center justify-between p-4 cursor-pointer"
            onClick={() => setTimeFilterOpen(!timeFilterOpen)}
          >
            <h3 className="font-medium">时间筛选</h3>
            <Button variant="ghost" size="sm">
              {timeFilterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {timeFilterOpen && (
            <CardContent className="p-4 pt-0 grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    消耗时间 (分钟)
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {timeRange[0]} - {timeRange[1]}
                  </span>
                </div>
                <Slider defaultValue={[0, 30]} max={30} step={1} value={timeRange} onValueChange={setTimeRange} />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  发布时间
                </Label>
                <DateRangePicker date={dateRange} setDate={setDateRange} />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Config filter */}
        <Card className="overflow-hidden backdrop-blur-lg bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <div
            className="flex items-center justify-between p-4 cursor-pointer"
            onClick={() => setConfigFilterOpen(!configFilterOpen)}
          >
            <h3 className="font-medium">配置筛选</h3>
            <Button variant="ghost" size="sm">
              {configFilterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {configFilterOpen && (
            <CardContent className="p-4 pt-0 grid gap-4">
              {/* Weapon conditions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Sword className="h-4 w-4" />
                    武器条件
                    {selectedWeaponConditions.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {selectedWeaponConditions.length}
                      </Badge>
                    )}
                  </Label>
                  <Button variant="outline" size="sm" onClick={() => addWeaponCondition()} className="h-8">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    添加条件
                  </Button>
                </div>

                {selectedWeaponConditions.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic">点击"添加条件"按钮来创建武器筛选条件</div>
                ) : (
                  <div className="space-y-3">
                    {selectedWeaponConditions.map((condition, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-2 rounded-md"
                      >
                        <Select
                          value={condition.type}
                          onValueChange={(value) => updateWeaponCondition(index, "type", value)}
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue placeholder="类型" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="include">包含</SelectItem>
                            <SelectItem value="exclude">排除</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="flex-1">
                          <EquipmentSelectorModal
                            type="weapon"
                            buttonLabel={condition.weapon || "选择武器"}
                            onSelect={(equipment) => updateWeaponCondition(index, "weapon", equipment.name)}
                          />
                        </div>

                        {condition.type === "include" && (
                          <Select
                            value={condition.count.toString()}
                            onValueChange={(value) => updateWeaponCondition(index, "count", Number.parseInt(value))}
                          >
                            <SelectTrigger className="w-20 h-8">
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

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeWeaponCondition(index)}
                          className="h-8 w-8 ml-auto"
                        >
                          <X className="h-4 w-4" />
                        </Button>
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
                    {selectedSummonConditions.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {selectedSummonConditions.length}
                      </Badge>
                    )}
                  </Label>
                  <Button variant="outline" size="sm" onClick={() => addSummonCondition()} className="h-8">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    添加条件
                  </Button>
                </div>

                {selectedSummonConditions.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic">点击"添加条件"按钮来创建召唤石筛选条件</div>
                ) : (
                  <div className="space-y-3">
                    {selectedSummonConditions.map((condition, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-2 rounded-md"
                      >
                        <Select
                          value={condition.type}
                          onValueChange={(value) => updateSummonCondition(index, "type", value)}
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue placeholder="类型" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="include">包含</SelectItem>
                            <SelectItem value="exclude">排除</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="flex-1">
                          <EquipmentSelectorModal
                            type="summon"
                            buttonLabel={condition.summon || "选择召唤石"}
                            onSelect={(equipment) => updateSummonCondition(index, "summon", equipment.name)}
                          />
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSummonCondition(index)}
                          className="h-8 w-8 ml-auto"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Condition explanation */}
              <div className="text-xs text-muted-foreground bg-slate-100/50 dark:bg-slate-800/50 p-2 rounded-md mt-2">
                <p>所有条件使用AND逻辑（全部满足）。例如：</p>
                <ul className="list-disc list-inside mt-1">
                  <li>包含3把光剑 + 排除暗刀 = 必须有3把光剑且不能有暗刀</li>
                  <li>包含巴哈姆特 + 排除路西法 = 必须有巴哈姆特且不能有路西法</li>
                </ul>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Guides table */}
      <GuideList guides={guides} />
    </div>
  )
}

