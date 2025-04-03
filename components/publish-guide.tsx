"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ImageUploadWithRecognition } from "@/components/image-upload-with-recognition"
import { QuestSelector } from "@/components/quest-selector"
import { useQuestList } from "@/hooks/use-quest-list"
import { TagSelector } from "@/components/tag-selector"
import { GuidePostData } from "@/lib/types"
import { resizeImageWithAspectRatio } from "@/lib/utils"

export function PublishGuide() {
  // Form states
  const [name, setName] = useState("")
  const [time, setTime] = useState(300) // 时间以秒为单位存储
  const [isTimeEnabled, setIsTimeEnabled] = useState(false) // 时间是否启用
  const [description, setDescription] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])

  // Image upload states
  const [teamImages, setTeamImages] = useState<string[]>([])
  const [weaponImages, setWeaponImages] = useState<string[]>([])
  const [summonImages, setSummonImages] = useState<string[]>([])

  // Auto-recognize state (shared across all uploads)
  const [autoRecognize, setAutoRecognize] = useState(false)

  const [isPending, setIsPending] = useState(false)

  const [selectedQuest, setSelectedQuest] = useState<string>("")

  const { questList } = useQuestList()

  // Recognition results states
  const [charaResults, setCharaResults] = useState<Record<number, {id: string, confidence: number}[]>>({})
  const [weaponResults, setWeaponResults] = useState<Record<number, {id: string, confidence: number}[]>>({})
  const [summonResults, setSummonResults] = useState<Record<number, {id: string, confidence: number}[]>>({})

  // Handle tag input
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim() !== "") {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()])
      }
      setTagInput("")
    }
  }

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)

    try {
      // Validate required fields
      if (!selectedQuest) {
        throw new Error("请选择副本")
      }

      if (teamImages.length === 0) {
        throw new Error("请上传角色图片")
      }

      if (weaponImages.length === 0) {
        throw new Error("请上传武器图片")
      }

      if (summonImages.length === 0) {
        throw new Error("请上传召唤石图片")
      }

      // 调整图片大小，保持宽高比
      const resizedCharasBase64 = await resizeImageWithAspectRatio(teamImages[0])
      const resizedWeaponsBase64 = await resizeImageWithAspectRatio(weaponImages[0])
      const resizedSummonsBase64 = await resizeImageWithAspectRatio(summonImages[0])

      // Get recognized equipment IDs
      const charas = Object.values(charaResults)
        .map(results => results[0])
        .filter(Boolean)
        .map(result => ({
          id: result.id,
          type: "chara" as const
        }))
      const weapons = Object.values(weaponResults)
        .map(results => results[0])
        .filter(Boolean)
        .map(result => ({
          id: result.id,
          type: "weapon" as const
        }))
      const summons = Object.values(summonResults)
        .map(results => results[0])
        .filter(Boolean)
        .map(result => ({
          id: result.id,
          type: "summon" as const
        }))

      // Prepare the data
      const postData: GuidePostData = {
        quest: selectedQuest,
        ...(isTimeEnabled ? { time } : {}), // 仅在启用时添加time字段
        description,
        tags,
        charas,
        charasBase64: resizedCharasBase64,
        weapons,
        weaponsBase64: resizedWeaponsBase64,
        summons,
        summonsBase64: resizedSummonsBase64,
      }

      console.log(postData)

      // Send the data to the API
      const response = await fetch("/api/guides/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "发布失败")
      }

      // Reset form on success
      setName("")
      setTime(0)
      setIsTimeEnabled(false)
      setDescription("")
      setTags([])
      setTeamImages([])
      setWeaponImages([])
      setSummonImages([])
      setSelectedQuest("")
      setCharaResults({})
      setWeaponResults({})
      setSummonResults({})

      // Show success message
      alert("配置发布成功！")

    } catch (error) {
      // Show error message
      alert(error instanceof Error ? error.message : "发布失败，请重试")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
      <QuestSelector
        selectedQuest={selectedQuest}
        onQuestSelect={setSelectedQuest}
      />

      <Card className="backdrop-blur-lg bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-700/50 shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-6">配置基本信息</h2>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>已选副本</Label>
                <div className="p-3 rounded-md bg-slate-100/50 dark:bg-slate-800/50">
                  {selectedQuest ? (
                    <span className="font-medium">
                      {questList.find(quest => quest.quest === selectedQuest)?.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">请先选择副本</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="time" className="flex items-center gap-2">
                    消耗时间
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>完成副本所需的时间（分:秒），可选</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground mr-2">
                      {isTimeEnabled ? "已启用" : "未启用"}
                    </span>
                    <label 
                      htmlFor="timeToggle" 
                      className="relative inline-flex h-5 w-10 items-center rounded-full bg-slate-300 dark:bg-slate-700 cursor-pointer"
                    >
                      <input
                        id="timeToggle"
                        type="checkbox"
                        className="peer sr-only"
                        checked={isTimeEnabled}
                        onChange={() => setIsTimeEnabled(!isTimeEnabled)}
                      />
                      <span className={`absolute mx-1 h-3 w-3 rounded-full bg-white transition-transform ${isTimeEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </label>
                  </div>
                </div>
                {isTimeEnabled && (
                  <>
                    <div className="flex items-center justify-end">
                      <span className="text-sm text-muted-foreground">
                        {Math.floor(time / 60)}分{time % 60}秒
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label htmlFor="minutes" className="text-xs text-muted-foreground">分钟</Label>
                        <div className="flex items-center">
                          <Input
                            id="minutes"
                            type="number"
                            min={0}
                            max={59}
                            value={Math.floor(time / 60)}
                            onChange={(e) => {
                              const min = parseInt(e.target.value) || 0;
                              setTime((min * 60) + (time % 60));
                            }}
                            className="text-center"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="seconds" className="text-xs text-muted-foreground">秒</Label>
                        <div className="flex items-center">
                          <Input
                            id="seconds"
                            type="number"
                            min={0}
                            max={59}
                            value={time % 60}
                            onChange={(e) => {
                              const sec = parseInt(e.target.value) || 0;
                              setTime(Math.floor(time / 60) * 60 + sec);
                            }}
                            className="text-center"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="pt-2">
                      <Slider
                        id="time-slider"
                        min={0}
                        max={3600}
                        step={1}
                        value={[time]}
                        onValueChange={(value) => setTime(value[0])}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">备注</Label>
              <Textarea
                id="description"
                placeholder="配置简要备注（不超过50字）"
                className="min-h-[120px]"
                value={description}
                onChange={(e) => {
                  if (e.target.value.length <= 50) {
                    setDescription(e.target.value)
                  }
                }}
              />
              <div className="text-sm text-muted-foreground text-right">
                {description.length}/50
              </div>
            </div>

            <div className="space-y-2">
              <TagSelector selectedTags={tags} onTagSelect={setTags} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {/* Single upload card */}
        <Card className="backdrop-blur-lg bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
          <div className="bg-primary/10 p-3 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Upload className="h-5 w-5" />
              上传游戏截图
            </h3>
            <Badge variant="outline" className="font-normal">
              必填
            </Badge>
          </div>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* 角色上传 */}
              <ImageUploadWithRecognition
                type="chara"
                title="角色图片上传"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-users"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                }
                images={teamImages}
                setImages={setTeamImages}
                autoRecognize={autoRecognize}
                setAutoRecognize={setAutoRecognize}
                infoText="上传一张包含所有角色的图片，系统将自动识别"
                onRecognitionResults={setCharaResults}
              />

              {/* 武器上传 */}
              <ImageUploadWithRecognition
                type="weapon"
                title="武器图片上传"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-sword"
                  >
                    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
                    <line x1="13" x2="19" y1="19" y2="13" />
                    <line x1="16" x2="20" y1="16" y2="20" />
                    <line x1="19" x2="21" y1="21" y2="19" />
                  </svg>
                }
                images={weaponImages}
                setImages={setWeaponImages}
                autoRecognize={autoRecognize}
                setAutoRecognize={setAutoRecognize}
                infoText="上传一张包含所有武器的图片，系统将自动识别"
                onRecognitionResults={setWeaponResults}
              />

              {/* 召唤石上传 */}
              <ImageUploadWithRecognition
                type="summon"
                title="召唤石图片上传"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-sparkles"
                  >
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                    <path d="M5 3v4" />
                    <path d="M19 17v4" />
                    <path d="M3 5h4" />
                    <path d="M17 19h4" />
                  </svg>
                }
                images={summonImages}
                setImages={setSummonImages}
                autoRecognize={autoRecognize}
                setAutoRecognize={setAutoRecognize}
                infoText="上传一张包含所有召唤石的图片，系统将自动识别"
                onRecognitionResults={setSummonResults}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center mt-8">
        <Button type="submit" size="lg" className="px-8 relative group">
          <span className={isPending ? "invisible" : ""}>发布配置</span>
          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          )}
        </Button>
      </div>
    </form>
  )
}

