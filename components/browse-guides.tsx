"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronDown, ChevronUp, Filter, Clock, Calendar, Sword, Search, X, Plus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/date-range-picker"
import type { GuideData, EquipmentFilterCondition } from "@/lib/types"
import { EquipmentSelectorModal } from "@/components/equipment-selector-modal"
import { GuideList } from "@/components/guide-list"
import { EquipmentSelector } from "@/components/equipment-selector"
import { QuestSelector } from "@/components/quest-selector"
import { TagSelector } from "@/components/tag-selector"



export function BrowseGuides() {
  // Filter states
  const [basicFilterOpen, setBasicFilterOpen] = useState(true)
  const [timeFilterOpen, setTimeFilterOpen] = useState(false)
  const [configFilterOpen, setConfigFilterOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 600]) // 以秒为单位存储，初始值0-10分钟
  const [debouncedTimeRange, setDebouncedTimeRange] = useState<[number, number]>([0, 600]) // 防抖后的时间范围
  const [timeScale, setTimeScale] = useState<"small" | "medium" | "large">("small") // 时间范围尺度
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [selectedWeaponConditions, setSelectedWeaponConditions] = useState<EquipmentFilterCondition[]>([])
  const [selectedSummonConditions, setSelectedSummonConditions] = useState<EquipmentFilterCondition[]>([])
  const [selectedCharaConditions, setSelectedCharaConditions] = useState<EquipmentFilterCondition[]>([])

  // Sorting states
  const [sortField, setSortField] = useState<"time" | "date">("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Data states
  const [guides, setGuides] = useState<GuideData[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [availableWeapons, setAvailableWeapons] = useState<string[]>([])
  const [availableSummons, setAvailableSummons] = useState<string[]>([])
  const [availableCharas, setAvailableCharas] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedQuest, setSelectedQuest] = useState<string>("")

  // Filter count
  const filterCount = [
    selectedTags.length > 0,
    timeRange[0] !== 0 || timeRange[1] !== 600,
    dateRange.from !== undefined || dateRange.to !== undefined,
    selectedWeaponConditions.length > 0,
    selectedSummonConditions.length > 0,
    selectedCharaConditions.length > 0,
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
    setSelectedTags([])
    setTimeRange([0, 600]) // 重置为0-10分钟（秒为单位）
    setTimeScale("small")
    setDateRange({ from: undefined, to: undefined })
    setSelectedWeaponConditions([])
    setSelectedSummonConditions([])
    setSelectedCharaConditions([])
  }

  // Add weapon condition
  const addWeaponCondition = () => {
    setSelectedWeaponConditions([
      ...selectedWeaponConditions,
      { type: "weapon", id: availableWeapons[0], include: true, count: 1 },
    ])
  }

  // Update weapon condition
  const updateWeaponCondition = (index: number, field: keyof EquipmentFilterCondition, value: any) => {
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
    setSelectedSummonConditions([
      ...selectedSummonConditions,
      { type: "summon", id: availableSummons[0], include: true, count: 1 },
    ])
  }

  // Update summon condition
  const updateSummonCondition = (index: number, field: keyof EquipmentFilterCondition, value: any) => {
    const updatedConditions = [...selectedSummonConditions]
    updatedConditions[index] = { ...updatedConditions[index], [field]: value }
    setSelectedSummonConditions(updatedConditions)
  }

  // Remove summon condition
  const removeSummonCondition = (index: number) => {
    setSelectedSummonConditions(selectedSummonConditions.filter((_, i) => i !== index))
  }

  // Add chara condition
  const addCharaCondition = () => {
    setSelectedCharaConditions([
      ...selectedCharaConditions,
      { type: "chara", id: availableCharas[0], include: true, count: 1 },
    ])
  }

  // Update chara condition
  const updateCharaCondition = (index: number, field: keyof EquipmentFilterCondition, value: any) => {
    const updatedConditions = [...selectedCharaConditions]
    updatedConditions[index] = { ...updatedConditions[index], [field]: value }
    setSelectedCharaConditions(updatedConditions)
  }

  // Remove chara condition
  const removeCharaCondition = (index: number) => {
    setSelectedCharaConditions(selectedCharaConditions.filter((_, i) => i !== index))
  }

  // 根据当前选择的时间尺度获取最大时间值和步进值
  const getTimeScaleConfig = () => {
    switch (timeScale) {
      case "small": // 0-10分钟，精度5秒
        return { max: 600, step: 5 }
      case "medium": // 0-30分钟，精度30秒
        return { max: 1800, step: 30 }
      case "large": // 0-90分钟，精度1分钟
        return { max: 5400, step: 60 }
    }
  }

  // 格式化时间显示（秒->分:秒）
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 防抖处理时间范围变化
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTimeRange(timeRange);
    }, 500); // 500ms 防抖延迟
    
    return () => {
      clearTimeout(timer);
    };
  }, [timeRange]);

  // Fetch guides data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        
        // 添加搜索条件
        if (selectedQuest) {
          params.append("quest", selectedQuest)
        }
        
        // 添加标签
        selectedTags.forEach(tag => {
          params.append("tags", tag)
        })
        
        // 添加时间范围（使用防抖后的值）
        params.append("timeRange", debouncedTimeRange.join(","))
        
        // 添加日期范围
        if (dateRange.from || dateRange.to) {
          const dateRangeStr = [
            dateRange.from?.toISOString() || "",
            dateRange.to?.toISOString() || ""
          ].join(",")
          params.append("dateRange", dateRangeStr)
        }
        
        // 添加排序条件
        params.append("sortField", sortField)
        params.append("sortDirection", sortDirection)

        // 添加装备条件
        if (selectedWeaponConditions.length > 0) {
          params.append("weaponConditions", JSON.stringify(selectedWeaponConditions))
        }
        if (selectedSummonConditions.length > 0) {
          params.append("summonConditions", JSON.stringify(selectedSummonConditions))
        }
        if (selectedCharaConditions.length > 0) {
          params.append("charaConditions", JSON.stringify(selectedCharaConditions))
        }

        const response = await fetch(`/api/guides?${params}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        
        if (!data.guides || !Array.isArray(data.guides)) {
          throw new Error("Invalid response format: guides is missing or not an array")
        }
        
        setGuides(data.guides)
        setAvailableTags(data.availableTags || [])
        setAvailableWeapons(data.availableWeapons || [])
        setAvailableSummons(data.availableSummons || [])
        setAvailableCharas(data.availableCharas || [])
      } catch (error) {
        console.error("Failed to fetch guides data:", error)
        // 可以添加错误提示UI
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [
    selectedQuest,
    selectedTags,
    debouncedTimeRange,
    dateRange,
    selectedWeaponConditions,
    selectedSummonConditions,
    selectedCharaConditions,
    sortField,
    sortDirection,
  ])

  return (
    <div className="space-y-6">
      <QuestSelector
        selectedQuest={selectedQuest}
        onQuestSelect={setSelectedQuest}
      />

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
            <h3 className="font-medium">标签筛选</h3>
            <Button variant="ghost" size="sm">
              {basicFilterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {basicFilterOpen && (
            <CardContent className="p-4 pt-0">
              <TagSelector 
                selectedTags={selectedTags}
                onTagSelect={setSelectedTags}
              />
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
                    消耗时间
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formatTime(timeRange[0])} - {formatTime(timeRange[1])}
                    </span>
                    <Select
                      value={timeScale}
                      onValueChange={(value) => {
                        setTimeScale(value as "small" | "medium" | "large")
                        // 切换时间尺度时，重置范围到该尺度的默认值
                        const { max } = getTimeScaleConfig()
                        setTimeRange([0, max])
                      }}
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
                </div>
                <Slider 
                  max={getTimeScaleConfig().max} 
                  step={getTimeScaleConfig().step} 
                  value={timeRange} 
                  onValueChange={(value) => setTimeRange(value as [number, number])} 
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  发布时间
                </Label>
                <DateRangePicker 
                  date={dateRange} 
                  setDate={(range) => setDateRange(range as { from: Date | undefined; to: Date | undefined })} 
                />
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedWeaponConditions.map((condition, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-2 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <Select
                            value={condition.include ? "include" : "exclude"}
                            onValueChange={(value) => updateWeaponCondition(index, "include", value === "include")}
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
                            onClick={() => removeWeaponCondition(index)}
                            className="h-8 w-8 ml-auto"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <EquipmentSelector
                          index={index + 1}
                          type="weapon"
                          label={condition.include ? `需要${condition.count}把` : "排除"}
                          rectangle={{ width: 160, height: 100 }}
                          recognizedEquipment={condition.id ? [{ id: condition.id, confidence: 1 }] : undefined}
                          onEquipmentSelect={(equipment) => updateWeaponCondition(index, "id", equipment.id)}
                          isHovered={false}
                          onMouseEnter={() => {}}
                          onMouseLeave={() => {}}
                        />

                        {condition.include && (
                          <Select
                            value={condition.count.toString()}
                            onValueChange={(value) => updateWeaponCondition(index, "count", Number.parseInt(value))}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedSummonConditions.map((condition, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-2 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <Select
                            value={condition.include ? "include" : "exclude"}
                            onValueChange={(value) => updateSummonCondition(index, "include", value === "include")}
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
                            onClick={() => removeSummonCondition(index)}
                            className="h-8 w-8 ml-auto"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <EquipmentSelector
                          index={index + 1}
                          type="summon"
                          label={condition.include ? "需要" : "排除"}
                          rectangle={{ width: 160, height: 100 }}
                          recognizedEquipment={condition.id ? [{ id: condition.id, confidence: 1 }] : undefined}
                          onEquipmentSelect={(equipment) => updateSummonCondition(index, "id", equipment.id)}
                          isHovered={false}
                          onMouseEnter={() => {}}
                          onMouseLeave={() => {}}
                        />
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
                    {selectedCharaConditions.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {selectedCharaConditions.length}
                      </Badge>
                    )}
                  </Label>
                  <Button variant="outline" size="sm" onClick={() => addCharaCondition()} className="h-8">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    添加条件
                  </Button>
                </div>

                {selectedCharaConditions.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic">点击"添加条件"按钮来创建角色筛选条件</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedCharaConditions.map((condition, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-2 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <Select
                            value={condition.include ? "include" : "exclude"}
                            onValueChange={(value) => updateCharaCondition(index, "include", value === "include")}
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
                            onClick={() => removeCharaCondition(index)}
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
                          recognizedEquipment={condition.id ? [{ id: condition.id, confidence: 1 }] : undefined}
                          onEquipmentSelect={(equipment) => updateCharaCondition(index, "id", equipment.id)}
                          isHovered={false}
                          onMouseEnter={() => {}}
                          onMouseLeave={() => {}}
                        />
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
                  <li>包含水狗 + 排除火狐 = 必须有水狗且不能有火狐</li>
                </ul>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Guides table */}
      <GuideList guides={guides} loading={loading} />
    </div>
  )
}

