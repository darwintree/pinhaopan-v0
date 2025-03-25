"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Upload, X, Move } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EquipmentSelectorModal } from "@/components/equipment-selector-modal"
import { Switch } from "@/components/ui/switch"
import { Rnd } from "react-rnd"
import type { Rectangle, EquipmentType } from "@/lib/utils"
import { detectRectangles } from "@/lib/utils"

interface ImageUploadWithRecognitionProps {
  type: EquipmentType
  title: string
  icon: React.ReactNode
  images: string[]
  setImages: React.Dispatch<React.SetStateAction<string[]>>
  autoRecognize: boolean
  setAutoRecognize: React.Dispatch<React.SetStateAction<boolean>>
  infoText?: string
  gridCols?: number
  resultCount?: number
}

export function ImageUploadWithRecognition({
  type,
  title,
  icon,
  images,
  setImages,
  autoRecognize,
  setAutoRecognize,
  infoText = "上传一张包含所有内容的图片，系统将自动识别",
  gridCols = 3,
  resultCount = 9,
}: ImageUploadWithRecognitionProps) {
  // Rectangle detection states
  const [rectangles, setRectangles] = useState<Rectangle[]>([])
  const [activeRectangle, setActiveRectangle] = useState<number | null>(null)
  const [hoveredRectangle, setHoveredRectangle] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageSize, setImageSize] = useState({ width: 800, height: 450 })
  const [containerScale, setContainerScale] = useState(1)

  // Process image with OpenCV
  const processImageWithOpenCV = async (imageUrl: string) => {
    try {
      // 使用 mock 数据模拟矩形检测
      const result = await detectRectangles(imageUrl, type)
      setRectangles(result.rectangles)
      setImageSize(result.imageSize)

      // 如果启用了自动识别，继续识别过程
      if (autoRecognize) {
        recognizeEquipment()
      }
    } catch (error) {
      console.error("Failed to process image:", error)
    }
  }

  // Calculate container scale when image loads
  useEffect(() => {
    if (images.length > 0 && imageRef.current && containerRef.current) {
      const img = new Image()
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height })

        // Calculate scale based on container width
        const containerWidth = containerRef.current?.clientWidth || 800
        const scale = containerWidth / img.width
        setContainerScale(scale)
      }
      img.src = images[0]
    }
  }, [images])

  // Recognize equipment
  const recognizeEquipment = () => {
    console.log(`Recognizing ${type} with rectangles:`, rectangles)

    // Simulate API call for recognition
    // In a real implementation, you would send the rectangles to your backend
    setTimeout(() => {
      console.log(`${type} recognition complete`)
      // Here you would update the recognition results
    }, 1000)
  }

  // Get placeholder size based on type
  const getPlaceholderSize = () => {
    switch (type) {
      case "chara":
        return { width: 48, height: 48, className: "w-12 h-12 rounded-full" }
      case "weapon":
        return { width: 40, height: 40, className: "w-10 h-10 rounded" }
      case "summon":
        return { width: 48, height: 48, className: "w-12 h-12 rounded" }
      default:
        return { width: 40, height: 40, className: "w-10 h-10 rounded" }
    }
  }

  // Get actual result count based on type
  const getActualResultCount = () => {
    if (resultCount) return resultCount

    switch (type) {
      case "chara":
        return 5
      case "weapon":
        return 9
      case "summon":
        return 4
      default:
        return 5
    }
  }

  // Get default selection name based on type and index
  const getDefaultSelection = (index: number) => {
    switch (type) {
      case "chara":
        return `character${index + 1}`
      case "weapon":
        return `weapon${index + 1}`
      case "summon":
        return `summon${index + 1}`
      default:
        return `item${index + 1}`
    }
  }

  // Get default selection label based on type and index
  const getDefaultSelectionLabel = (index: number) => {
    switch (type) {
      case "chara":
        return `角色${index + 1}`
      case "weapon":
        return type === "weapon" && index === 0 ? "光剑" : type === "weapon" && index === 1 ? "暗刀" : "水弓"
      case "summon":
        return type === "summon" && index === 0 ? "巴哈姆特" : type === "summon" && index === 1 ? "路西法" : "宙斯"
      default:
        return `Item ${index + 1}`
    }
  }

  const placeholderSize = getPlaceholderSize()
  const actualResultCount = getActualResultCount()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">自动识别</span>
          <Switch checked={autoRecognize} onCheckedChange={setAutoRecognize} />
        </div>
      </div>
      <div
        className={`border-2 border-dashed rounded-lg transition-colors ${
          images.length > 0 ? "border-slate-300 dark:border-slate-700" : "border-primary/50 hover:border-primary"
        } ${images.length === 0 ? "p-6" : "p-4"}`}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const files = Array.from(e.dataTransfer.files)
          if (files.length > 0 && files[0]) {
            const reader = new FileReader()
            reader.onload = (e) => {
              if (e.target?.result) {
                setImages([e.target.result as string])
                // Process image with OpenCV after upload
                processImageWithOpenCV(e.target.result as string)
              }
            }
            reader.readAsDataURL(files[0])
          }
        }}
      >
        {images.length === 0 ? (
          <label className="flex flex-col items-center justify-center cursor-pointer text-center">
            <Upload className="h-10 w-10 text-primary/60 mb-2" />
            <p className="text-sm font-medium mb-1">点击或拖拽上传{title}</p>
            <p className="text-xs text-muted-foreground">支持PNG、JPG格式，系统将自动识别所有{title}</p>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const reader = new FileReader()
                  reader.onload = (e) => {
                    if (e.target?.result) {
                      setImages([e.target.result as string])
                      // Process image with OpenCV after upload
                      processImageWithOpenCV(e.target.result as string)
                    }
                  }
                  reader.readAsDataURL(e.target.files[0])
                }
              }}
            />
          </label>
        ) : (
          <>
            <div
              ref={containerRef}
              className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 mb-4"
            >
              {/* Image */}
              <img
                ref={imageRef}
                src={images[0] || "/placeholder.svg"}
                alt={`${title} screenshot`}
                className="w-full h-full object-contain"
              />

              {/* Resizable rectangles */}
              <div className="absolute inset-0">
                {rectangles.map((rect, index) => (
                  <Rnd
                    key={index}
                    size={{ width: rect.width * containerScale, height: rect.height * containerScale }}
                    position={{ x: rect.x * containerScale, y: rect.y * containerScale }}
                    onDragStop={(e, d) => {
                      const newRectangles = [...rectangles]
                      newRectangles[index] = {
                        ...newRectangles[index],
                        x: d.x / containerScale,
                        y: d.y / containerScale,
                      }
                      setRectangles(newRectangles)
                    }}
                    onResizeStop={(e, direction, ref, delta, position) => {
                      const newRectangles = [...rectangles]
                      newRectangles[index] = {
                        ...newRectangles[index],
                        width: Number.parseInt(ref.style.width) / containerScale,
                        height: Number.parseInt(ref.style.height) / containerScale,
                        x: position.x / containerScale,
                        y: position.y / containerScale,
                      }
                      setRectangles(newRectangles)
                    }}
                    className={`${
                      activeRectangle === index
                        ? "border-blue-500"
                        : hoveredRectangle === index
                          ? "border-green-500"
                          : "border-red-500"
                    } border-2 cursor-move`}
                    onMouseEnter={() => setHoveredRectangle(index)}
                    onMouseLeave={() => setHoveredRectangle(null)}
                    onClick={() => setActiveRectangle(index)}
                    dragHandleClassName="drag-handle"
                    resizeHandleStyles={{
                      topLeft: { cursor: "nwse-resize" },
                      topRight: { cursor: "nesw-resize" },
                      bottomLeft: { cursor: "nesw-resize" },
                      bottomRight: { cursor: "nwse-resize" },
                    }}
                    bounds="parent"
                  >
                    <div className="w-full h-full relative">
                      <div className="absolute -top-5 -left-0 bg-white dark:bg-slate-800 text-black dark:text-white px-1 text-xs rounded">
                        {rect.id}
                      </div>
                      <div className="drag-handle absolute inset-0 flex items-center justify-center">
                        <Move className="h-4 w-4 text-white opacity-50 pointer-events-none" />
                      </div>
                    </div>
                  </Rnd>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setImages([])
                  setRectangles([])
                }}
                className="absolute top-2 right-2 rounded-full bg-red-500/90 p-1 text-white"
              >
                <X className="h-4 w-4" />
              </button>

              {!autoRecognize && rectangles.length > 0 && (
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center bg-black/50 text-white p-2 rounded">
                  <div className="flex items-center gap-1 text-xs">
                    <Move className="h-3 w-3" />
                    <span>拖动矩形框调整位置，拖动边角调整大小</span>
                  </div>
                  <Button size="sm" onClick={recognizeEquipment} className="h-7 text-xs">
                    识别
                  </Button>
                </div>
              )}
            </div>

            {/* 自动识别结果 */}
            <div className="space-y-2 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">自动识别结果</h4>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={recognizeEquipment}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-refresh-cw mr-1"
                  >
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M3 21v-5h5" />
                  </svg>
                  重新识别
                </Button>
              </div>
              <div className={`grid grid-cols-${gridCols} gap-2`}>
                {Array.from({ length: actualResultCount }).map((_, index) => (
                  <div
                    key={index}
                    className={`flex flex-col items-center ${
                      hoveredRectangle === index ? "bg-green-100 dark:bg-green-900/20 rounded-lg p-1" : "p-1"
                    }`}
                    onMouseEnter={() => setHoveredRectangle(index)}
                    onMouseLeave={() => setHoveredRectangle(null)}
                  >
                    <div className={`${placeholderSize.className} bg-slate-200 dark:bg-slate-700 mb-1 overflow-hidden`}>
                      <img
                        src={`/placeholder.svg?height=${placeholderSize.height}&width=${placeholderSize.width}`}
                        alt={type}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      <div className="flex justify-center items-center w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-medium">
                        {index}
                      </div>
                      <Select defaultValue={getDefaultSelection(index)}>
                        <SelectTrigger className="w-full h-7 text-xs">
                          <SelectValue placeholder={`选择${title}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={getDefaultSelection(index)}>{getDefaultSelectionLabel(index)}</SelectItem>
                          <SelectItem value="other">其他{title}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <EquipmentSelectorModal
                      type={type}
                      buttonLabel="手动选择"
                      buttonVariant="ghost"
                      onSelect={(equipment) => {
                        console.log(`Selected ${type}: ${equipment.name}`)
                        // Here you would update the selection
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      <p className="text-xs text-muted-foreground flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-info mr-1"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        {infoText}
      </p>
    </div>
  )
}

