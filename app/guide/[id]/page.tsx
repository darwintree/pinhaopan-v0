"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Share, Link, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getGuidePhotoUrl, getQuestPhotoUrl } from "@/lib/asset"
import type { GuideData } from "@/lib/types"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { useTagList } from "@/hooks/use-tag-list"
import { useQuestList } from "@/hooks/use-quest-list"
import { cn } from "@/lib/utils"

export default function GuidePage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [guide, setGuide] = useState<GuideData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState<{
    type: "chara" | "weapon" | "summon",
    open: boolean
  }>({ type: "chara", open: false })
  const { tagList, loading: tagsLoading } = useTagList()
  const { questList, loading: questLoading } = useQuestList()

  // 整体加载状态
  const isLoading = loading || tagsLoading || questLoading

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const response = await fetch(`/api/guides/${params.id}`)
        const data = await response.json()
        setGuide(data)
      } catch (error) {
        console.error("Failed to fetch guide:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchGuide()
  }, [params.id])

  const copyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast({
      title: "链接已复制",
      description: "配置链接已复制到剪贴板",
      duration: 2000,
    })
  }

  const handleImageClick = (type: "chara" | "weapon" | "summon") => {
    setShowModal({
      type,
      open: true
    })
  }

  // 过滤并获取有效标签的颜色
  const getValidTags = () => {
    if (!guide || tagsLoading) return []
    
    return guide.tags
      .filter(tagName => tagList.some(tag => tag.name === tagName))
      .map(tagName => {
        const tagInfo = tagList.find(tag => tag.name === tagName)
        return {
          name: tagName,
          color: tagInfo?.color || ""
        }
      })
  }

  // 根据颜色字符串创建内联样式
  const getTagStyle = (color: string) => {
    if (!color) return {}
    return {
      backgroundColor: color,
      color: '#ffffff',
      borderColor: 'transparent'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!guide) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">未找到该配置</h1>
        <Button onClick={() => router.back()}>返回</Button>
      </div>
    )
  }

  const validTags = getValidTags()

  return (
    <div className="container mx-auto py-4 px-4">
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="p-0 h-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回列表
        </Button>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={copyLink} className="h-8 w-8">
                <Link className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>复制配置链接</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Card className="backdrop-blur-lg bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-700/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col space-y-4">
            {/* 标题和基本信息行 */}
            <div className="flex flex-col md:flex-row justify-between">
              <div>
                {guide && (
                  <div className="flex items-center mb-2">
                    {questList.length > 0 && (() => {
                      const questInfo = questList.find(q => q.quest === guide.quest)
                      const questName = questInfo?.name || guide.quest
                      const questImageUrl = getQuestPhotoUrl(questInfo?.image)
                      
                      return (
                        <>
                          <img
                            src={questImageUrl}
                            alt={questName}
                            className="h-12 w-auto rounded mr-3"
                          />
                          <h1 className="text-2xl font-semibold">{questName}</h1>
                        </>
                      )
                    })()}
                  </div>
                )}
                {validTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {validTags.map((tag) => (
                      <Badge 
                        key={tag.name} 
                        className="text-xs"
                        style={getTagStyle(tag.color)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col md:flex-row md:items-end md:space-x-4 mt-2 md:mt-0 text-sm">
                <div className="flex items-center">
                  <span className="text-muted-foreground mr-2">耗时:</span>
                  <span className="font-medium">{guide.time} 分钟</span>
                </div>
                <div className="flex items-center">
                  <span className="text-muted-foreground mr-2">发布:</span>
                  <span className="font-medium">{new Date(guide.date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* 配置描述 */}
            {guide.description && (
              <div className="bg-slate-100/50 dark:bg-slate-800/50 p-3 rounded-md text-sm">
                <h3 className="font-medium mb-1 text-muted-foreground">配置说明</h3>
                <p>{guide.description}</p>
              </div>
            )}

            {/* 配置图片区 - 移动端优化布局 */}
            <div className="space-y-4">
              {/* 队伍配置 - 单独一行 */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">队伍配置</h3>
                <div 
                  className="cursor-zoom-in"
                  onClick={() => handleImageClick("chara")}
                >
                  <img
                    src={getGuidePhotoUrl(guide.id, "chara")}
                    alt="Team composition"
                    className="w-full h-auto rounded border border-slate-200/50 dark:border-slate-700/50 transition-transform hover:scale-[1.02]"
                  />
                </div>
              </div>
              
              {/* 武器和召唤石配置 - 并排一行 */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">武器配置</h3>
                  <div 
                    className="cursor-zoom-in"
                    onClick={() => handleImageClick("weapon")}
                  >
                    <img
                      src={getGuidePhotoUrl(guide.id, "weapon")}
                      alt="Weapons"
                      className="w-full h-auto rounded border border-slate-200/50 dark:border-slate-700/50 transition-transform hover:scale-[1.02]"
                    />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">召唤石配置</h3>
                  <div 
                    className="cursor-zoom-in"
                    onClick={() => handleImageClick("summon")}
                  >
                    <img
                      src={getGuidePhotoUrl(guide.id, "summon")}
                      alt="Summons"
                      className="w-full h-auto rounded border border-slate-200/50 dark:border-slate-700/50 transition-transform hover:scale-[1.02]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 大图预览模态框 */}
      <Dialog open={showModal.open} onOpenChange={(open) => setShowModal({ ...showModal, open })}>
        <DialogContent className="max-w-[95vw] w-fit p-0 [&>button]:text-white [&>button]:hover:bg-transparent [&>button]:focus-visible:ring-0">
          <DialogTitle asChild>
            <VisuallyHidden>
              {showModal.type === "chara" 
                ? "队伍配置"
                : showModal.type === "weapon" 
                  ? "武器配置" 
                  : "召唤石配置"
              }
            </VisuallyHidden>
          </DialogTitle>
          {guide && (
            <img 
              src={getGuidePhotoUrl(guide.id, showModal.type)}
              alt={showModal.type === "chara" 
                ? "Team composition"
                : showModal.type === "weapon" 
                  ? "Weapons" 
                  : "Summons"
              }
              className="max-h-[90vh] w-auto rounded"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 