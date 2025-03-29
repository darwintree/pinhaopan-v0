"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useQuestList } from "@/hooks/use-quest-list"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface QuestSelectorProps {
  selectedQuest?: string
  onQuestSelect: (questId: string) => void
}

export function QuestSelector({ selectedQuest, onQuestSelect }: QuestSelectorProps) {
  const [filterOpen, setFilterOpen] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const { questList, loading, error } = useQuestList()

  // 获取所有唯一的 category
  const categories = Array.from(new Set(questList.map(quest => quest.category)))

  if (loading) {
    return (
      <Card className="overflow-hidden backdrop-blur-lg bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-700/50 shadow-sm">
        <div className="p-4">
          <div className="animate-pulse flex space-x-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="overflow-hidden backdrop-blur-lg bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-700/50 shadow-sm">
        <div className="p-4 text-red-500">
          加载副本列表失败
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden backdrop-blur-lg bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-700/50 shadow-sm">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setFilterOpen(!filterOpen)}
      >
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">选择副本</h2>
          {selectedQuest && (
            <Badge variant="secondary" className="ml-2">
              已选择
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedQuest && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onQuestSelect("")
              }}
            >
              <X className="h-4 w-4 mr-2" />
              清除选择
            </Button>
          )}
          <Button variant="ghost" size="sm">
            {filterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {filterOpen && (
        <CardContent className="p-4 pt-0 space-y-4">
          {/* 修改 category 筛选器 */}
          <div className="flex items-center gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCategory !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory("all")}
              >
                <X className="h-4 w-4 mr-2" />
                清除筛选
              </Button>
            )}
          </div>

          {/* 修改 quest 列表过滤逻辑 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(selectedCategory === "all" ? questList : questList.filter(quest => quest.category === selectedCategory))
              .map((quest) => (
                <Button
                  key={quest.quest}
                  variant={selectedQuest === quest.quest ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => onQuestSelect(quest.quest)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 flex items-center justify-center overflow-hidden rounded">
                      <img
                        src={`/assets/quest/${quest.image}.png`}
                        alt={quest.name}
                        className="w-auto h-auto max-w-full max-h-full object-contain"
                      />
                    </div>
                    <span className="truncate">{quest.name}</span>
                  </div>
                </Button>
              ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
