"use client"

import { useState, useRef, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import type { DetectEquipmentType, EquipmentDetectResults } from "@/lib/types"
import type { Rectangle, EquipmentType } from "@/lib/utils"
import { detectRectangles, getImageDescriptorsFromImageAndRectangles } from "@/lib/utils"
import { UploadArea } from "./image-recognition/upload-area"
import { RectangleEditor } from "./image-recognition/rectangle-editor"
import { RecognitionResults } from "./image-recognition/recognition-results"

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
  const [recognizedEquipment, setRecognizedEquipment] = useState<Record<number, {id: string, confidence: number}[]>>({})
  const [showResults, setShowResults] = useState(false)
  const [isRecognizing, setIsRecognizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageSize, setImageSize] = useState({ width: 800, height: 450 })
  const [containerScale, setContainerScale] = useState(1)

  // Process image with OpenCV
  const processImageWithOpenCV = async (imageUrl: string) => {
    try {
      const result = await detectRectangles(imageUrl, type)
      setRectangles(result.rectangles)
      setImageSize(result.imageSize)

      if (autoRecognize) {
        setShowResults(false)
        // 等待图片加载完成
        await new Promise<void>((resolve) => {
          if (imageRef.current) {
            imageRef.current.onload = () => resolve()
            imageRef.current.src = imageUrl
          } else {
            resolve()
          }
        })
        await recognizeEquipment(result.rectangles)
      }
    } catch (error) {
      console.error("Failed to process image:", error)
    }
  }

  // Calculate container scale when image loads
  useEffect(() => {
    if (images.length > 0 && imageRef.current && containerRef.current) {
      const img = imageRef.current
      const containerWidth = containerRef.current.clientWidth
      
      // Wait for image to load to get natural dimensions
      if (!img.complete) {
        img.onload = () => {
          const scale = containerWidth / img.naturalWidth
          setContainerScale(scale)
          setImageSize({
            width: img.naturalWidth,
            height: img.naturalHeight
          })
        }
      } else {
        const scale = containerWidth / img.naturalWidth
        setContainerScale(scale)
        setImageSize({
          width: img.naturalWidth,
          height: img.naturalHeight
        })
      }
    }
  }, [images])

  // 根据类型和宽高比对矩形进行分组
  const groupRectanglesByTypeAndAspectRatio = (
    rectangles: Rectangle[], 
    type: EquipmentType
  ): Record<DetectEquipmentType, Rectangle[]> => {
    const groups: Record<DetectEquipmentType, Rectangle[]> = {
      "chara": [],
      "weapon/normal": [],
      "weapon/main": [],
      "summon/party_sub": [],
      "summon/party_main": []
    }
    
    rectangles.forEach(rect => {
      const aspectRatio = rect.width / rect.height
      
      if (type === "chara") {
        groups["chara"].push(rect)
      } else if (type === "weapon") {
        if (aspectRatio >= 1) {
          groups["weapon/normal"].push(rect)
        } else {
          groups["weapon/main"].push(rect)
        }
      } else if (type === "summon") {
        if (aspectRatio >= 1) {
          groups["summon/party_sub"].push(rect)
        } else {
          groups["summon/party_main"].push(rect)
        }
      }
    })
    
    return groups
  }

  // 处理一组矩形的识别请求
  const processRectangleGroup = async (
    rectangles: Rectangle[],
    imageUrl: string,
    groupType: DetectEquipmentType,
    groupRectangles: Rectangle[]
  ): Promise<{
    results: {id: string, confidence: number}[][]
    originalIndices: number[]
  }> => {
    const contents = await getImageDescriptorsFromImageAndRectangles(
      imageUrl, 
      groupRectangles, 
      groupType
    )
    
    const originalIndices = groupRectangles.map(
      rect => rectangles.findIndex(r => r === rect)
    )
    
    const payload = {
      type: groupType,
      contents,
    }
    
    console.log(`Sending request for ${groupType} with payload:`, payload)
    const response = await fetch("/api/equipment/recognize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error(`Recognition failed for ${groupType}:`, errorData)
      throw new Error(`Recognition failed for ${groupType}: ${JSON.stringify(errorData)}`)
    }

    const results = await response.json() as {id: string, confidence: number}[][]
    return { results, originalIndices }
  }

  // 识别设备主函数
  const recognizeEquipment = async (autoRectangles?: Rectangle[]) => {
    try {
      setIsRecognizing(true)
      if (!imageRef.current) {
        throw new Error("Image not found")
      }

      const usingRectangles = autoRectangles || rectangles
      const rectangleGroups = groupRectanglesByTypeAndAspectRatio(usingRectangles, type)
      const recognizedResults: Record<number, {id: string, confidence: number}[]> = {}
      
      const processPromises = Object.entries(rectangleGroups)
        .filter(([_, groupRects]) => groupRects.length > 0)
        .map(async ([groupType, groupRects]) => {
          try {
            const { results, originalIndices } = await processRectangleGroup(
              usingRectangles,
              imageRef.current!.src,
              groupType as DetectEquipmentType,
              groupRects
            )
            
            results.forEach((result, idx) => {
              recognizedResults[originalIndices[idx]] = result
            })
          } catch (error) {
            console.error(`Failed to process group ${groupType}:`, error)
            // 继续处理其他组，而不是立即终止
          }
        })
      
      await Promise.all(processPromises)
      
      if (Object.keys(recognizedResults).length > 0) {
        setRecognizedEquipment(recognizedResults)
        setShowResults(true)
      } else {
        console.warn("No results were recognized successfully")
        setShowResults(false)
      }
    } catch (error) {
      console.error("Failed to recognize equipment:", error)
      setShowResults(false)
    } finally {
      setIsRecognizing(false)
    }
  }

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
                processImageWithOpenCV(e.target.result as string)
              }
            }
            reader.readAsDataURL(files[0])
          }
        }}
      >
        {images.length === 0 ? (
          <UploadArea
            title={title}
            onImageUpload={(imageUrl) => {
              setImages([imageUrl])
              processImageWithOpenCV(imageUrl)
            }}
          />
        ) : (
          <>
            <div ref={containerRef}>
              <RectangleEditor
                imageUrl={images[0]}
                imageRef={imageRef}
                rectangles={rectangles}
                containerScale={containerScale}
                activeRectangle={activeRectangle}
                hoveredRectangle={hoveredRectangle}
                onRectanglesChange={setRectangles}
                onActiveRectangleChange={setActiveRectangle}
                onHoveredRectangleChange={setHoveredRectangle}
                onImageRemove={() => {
                  setImages([])
                  setRectangles([])
                }}
                isRecognizing={isRecognizing}
                onRecognize={() => recognizeEquipment()}
              />
            </div>

            {/* 识别结果 */}
            {showResults && (
              <RecognitionResults
                type={type}
                rectangles={rectangles}
                recognizedEquipment={recognizedEquipment}
                hoveredRectangle={hoveredRectangle}
                onHoveredRectangleChange={setHoveredRectangle}
                onEquipmentSelect={(index, equipment) => {
                  setRecognizedEquipment(prev => ({
                    ...prev,
                    [index]: [{ id: equipment.name, confidence: 100 }]
                  }))
                }}
                gridCols={gridCols}
                isRecognizing={isRecognizing}
                onRetry={() => recognizeEquipment()}
              />
            )}
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

