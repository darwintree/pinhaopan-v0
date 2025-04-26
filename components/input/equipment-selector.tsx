"use client"

import { useState } from "react";
import { EquipmentSelectorModal } from "@/components/input/equipment-selector-modal"
import { getSameCrewNonSkinIdList, isSkin } from "@/hooks/use-crew-info"
import { getEquipmentPhotoUrl } from "@/lib/asset-path"
import { normalizeEquipmentId } from "@/lib/asset"
import { EquipmentType, DetailedEquipmentData } from "@/lib/types"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EquipmentSelectorProps {
  index: number
  width?: number
  height?: number
  rectangle: { width: number; height: number }
  recognizedEquipments?: { id: string; confidence: number }[]
  type: EquipmentType
  label: string
  onEquipmentSelect: (equipment: DetailedEquipmentData) => void
  isHovered: boolean
  isActive?: boolean
  displayDeleteButton?: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onDelete?: () => void
}

export function EquipmentSelector({
  index,
  width = 60,
  height,
  rectangle,
  recognizedEquipments,
  type,
  label,
  onEquipmentSelect,
  isHovered,
  isActive = false,
  displayDeleteButton = true,
  onMouseEnter,
  onMouseLeave,
  onDelete,
}: EquipmentSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEquipmentSelect = (equipment: DetailedEquipmentData) => {
    onEquipmentSelect(equipment)
  }

  const aspectRatio = rectangle.height / rectangle.width
  const calculatedHeight = height || width * aspectRatio

  let priorityIds = recognizedEquipments?.map(item => normalizeEquipmentId(item.id)) || []
  let equipmentIsSkin = false
  if (type === "chara" && recognizedEquipments?.[0]?.id) {
    const normalizedId = normalizeEquipmentId(recognizedEquipments[0].id)
    priorityIds = priorityIds?.concat(
      getSameCrewNonSkinIdList(normalizedId)
    )
    equipmentIsSkin = isSkin(normalizedId)
  }


  return (
    <div
      className={`flex flex-col items-center ${
        equipmentIsSkin ? "bg-red-100 dark:bg-red-900/30 rounded-lg p-1" :
        isActive ? "bg-blue-100 dark:bg-blue-900/30 rounded-lg p-1" : 
        isHovered ? "bg-green-100 dark:bg-green-900/20 rounded-lg p-1" : "p-1"
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div 
        className="relative mb-1 overflow-hidden"
        style={{ 
          width: `${width}px`,
          height: `${calculatedHeight}px`
        }}
      >
        {recognizedEquipments && recognizedEquipments.length > 0 ? (
          <img
            src={getEquipmentPhotoUrl(recognizedEquipments[0]?.id, type)}
            alt={recognizedEquipments[0]?.id}
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : (
          <img
            src={`/placeholder.svg?height=${rectangle.height}&width=${rectangle.width}`}
            alt={type}
            className="absolute inset-0 w-full h-full object-contain"
          />
        )}
        
        {displayDeleteButton && onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="absolute top-0 right-0 bg-red-500/90 text-white p-0.5 rounded-bl-md hover:bg-red-600"
            title="删除"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      {/* <div className="flex items-center gap-1 mb-1">
        <div className="flex justify-center items-center w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-medium">
          {index}
        </div>
        <span className="text-xs text-muted-foreground">
          {label}
        </span>
      </div> */}
      <Button 
        type="button"
        variant={equipmentIsSkin ? "default" : "secondary"} 
        size="xs"
        onClick={() => setIsModalOpen(true)}
      >
        {equipmentIsSkin ? "必须重选" : recognizedEquipments?.length ? "手动选择" : "未识别"}
      </Button>

      <EquipmentSelectorModal
        type={type}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSelect={handleEquipmentSelect}
        priorityIds={priorityIds}
      />
    </div>
  )
}
