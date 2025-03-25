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

export function PublishGuide() {
  // Form states
  const [name, setName] = useState("")
  const [time, setTime] = useState(5)
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)

    // Simulate API call
    setTimeout(() => {
      // Here you would typically send the data to your backend
      console.log({
        name,
        time,
        description,
        tags,
        teamImages,
        weaponImages,
        summonImages,
      })

      // Reset form
      setName("")
      setTime(5)
      setDescription("")
      setTags([])
      setTeamImages([])
      setWeaponImages([])
      setSummonImages([])
      setIsPending(false)
    }, 1500)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
      <Card className="backdrop-blur-lg bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-700/50 shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-6">攻略基本信息</h2>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">副本名称</Label>
                <Input
                  id="name"
                  placeholder="输入副本名称"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="time" className="flex items-center gap-2">
                    消耗时间 (分钟)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>完成副本所需的大致时间</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <span className="text-sm text-muted-foreground">{time} 分钟</span>
                </div>
                <Slider
                  id="time"
                  min={1}
                  max={30}
                  step={1}
                  value={[time]}
                  onValueChange={(value) => setTime(value[0])}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">攻略描述</Label>
              <Textarea
                id="description"
                placeholder="详细描述攻略内容、打法要点等..."
                className="min-h-[120px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">标签</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 size-4 inline-flex items-center justify-center"
                    >
                      <X className="size-3" />
                      <span className="sr-only">移除</span>
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                id="tags"
                placeholder="输入标签并按回车添加"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInput}
              />
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
                gridCols={5}
                resultCount={5}
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
                gridCols={3}
                resultCount={9}
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
                gridCols={2}
                resultCount={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center mt-8">
        <Button type="submit" size="lg" className="px-8 relative group">
          <span className={isPending ? "invisible" : ""}>发布攻略</span>
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

