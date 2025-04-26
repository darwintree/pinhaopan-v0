"use client"

import { useState } from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { GuideData } from "@/lib/types"
import { getQuestPhotoUrl, getGuidePhotoUrl, getGuidePhotoThumbUrl } from "@/lib/asset-path"
import { useQuestList } from "@/hooks/use-quest-list"
import React from "react"
import { useTagList } from "@/hooks/use-tag-list"
import { EquipmentImage } from "@/components/browse/equipment-image"
import Lightbox from "yet-another-react-lightbox"
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails"
import "yet-another-react-lightbox/styles.css"
import "yet-another-react-lightbox/plugins/thumbnails.css"

interface GuideListItemProps {
    guide: GuideData
    isAnyLightboxOpen: boolean
    setIsAnyLightboxOpen: (isOpen: boolean) => void
}

export function GuideListItem({ guide, isAnyLightboxOpen, setIsAnyLightboxOpen }: GuideListItemProps) {
    const { questList } = useQuestList()
    const { tagList } = useTagList()
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [lightboxIndex, setLightboxIndex] = useState(0)

    // 查找对应的quest信息
    const questInfo = questList.find(q => q.quest === guide.quest)

    // 使用quest信息，如果找不到则使用默认值
    const questName = questInfo?.name || guide.quest
    const questImageUrl = getQuestPhotoUrl(questInfo?.image)

    // 过滤出在标签列表中的标签，并获取它们的颜色信息
    const validTags = guide.tags.filter(tag =>
        tagList.some(t => t.name === tag)
    ).map(tag => ({
        name: tag,
        color: tagList.find(t => t.name === tag)?.color || ""
    }));

    // Prepare lightbox slides with thumbnails
    const charaImageUrl = getGuidePhotoUrl(guide.id, 'chara');
    const weaponImageUrl = getGuidePhotoUrl(guide.id, 'weapon');
    const summonImageUrl = getGuidePhotoUrl(guide.id, 'summon');
    const charaThumbUrl = getGuidePhotoThumbUrl(guide.id, 'chara');
    const weaponThumbUrl = getGuidePhotoThumbUrl(guide.id, 'weapon');
    const summonThumbUrl = getGuidePhotoThumbUrl(guide.id, 'summon');
    
    const lightboxSlides = [
      { src: charaImageUrl, alt: 'Team composition', thumbnail: charaThumbUrl },
      { src: weaponImageUrl, alt: 'Weapons', thumbnail: weaponThumbUrl },
      { src: summonImageUrl, alt: 'Summons', thumbnail: summonThumbUrl },
    ];

    // Event Handlers
    const handleImageClick = (index: number) => {
      setLightboxIndex(index);
      setLightboxOpen(true);
      setIsAnyLightboxOpen(true);
    };

    const handleLightboxClose = () => {
      setLightboxOpen(false);
      setIsAnyLightboxOpen(false);
    };

    return (
      <>
        <TableRow
            className={`cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 ${isAnyLightboxOpen ? 'pointer-events-none opacity-50' : ''}`}
            onClick={() => {
                if (!isAnyLightboxOpen) { 
                    window.open(`/guide/${guide.id}`, '_blank');
                }
            }}
        >
            {/* 副本 */}
            <TableCell className="font-medium px-3 py-1">
                <div className="flex items-center">
                    <img
                        src={questImageUrl}
                        alt={questName}
                        className="h-8 w-auto rounded transition-transform hover:scale-105"
                    />
                    <span className="ml-2 hidden md:inline">{questName}</span>
                </div>
            </TableCell>

            {/* 角色 - 桌面端 */}
            <TableCell className="hidden md:table-cell">
                <div className="flex items-center">
                    <EquipmentImage
                        guideId={guide.id}
                        type="chara"
                        alt="Team composition"
                        index={0}
                        onImageClick={handleImageClick}
                    />
                </div>
            </TableCell>

            {/* 武器 - 桌面端 */}
            <TableCell className="hidden md:table-cell">
                <div className="flex items-center">
                    <EquipmentImage
                        guideId={guide.id}
                        type="weapon"
                        alt="Weapons"
                        index={1}
                        onImageClick={handleImageClick}
                    />
                </div>
            </TableCell>

            {/* 召唤石 - 桌面端 */}
            <TableCell className="hidden md:table-cell">
                <div className="flex items-center">
                    <EquipmentImage
                        guideId={guide.id}
                        type="summon"
                        alt="Summons"
                        index={2}
                        onImageClick={handleImageClick}
                    />
                </div>
            </TableCell>

            {/* 装备合并 - 移动端 */}
            <TableCell className="md:hidden px-3 py-1">
                <div className="flex items-center justify-center space-x-1">
                    <EquipmentImage
                        guideId={guide.id}
                        type="chara"
                        alt="Team composition"
                        size="small"
                        index={0}
                        onImageClick={handleImageClick}
                    />
                    <span className="text-sm text-muted-foreground">...</span>
                </div>
            </TableCell>

            {/* 消耗时间 */}
            <TableCell className="px-3 py-1">
                {guide.time ? `${Math.floor(guide.time / 60)}:${(guide.time % 60).toString().padStart(2, '0')}` : '-'}
                {guide.turn ? `/${guide.turn}t` : '/-'}
            </TableCell>

            {/* 发布时间 - 桌面端 */}
            <TableCell className="hidden md:table-cell">{new Date(guide.date).toLocaleDateString()}</TableCell>

            {/* 标签 - 桌面端 */}
            <TableCell className="hidden md:table-cell">
                <div className="flex flex-wrap gap-1">
                    {validTags.map((tag) => (
                        <Badge
                            key={tag.name}
                            variant="outline"
                            className="text-xs"
                            style={{
                                borderColor: tag.color,
                                color: tag.color,
                                backgroundColor: tag.color ? `${tag.color}20` : undefined
                            }}
                        >
                            {tag.name}
                        </Badge>
                    ))}
                </div>
            </TableCell>

            {/* 描述 */}
            <TableCell className="hidden md:table-cell">{guide.description}</TableCell>
        </TableRow>
        <Lightbox
            open={lightboxOpen}
            close={handleLightboxClose}
            index={lightboxIndex}
            slides={lightboxSlides}
            plugins={[Thumbnails]}
            styles={{ root: { "--yarl__color_backdrop": "rgba(0, 0, 0, 0.7)" } }}
            controller={{ closeOnBackdropClick: true }}
        />
      </>
    )
}
