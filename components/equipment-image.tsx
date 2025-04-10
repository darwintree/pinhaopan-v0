"use client"

import { useState, useEffect } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { getGuidePhotoUrl, getGuidePhotoThumbUrl } from "@/lib/asset"

interface EquipmentImageProps {
  guideId: string
  type: "chara" | "weapon" | "summon"
  alt: string
  size?: "normal" | "small"
}

export function EquipmentImage({ guideId, type, alt, size = "normal" }: EquipmentImageProps) {
  const [showModal, setShowModal] = useState(false)
  const [showPopover, setShowPopover] = useState(false)
  const [preventNavigation, setPreventNavigation] = useState(false)
  const imageUrl = getGuidePhotoUrl(guideId, type)
  const thumbImageUrl = getGuidePhotoThumbUrl(guideId, type)
  
  // 使用useEffect监听preventNavigation状态，自动重置
  useEffect(() => {
    if (preventNavigation) {
      // 设置一个短暂的超时，然后重置状态
      const timer = setTimeout(() => {
        setPreventNavigation(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [preventNavigation]);

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowModal(true)
    setShowPopover(false) // 关闭预览
  }

  return (
    <div onClick={(e) => {
      if (preventNavigation) {
        e.stopPropagation();
      }
    }}>
      <Popover open={showPopover} onOpenChange={setShowPopover}>
        <PopoverTrigger asChild>
          <div 
            className="cursor-zoom-in"
            onMouseEnter={() => setShowPopover(true)}
            onMouseLeave={() => setShowPopover(false)}
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              loading="lazy"
              src={thumbImageUrl}
              alt={alt}
              className={`${size === "small" ? "h-8" : "h-12"} w-auto rounded transition-transform hover:scale-105`}
              onClick={handleImageClick}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="p-0 border-none shadow-xl" 
          side="top"
          onMouseEnter={() => setShowPopover(true)}
          onMouseLeave={() => setShowPopover(false)}
          onClick={(e) => e.stopPropagation()}
        >
          <img 
            src={imageUrl}
            alt={alt}
            className="max-h-[300px] w-auto rounded cursor-zoom-in"
            onClick={handleImageClick}
          />
        </PopoverContent>
      </Popover>

      <Dialog 
        open={showModal} 
        onOpenChange={(open) => {
          setShowModal(open);
          // 如果是要关闭对话框，激活导航阻止
          if (!open) {
            setPreventNavigation(true);
          }
        }}
      >
        <DialogContent 
          className="max-w-[95vw] w-fit p-0 [&>button]:text-white [&>button]:hover:bg-transparent [&>button]:focus-visible:ring-0"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogTitle asChild>
            <VisuallyHidden>
              {`${type.charAt(0).toUpperCase() + type.slice(1)} Image Preview`}
            </VisuallyHidden>
          </DialogTitle>
          <img 
            src={imageUrl}
            alt={alt}
            className="max-h-[80vh] max-w-[75vw] min-w-[30vw] w-auto rounded object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
