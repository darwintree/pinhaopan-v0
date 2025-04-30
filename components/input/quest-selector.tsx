"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useQuestList } from "@/hooks/use-quest-list"
import { getQuestPhotoUrl, getCategoryUrl } from "@/lib/asset-path"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"

interface QuestSelectorProps {
  selectedQuest?: string
  onQuestSelect: (questId: string) => void
}

export function QuestSelector({ selectedQuest, onQuestSelect }: QuestSelectorProps) {
  const [filterOpen, setFilterOpen] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<string | null>(null)
  const { questList, loading, error } = useQuestList()

  // 获取所有唯一的 category
  const categories = Array.from(new Set(questList.map(quest => quest.category)))

  const handleCategoryClick = (category: string) => {
    setCurrentCategory(category)
    setIsModalOpen(true)
  }

  const handleQuestSelect = (questId: string) => {
    onQuestSelect(questId)
    setIsModalOpen(false)
  }

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

  // 根据当前选中的category过滤quest列表
  const filteredQuests = currentCategory
    ? questList.filter(quest => quest.category === currentCategory)
    : []

  return (
    <>
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
                type="button"
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
            <Button type="button" variant="ghost" size="sm">
              {filterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {filterOpen && (
          <CardContent className="p-4 pt-0 space-y-4">
            {/* Category砖块网格 */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
              {categories.map(category => (
                <div
                  key={category}
                  className="relative overflow-hidden rounded-md border cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                  onClick={() => handleCategoryClick(category)}
                  style={{ height: 'auto', maxWidth: '150px' }}
                >
                  <img
                    src={getCategoryUrl(category)}
                    alt={category}
                    className="w-full h-auto"
                    style={{ display: 'block' }}
                  />
                </div>
              ))}
            </div>

            {/* 已选择的Quest显示 */}
            {selectedQuest && (
              <div className="mt-4 p-3 border rounded-md bg-muted/30">
                <h3 className="font-medium mb-2">已选择副本:</h3>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 flex items-center justify-center overflow-hidden rounded">
                    <img
                      src={getQuestPhotoUrl(questList.find(q => q.quest === selectedQuest)?.image, questList.find(q => q.quest === selectedQuest)?.customImage)}
                      alt={questList.find(q => q.quest === selectedQuest)?.name}
                      className="w-auto h-auto max-w-full max-h-full object-contain"
                    />
                  </div>
                  <span>{questList.find(q => q.quest === selectedQuest)?.name}</span>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Quest选择Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-2">
          <DialogTitle asChild>
            <VisuallyHidden>
              选择{currentCategory}副本
            </VisuallyHidden>
          </DialogTitle>
          <div className="grid gap-1 max-h-[80vh] overflow-y-auto">
            {filteredQuests.map((quest) => (
              <Button
                key={quest.quest}
                type="button"
                variant={selectedQuest === quest.quest ? "default" : "outline"}
                className="w-full justify-start h-auto py-1"
                onClick={() => handleQuestSelect(quest.quest)}
              >
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded">
                    <img
                      src={getQuestPhotoUrl(quest.image, quest.customImage)}
                      alt={quest.name}
                      className="w-auto h-auto max-w-full max-h-full object-contain"
                    />
                  </div>
                  <span className="truncate">{quest.name}</span>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
