"use client"

import { getGuidePhotoThumbUrl } from "@/lib/asset-path"

interface EquipmentImageProps {
  guideId: string
  type: "chara" | "weapon" | "summon"
  alt: string
  size?: "normal" | "small"
  index: number
  onImageClick: (index: number) => void
}

export function EquipmentImage({ guideId, type, alt, size = "normal", index, onImageClick }: EquipmentImageProps) {
  const thumbImageUrl = getGuidePhotoThumbUrl(guideId, type)
  
  return (
    <>
      <img 
        loading="lazy"
        src={thumbImageUrl}
        alt={alt}
        className={`${size === "small" ? "h-16" : "h-20"} w-auto rounded transition-transform hover:scale-105 cursor-zoom-in`}
        onClick={(e) => {
          e.stopPropagation()
          onImageClick(index)
        }}
      />
    </>
  )
}
