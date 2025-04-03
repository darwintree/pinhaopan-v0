"use client"
import { useState } from "react"
import { EquipmentSelectorModal } from "@/components/equipment-selector-modal"
import { getEquipmentPhotoUrl } from "@/lib/asset"
import { EquipmentType, DetailedEquipmentData } from "@/lib/types"
import { X } from "lucide-react"

interface EquipmentSelectorProps {
  index: number
  width?: number
  height?: number
  rectangle: { width: number; height: number }
  recognizedEquipment?: { id: string; confidence: number }[]
  type: EquipmentType
  label: string
  onEquipmentSelect: (equipment: DetailedEquipmentData) => void
  isHovered: boolean
  isActive?: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onDelete?: () => void
}

export function EquipmentSelector({
  index,
  width = 80,
  height,
  rectangle,
  recognizedEquipment,
  type,
  label,
  onEquipmentSelect,
  isHovered,
  isActive = false,
  onMouseEnter,
  onMouseLeave,
  onDelete,
}: EquipmentSelectorProps) {
  const handleEquipmentSelect = (equipment: DetailedEquipmentData) => {
    onEquipmentSelect(equipment)
  }

  const aspectRatio = rectangle.height / rectangle.width
  const calculatedHeight = height || width * aspectRatio

  return (
    <div
      className={`flex flex-col items-center ${
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
        {recognizedEquipment && recognizedEquipment.length > 0 ? (
          <img
            src={getEquipmentPhotoUrl(recognizedEquipment[0]?.id, type)}
            alt={recognizedEquipment[0]?.id}
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : (
          <img
            src={`/placeholder.svg?height=${rectangle.height}&width=${rectangle.width}`}
            alt={type}
            className="absolute inset-0 w-full h-full object-contain"
          />
        )}
        
        {onDelete && (
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
      <div className="flex items-center gap-1 mb-1">
        <div className="flex justify-center items-center w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-medium">
          {index}
        </div>
        <span className="text-xs text-muted-foreground">
          {label}
        </span>
      </div>
      <EquipmentSelectorModal
        type={type}
        buttonLabel="手动选择"
        buttonVariant="ghost"
        onSelect={handleEquipmentSelect}
      />
    </div>
  )
}
