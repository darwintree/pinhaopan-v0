"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Link, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getGuidePhotoUrl, getQuestPhotoUrl, getGuidePhotoThumbUrl } from "@/lib/asset-path"
import type { GuideData } from "@/lib/types"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { useTagList } from "@/hooks/use-tag-list"
import { useQuestList } from "@/hooks/use-quest-list"
import Giscus from "@giscus/react"
import { getGuide } from "@/lib/remote-db"
import Lightbox from "yet-another-react-lightbox"
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails"
import { EquipmentSelector } from "@/components/input/equipment-selector"
import "yet-another-react-lightbox/styles.css"
import "yet-another-react-lightbox/plugins/thumbnails.css"

export default function GuidePage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [guide, setGuide] = useState<GuideData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const { tagList, loading: tagsLoading } = useTagList()
  const { questList, loading: questLoading } = useQuestList()
  const [theme, setTheme] = useState<string>("light")
  const [showCharasDetails, setShowCharasDetails] = useState(false);
  const [showWeaponsDetails, setShowWeaponsDetails] = useState(false);
  const [showSummonsDetails, setShowSummonsDetails] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark")
    setTheme(isDarkMode ? "dark" : "light")

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          const isDarkMode = document.documentElement.classList.contains("dark")
          setTheme(isDarkMode ? "dark" : "light")
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })

    return () => {
      observer.disconnect()
    }
  }, [])

  const isLoading = loading || tagsLoading || questLoading

  useEffect(() => {
    const fetchGuide = async () => {
      if (!params.id) {
        setLoading(false)
        return
      }
      
      try {
        const data = await getGuide(params.id as string)
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

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const handleLightboxClose = () => {
    setLightboxOpen(false)
  }

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

  const getTagStyle = (color: string) => {
    if (!color) return {}
    return {
      backgroundColor: color,
      color: '#ffffff',
      borderColor: 'transparent'
    }
  }

  let lightboxSlides: { src: string; alt: string; thumbnail: string }[] = [];
  if (guide) {
    const charaImageUrl = getGuidePhotoUrl(guide.id, 'chara');
    const weaponImageUrl = getGuidePhotoUrl(guide.id, 'weapon');
    const summonImageUrl = getGuidePhotoUrl(guide.id, 'summon');
    const charaThumbUrl = getGuidePhotoThumbUrl(guide.id, 'chara'); 
    const weaponThumbUrl = getGuidePhotoThumbUrl(guide.id, 'weapon');
    const summonThumbUrl = getGuidePhotoThumbUrl(guide.id, 'summon');
    lightboxSlides = [
      { src: charaImageUrl, alt: 'Team composition', thumbnail: charaThumbUrl },
      { src: weaponImageUrl, alt: 'Weapons', thumbnail: weaponThumbUrl },
      { src: summonImageUrl, alt: 'Summons', thumbnail: summonThumbUrl },
    ];
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
    <div className="container mx-auto py-4 px-4 max-w-5xl">
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
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

      {guide && (
        <Card className="backdrop-blur-lg bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col space-y-6">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  {questList.length > 0 && (() => {
                    const questInfo = questList.find(q => q.quest === guide.quest)
                    const questName = questInfo?.name || guide.quest
                    const questImageUrl = getQuestPhotoUrl(questInfo?.image, questInfo?.customImage)
                    
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
                    <span className="font-medium">{guide.time ? `${Math.floor(guide.time / 60)}:${(guide.time % 60).toString().padStart(2, '0')}` : '未记录'}</span>
                    {guide.turn && (
                      <span className="ml-1 font-medium">/{guide.turn}t</span>
                    )}
                  </div>
                  {guide.contribution && (
                    <div className="flex items-center">
                      <span className="text-muted-foreground mr-2">贡献度:</span>
                      <span className="font-medium">{guide.contribution}</span>
                    </div>
                  )}
                  {guide.button && (
                    <div className="flex items-center">
                      <span className="text-muted-foreground mr-2">按键:</span>
                      <span className="font-medium">
                        {guide.button.skill}技/{guide.button.summon}召
                      </span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <span className="text-muted-foreground mr-2">发布:</span>
                    <span className="font-medium">{new Date(guide.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Links Section */}
              {guide.links && guide.links.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground">相关链接:</h3>
                  <ul className="space-y-1">
                    {guide.links.map((link, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Link className="mr-2 h-3 w-3 text-primary flex-shrink-0" />
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline break-all"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-slate-100/50 dark:bg-slate-800/50 p-3 rounded-md text-sm">
                <h3 className="font-medium mb-1 text-muted-foreground">配置说明</h3>
                <p>{guide.description}</p>
              </div>

              <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">队伍配置</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowCharasDetails(!showCharasDetails)} className="text-xs">
                      {showCharasDetails ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                      {showCharasDetails ? "收起列表" : "展开列表"}
                    </Button>
                  </div>
                  <div 
                    className="cursor-zoom-in h-full"
                    onClick={() => openLightbox(0)}
                  >
                    <img
                      src={getGuidePhotoUrl(guide.id, "chara")}
                      alt="Team composition"
                      className="w-full h-auto max-h-[350px] object-contain rounded border border-slate-200/50 dark:border-slate-700/50 transition-transform hover:scale-[1.02]"
                    />
                    {showCharasDetails && guide.charas && guide.charas.length > 0 && (
                      <div className="mt-2 p-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {guide.charas.slice(0, 3).map((chara, index) => (
                            <EquipmentSelector
                              key={`chara-main-${index}`}
                              type="chara"
                              selectedEquipment={chara}
                              onEquipmentSelect={() => {}} 
                              isHovered={false} 
                              disabled={true}
                              displayDeleteButton={false}
                              width={50} 
                              rectangle={{ width: 48, height: 48}}
                              onMouseEnter={() => {}} 
                              onMouseLeave={() => {}}
                            />
                          ))}
                        </div>
                        {guide.charas.length > 3 && (
                          <div className="flex flex-wrap gap-2">
                            {guide.charas.slice(3).map((chara, index) => (
                              <EquipmentSelector
                                key={`chara-sub-${index}`}
                                type="chara"
                                selectedEquipment={chara}
                                onEquipmentSelect={() => {}} 
                                isHovered={false} 
                                disabled={true}
                                displayDeleteButton={false}
                                width={50} 
                                rectangle={{ width: 48, height: 48}} 
                                onMouseEnter={() => {}} 
                                onMouseLeave={() => {}}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">武器配置</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowWeaponsDetails(!showWeaponsDetails)} className="text-xs">
                      {showWeaponsDetails ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                      {showWeaponsDetails ? "收起列表" : "展开列表"}
                    </Button>
                  </div>
                  <div 
                    className="cursor-zoom-in h-full"
                    onClick={() => openLightbox(1)}
                  >
                    <img
                      src={getGuidePhotoUrl(guide.id, "weapon")}
                      alt="Weapons"
                      className="w-full h-auto max-h-[350px] object-contain rounded border border-slate-200/50 dark:border-slate-700/50 transition-transform hover:scale-[1.02]"
                    />
                    {showWeaponsDetails && guide.weapons && guide.weapons.length > 0 && (
                      <div className="mt-2 p-2 border-t border-dashed border-slate-200 dark:border-slate-700 flex gap-4">
                        {/* Left column for the first weapon */}
                        <div>
                          <EquipmentSelector
                            key={`weapon-main-0`}
                            type="weapon"
                            selectedEquipment={guide.weapons[0]}
                            onEquipmentSelect={() => {}} 
                            isHovered={false} 
                            disabled={true}
                            displayDeleteButton={false}
                            width={50}
                            rectangle={{ width: 40, height: 40}}
                            onMouseEnter={() => {}} 
                            onMouseLeave={() => {}} 
                          />
                        </div>
                        {/* Right column for the rest of the weapons */}
                        {guide.weapons.length > 1 && (
                          <div className="grid grid-cols-3 gap-2 flex-1">
                            {guide.weapons.slice(1).map((weapon, index) => (
                              <EquipmentSelector
                                key={`weapon-sub-${index}`}
                                type="weapon"
                                selectedEquipment={weapon}
                                onEquipmentSelect={() => {}} 
                                isHovered={false} 
                                disabled={true}
                                displayDeleteButton={false}
                                width={50}
                                rectangle={{ width: 40, height: 40}} 
                                onMouseEnter={() => {}} 
                                onMouseLeave={() => {}} 
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">召唤石配置</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowSummonsDetails(!showSummonsDetails)} className="text-xs">
                      {showSummonsDetails ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                      {showSummonsDetails ? "收起列表" : "展开列表"}
                    </Button>
                  </div>
                  <div 
                    className="cursor-zoom-in h-full"
                    onClick={() => openLightbox(2)}
                  >
                    <img
                      src={getGuidePhotoUrl(guide.id, "summon")}
                      alt="Summons"
                      className="w-full h-auto max-h-[350px] object-contain rounded border border-slate-200/50 dark:border-slate-700/50 transition-transform hover:scale-[1.02]"
                    />
                  {showSummonsDetails && (guide.summons || guide.friendSummon) && (
                    <div className="mt-2 p-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                      {/* Friend Summon Display */}
                      {guide.friendSummon && (
                        <div className="mb-3 pb-3 border-b border-dotted border-slate-300 dark:border-slate-600">
                          <h4 className="text-xs font-semibold text-muted-foreground mb-1">友召</h4>
                          <EquipmentSelector
                            key="friend-summon-display"
                            type="summon"
                            selectedEquipment={guide.friendSummon}
                            onEquipmentSelect={() => {}}
                            isHovered={false}
                            disabled={true}
                            displayDeleteButton={false}
                            width={50}
                            rectangle={{ width: 48, height: 48 }}
                            onMouseEnter={() => {}}
                            onMouseLeave={() => {}}
                          />
                        </div>
                      )}

                      {/* Regular Summons Display */}
                      {guide.summons && guide.summons.length > 0 && (
                        <div className="flex gap-4">
                          {/* Left column for the first summon (Main Summon) */}
                          {guide.summons[0] && (
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground mb-1">主召</h4>
                              <EquipmentSelector
                                key={`summon-main-0`}
                                type="summon"
                                selectedEquipment={guide.summons[0]}
                                onEquipmentSelect={() => {}}
                                isHovered={false}
                                disabled={true}
                                displayDeleteButton={false}
                                width={50}
                                rectangle={{ width: 48, height: 48}}
                                onMouseEnter={() => {}}
                                onMouseLeave={() => {}}
                              />
                            </div>
                          )}
                          
                          {/* Right column for the rest of the summons (Sub Summons) */}
                          {guide.summons.length > 1 && (
                            <div className="flex-1">
                               <h4 className="text-xs font-semibold text-muted-foreground mb-1">其他召唤</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {guide.summons.slice(1).map((summon, index) => (
                                  <EquipmentSelector
                                    key={`summon-sub-${index}`}
                                    type="summon"
                                    selectedEquipment={summon}
                                    onEquipmentSelect={() => {}}
                                    isHovered={false}
                                    disabled={true}
                                    displayDeleteButton={false}
                                    width={50}
                                    rectangle={{ width: 48, height: 48}}
                                    onMouseEnter={() => {}}
                                    onMouseLeave={() => {}}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {guide && (
        <div className="mt-8 mb-6">
          <h2 className="text-xl font-semibold mb-4">讨论</h2>
          <Card className="backdrop-blur-lg bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-700/50 shadow-sm">
            <CardContent className="p-4 md:p-6">
              <Giscus
                id="comments"
                repo="GbfPhp/Panscus"
                repoId="R_kgDOOTKTxw"
                category="Announcements"
                categoryId="DIC_kwDOOTKTx84Cou5o"
                mapping="url"
                strict="0"
                reactionsEnabled="1"
                emitMetadata="0"
                inputPosition="bottom"
                theme={theme}
                lang="zh-CN"
                loading="lazy"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {guide && lightboxSlides.length > 0 && (
        <Lightbox
            open={lightboxOpen}
            close={handleLightboxClose}
            index={lightboxIndex}
            slides={lightboxSlides}
            plugins={[Thumbnails]}
            styles={{ root: { "--yarl__color_backdrop": "rgba(0, 0, 0, 0.7)" } }}
            controller={{ closeOnBackdropClick: true }}
            render={{
              iconClose: () => null,
            }}
        />
      )}
    </div>
  )
} 