"use client"

import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { GuideData } from "@/lib/types"
import { getQuestPhotoUrl } from "@/lib/asset-path"
import { useQuestList } from "@/hooks/use-quest-list"
import React from "react"
import { useTagList } from "@/hooks/use-tag-list"
import { EquipmentImage } from "@/components/equipment-image"

interface GuideListItemProps {
    guide: GuideData
}

export function GuideListItem({ guide }: GuideListItemProps) {
    const { questList } = useQuestList()
    const { tagList } = useTagList()

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

    return (
        <TableRow
            className="cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
            onClick={() => window.open(`/guide/${guide.id}`, '_blank')}
        >
            {/* 副本 */}
            <TableCell className="font-medium">
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
                    />
                </div>
            </TableCell>

            {/* 装备合并 - 移动端 */}
            <TableCell className="md:hidden p-1">
                <div className="flex items-center justify-center space-x-1">
                    <EquipmentImage
                        guideId={guide.id}
                        type="chara"
                        alt="Team composition"
                        size="small"
                    />
                    <EquipmentImage
                        guideId={guide.id}
                        type="weapon"
                        alt="Weapons"
                        size="small"
                    />
                    <EquipmentImage
                        guideId={guide.id}
                        type="summon"
                        alt="Summons"
                        size="small"
                    />
                </div>
            </TableCell>

            {/* 消耗时间 */}
            <TableCell>
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
    )
}
