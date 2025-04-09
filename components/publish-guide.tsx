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
import { ToggleInput } from "@/components/ui/toggle-input"
import { ImageUploadWithRecognition } from "@/components/image-upload-with-recognition"
import { QuestSelector } from "@/components/quest-selector"
import { useQuestList } from "@/hooks/use-quest-list"
import { TagSelector } from "@/components/tag-selector"
import { GuidePostData } from "@/lib/types"
import { resizeImageWithAspectRatio } from "@/lib/utils"
import { UsersIcon } from "@/components/icon/users-icon"
import { SwordIcon } from "@/components/icon/sword-icon"
import { SparklesIcon } from "@/components/icon/sparkles-icon"
import { saveGuide } from "@/lib/remote-db"

export function PublishGuide() {
  // Form states
  const [name, setName] = useState("")
  const [time, setTime] = useState(300) // 时间以秒为单位存储
  const [isTimeEnabled, setIsTimeEnabled] = useState(false) // 时间是否启用
  const [turn, setTurn] = useState(1) // 回合数
  const [isTurnEnabled, setIsTurnEnabled] = useState(false) // 回合数是否启用
  const [contribution, setContribution] = useState(0) // 贡献度
  const [isContributionEnabled, setIsContributionEnabled] = useState(false) // 贡献度是否启用
  const [buttonSkill, setButtonSkill] = useState(0) // 技能按键数
  const [buttonSummon, setButtonSummon] = useState(0) // 召唤按键数
  const [isButtonEnabled, setIsButtonEnabled] = useState(false) // 按键数是否启用
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

  // Image upload configurations
  const uploadConfigs = [
    {
      type: "chara" as const,
      title: "角色图片上传",
      icon: <UsersIcon />,
      images: teamImages,
      setImages: setTeamImages,
      infoText: "上传一张包含所有角色的图片，系统将自动识别主体",
      onRecognitionResults: setCharaResults
    },
    {
      type: "weapon" as const,
      title: "武器图片上传",
      icon: <SwordIcon />,
      images: weaponImages,
      setImages: setWeaponImages,
      infoText: "上传一张包含所有武器的图片，系统将自动识别主体",
      onRecognitionResults: setWeaponResults
    },
    {
      type: "summon" as const,
      title: "召唤石图片上传",
      icon: <SparklesIcon />,
      images: summonImages,
      setImages: setSummonImages,
      infoText: "上传一张包含所有召唤石的图片，系统将自动识别主体",
      onRecognitionResults: setSummonResults
    }
  ]

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
        ...(isTurnEnabled ? { turn } : {}), // 仅在启用时添加turn字段
        ...(isContributionEnabled ? { contribution } : {}), // 仅在启用时添加contribution字段
        ...(isButtonEnabled ? { button: { skill: buttonSkill, summon: buttonSummon } } : {}), // 仅在启用时添加button字段
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

      // 使用remote-db的saveGuide函数替代直接调用API
      const guideId = await saveGuide(postData)

      // Reset form on success
      setName("")
      setTime(0)
      setIsTimeEnabled(false)
      setTurn(1)
      setIsTurnEnabled(false)
      setContribution(0)
      setIsContributionEnabled(false)
      setButtonSkill(0)
      setButtonSummon(0)
      setIsButtonEnabled(false)
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
        <CardContent className="p-3 sm:p-4 md:p-6">
          <h2 className="text-2xl font-bold mb-4 sm:mb-6">配置基本信息</h2>

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

              <ToggleInput
                id="time"
                label="消耗时间"
                tooltipText="完成副本所需的时间（分:秒），可选"
                enabled={isTimeEnabled}
                onToggle={() => setIsTimeEnabled(!isTimeEnabled)}
              >
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
              </ToggleInput>
            </div>

            <div className="grid gap-4 md:grid-cols-2 mt-6">
              {/* 回合数输入项 */}
              <ToggleInput
                id="turn"
                label="回合数"
                tooltipText="通关所需的回合数，可选"
                enabled={isTurnEnabled}
                onToggle={() => setIsTurnEnabled(!isTurnEnabled)}
              >
                <div className="pt-2">
                  <Input
                    id="turn"
                    type="number"
                    min={1}
                    value={turn}
                    onChange={(e) => setTurn(parseInt(e.target.value) || 1)}
                    className="text-center"
                  />
                </div>
              </ToggleInput>

              {/* 贡献度输入项 */}
              <ToggleInput
                id="contribution"
                label="贡献度"
                tooltipText="战斗贡献度，可选"
                enabled={isContributionEnabled}
                onToggle={() => setIsContributionEnabled(!isContributionEnabled)}
              >
                <div className="pt-2">
                  <Input
                    id="contribution"
                    type="number"
                    min={0}
                    value={contribution}
                    onChange={(e) => setContribution(parseInt(e.target.value) || 0)}
                    className="text-center"
                  />
                </div>
              </ToggleInput>
            </div>

            {/* 按键数输入项 */}
            <div className="mt-6">
              <ToggleInput
                id="button"
                label="按键数"
                tooltipText="战斗中使用的技能和召唤按键数量，可选"
                enabled={isButtonEnabled}
                onToggle={() => setIsButtonEnabled(!isButtonEnabled)}
              >
                <div className="grid gap-4 md:grid-cols-2 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="buttonSkill" className="text-xs text-muted-foreground">技能按键数</Label>
                    <Input
                      id="buttonSkill"
                      type="number"
                      min={0}
                      value={buttonSkill}
                      onChange={(e) => setButtonSkill(parseInt(e.target.value) || 0)}
                      className="text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buttonSummon" className="text-xs text-muted-foreground">召唤按键数</Label>
                    <Input
                      id="buttonSummon"
                      type="number"
                      min={0}
                      value={buttonSummon}
                      onChange={(e) => setButtonSummon(parseInt(e.target.value) || 0)}
                      className="text-center"
                    />
                  </div>
                </div>
              </ToggleInput>
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
          <div className="bg-primary/10 p-2 sm:p-3 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Upload className="h-5 w-5" />
              上传游戏截图
            </h3>
            <Badge variant="outline" className="font-normal">
              必填
            </Badge>
          </div>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="space-y-6">
              {uploadConfigs.map((config) => (
                <ImageUploadWithRecognition
                  key={config.type}
                  type={config.type}
                  title={config.title}
                  icon={config.icon}
                  images={config.images}
                  setImages={config.setImages}
                  autoRecognize={autoRecognize}
                  setAutoRecognize={setAutoRecognize}
                  infoText={config.infoText}
                  onRecognitionResults={config.onRecognitionResults}
                />
              ))}
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

