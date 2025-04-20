"use client"

import { useState, useRef, useEffect } from "react"
import type { DetectEquipmentType } from "@/lib/types"
import type { Rectangle } from "@/lib/utils"
import type { EquipmentType, RectangleMode, ModeData, MaskData } from "@/lib/types"
import { getImageDescriptorsFromImageAndRectangles } from "@/lib/cv-utils"
import { detectRectangles } from "@/lib/cv-utils"
import { UploadArea } from "./image-recognition/upload-area"
import { RectangleEditor } from "./image-recognition/rectangle-editor"
import { RecognitionResults } from "./image-recognition/recognition-results"
import { MaskEditor } from "./image-recognition/mask-editor"
import { Switch } from "./ui/switch"
import { 
  generatePresetRectangles as generateTemplateRectangles, 
  getDefaultPresetType,
  getPresetAspectRatio,
  PresetType
} from "@/lib/preset-templates"

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
  onRecognitionResults?: React.Dispatch<React.SetStateAction<Record<number, {id: string, confidence: number}[]>>>
}

export function ImageUploadWithRecognition({
  type,
  title,
  icon,
  images,
  setImages,
  autoRecognize,
  setAutoRecognize,
  infoText = "上传一张包含所有内容的图片，系统将自动识别主体",
  onRecognitionResults,
}: ImageUploadWithRecognitionProps) {
  // 模式切换状态
  const [mode, setMode] = useState<RectangleMode>("individual")
  
  // 模式数据缓存
  const [modeData, setModeData] = useState<ModeData>({
    individual: {
      rectangles: [],
      recognizedEquipments: {},
    },
    mask: {
      position: { x: 50, y: 50 },
      size: { 
        width: 300, 
        height: type === "chara" ? 300/getPresetAspectRatio(getDefaultPresetType(type)) : 169 
      },
      presetRectangles: [],
      presetType: getDefaultPresetType(type)
    }
  })
  
  // Rectangle detection states
  const [rectangles, setRectangles] = useState<Rectangle[]>([])
  const [activeRectangle, setActiveRectangle] = useState<number | null>(null)
  const [hoveredRectangle, setHoveredRectangle] = useState<number | null>(null)
  const [recognizedEquipments, setRecognizedEquipments] = useState<Record<number, {id: string, confidence: number}[]>>({})
  const [isRecognizing, setIsRecognizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageSize, setImageSize] = useState({ width: 800, height: 450 })
  const [containerScale, setContainerScale] = useState(1)
  const [nextRectId, setNextRectId] = useState(1)

  // Add useEffect to sync results with parent
  useEffect(() => {
    onRecognitionResults?.(recognizedEquipments);
  }, [recognizedEquipments, onRecognitionResults]);

  // 比较两个矩形的空间位置
  const compareRectangles = (a: Rectangle, b: Rectangle) => {
    // 检查y轴是否有重叠
    const aYRange = { start: a.y, end: a.y + a.height };
    const bYRange = { start: b.y, end: b.y + b.height };
    
    // 如果a的结束位置小于b的开始位置，或者a的开始位置大于b的结束位置，则没有重叠
    const hasYOverlap = !(aYRange.end < bYRange.start || aYRange.start > bYRange.end);
    
    if (!hasYOverlap) {
      return a.y - b.y; // 按y轴位置排序
    }
    
    return a.x - b.x; // y轴重叠时按x轴位置排序
  }
  
  // 重新排序矩形并更新id
  const rearrangeRectangles = (rects: Rectangle[]) => {
    if (rects.length === 0) return;
    
    // 创建一个矩形副本，保留原始索引和id
    const indexedRects = rects.map((rect, index) => ({ 
      ...rect, 
      originalIndex: index,
      originalId: rect.id 
    }));
    
    // 按空间位置排序
    indexedRects.sort((a, b) => compareRectangles(a, b));
    
    // 创建新的已排序矩形数组，重新分配顺序ID（但保留原始唯一ID）
    const newRectangles = indexedRects.map((rect, index) => ({
      ...rect,
      id: rect.originalId // 保留原始ID
    }));
    
    // 更新矩形数组
    setRectangles(newRectangles);
    
    // 如果当前有选中的矩形，更新选中的索引
    if (activeRectangle !== null) {
      // 查找当前活动矩形在重新排序后的新索引
      const activeOriginalIndex = activeRectangle;
      const newActiveIndex = indexedRects.findIndex(rect => rect.originalIndex === activeOriginalIndex);
      
      if (newActiveIndex !== -1 && newActiveIndex !== activeRectangle) {
        setActiveRectangle(newActiveIndex);
      }
    }
    
    // 如果当前有悬停的矩形，更新悬停的索引
    if (hoveredRectangle !== null) {
      // 查找当前悬停矩形在重新排序后的新索引
      const hoveredOriginalIndex = hoveredRectangle;
      const newHoveredIndex = indexedRects.findIndex(rect => rect.originalIndex === hoveredOriginalIndex);
      
      if (newHoveredIndex !== -1 && newHoveredIndex !== hoveredRectangle) {
        setHoveredRectangle(newHoveredIndex);
      }
    }
  }

  // 处理删除矩形
  const handleDeleteRectangle = (index: number) => {
    // 获取要删除的矩形ID
    const rectId = rectangles[index]?.id;
    
    const newRectangles = [...rectangles]
    newRectangles.splice(index, 1)
    
    // 先更新矩形数组
    setRectangles(newRectangles)
    
    // 如果删除的是当前激活的矩形，重置激活状态
    if (activeRectangle === index) {
      setActiveRectangle(null)
    } else if (activeRectangle !== null && activeRectangle > index) {
      // 如果删除的矩形在当前激活矩形之前，需要更新激活矩形的索引
      setActiveRectangle(activeRectangle - 1)
    }
    
    // 如果删除的是当前悬停的矩形，重置悬停状态
    if (hoveredRectangle === index) {
      setHoveredRectangle(null)
    } else if (hoveredRectangle !== null && hoveredRectangle > index) {
      // 如果删除的矩形在当前悬停矩形之前，需要更新悬停矩形的索引
      setHoveredRectangle(hoveredRectangle - 1)
    }
    
    // 从识别结果中删除该矩形的结果
    const newRecognizedEquipments = { ...recognizedEquipments };
    if (rectId !== undefined) {
      delete newRecognizedEquipments[rectId];
    }
    
    // 更新识别结果
    setRecognizedEquipments(newRecognizedEquipments);
    onRecognitionResults?.(newRecognizedEquipments);
    
    // 如果剩余矩形数量大于0，执行重新排序
    if (newRectangles.length > 0) {
      // 使用setTimeout确保状态更新完成后再执行排序
      setTimeout(() => rearrangeRectangles(newRectangles), 0)
    }
  }

  // 处理模式切换
  const handleModeChange = (newMode: RectangleMode) => {
    // 保存当前模式的数据
    if (mode === "individual") {
      setModeData(prev => ({
        ...prev,
        individual: {
          rectangles,
          recognizedEquipments
        }
      }))
    } else {
      setModeData(prev => ({
        ...prev,
        mask: prev.mask
      }))
    }
    
    // 切换模式
    setMode(newMode)
    
    // 加载新模式的数据
    if (newMode === "individual") {
      setRectangles(modeData.individual.rectangles)
      setRecognizedEquipments(modeData.individual.recognizedEquipments)
    } else {
      // 如果蒙版模式的预设矩形为空，初始化它们
      if (modeData.mask.presetRectangles.length === 0 && imageRef.current) {
        const { width, height } = imageSize
        
        // 计算默认蒙版位置和大小
        const presetType = getDefaultPresetType(type)
        const aspectRatio = getPresetAspectRatio(presetType)
        const maskWidth = width * 0.8
        const maskHeight = maskWidth / aspectRatio
        const maskX = (width - maskWidth) / 2
        const maskY = (height - maskHeight) / 2
        
        // 创建默认的蒙版数据
        const newMaskData: MaskData = {
          position: { x: maskX, y: maskY },
          size: { width: maskWidth, height: maskHeight },
          presetType: presetType,
          presetRectangles: []
        }
        
        // 根据预设类型生成矩形
        const presetRects = generatePresetRectangles(
          newMaskData.presetType,
          newMaskData.size.width,
          newMaskData.size.height,
          newMaskData.position
        )
        
        // 更新蒙版数据
        newMaskData.presetRectangles = presetRects
        
        setModeData(prev => ({
          ...prev,
          mask: newMaskData
        }))
      }
    }
    
    // 重置选中状态
    setActiveRectangle(null)
    setHoveredRectangle(null)
  }
  
  // 生成预设矩形的函数
  const generatePresetRectangles = (
    presetType: PresetType, 
    width: number, 
    height: number, 
    position: { x: number; y: number }
  ): Rectangle[] => {
    return generateTemplateRectangles(presetType, width, height, position, type, nextRectId);
  }

  // 处理蒙版数据变化
  const handleMaskDataChange = (newMaskData: MaskData) => {
    setModeData(prev => ({
      ...prev,
      mask: newMaskData
    }))
  }

  // Process image with OpenCV
  const processImageWithOpenCV = async (imageUrl: string) => {
    try {
      const result = await detectRectangles(imageUrl, type)
      
      // 对检测到的矩形进行排序
      const sortedRectangles = [...result.rectangles];
      sortedRectangles.sort(compareRectangles);
      
      // 分配唯一ID
      const newRectangles = sortedRectangles.map((rect, index) => {
        const uniqueId = nextRectId + index;
        return {
          ...rect,
          id: uniqueId
        };
      });
      
      // 更新下一个可用ID
      setNextRectId(nextRectId + newRectangles.length);
      
      // 更新矩形和图片尺寸
      setRectangles(newRectangles)
      setImageSize(result.imageSize)
      
      // 同时更新individual模式的数据
      setModeData(prev => ({
        ...prev,
        individual: {
          rectangles: newRectangles,
          recognizedEquipments: {}
        }
      }))

      if (autoRecognize) {
        // 等待图片加载完成
        await new Promise<void>((resolve) => {
          if (imageRef.current) {
            imageRef.current.onload = () => resolve()
            imageRef.current.src = imageUrl
          } else {
            resolve()
          }
        })
        await recognizeEquipment(newRectangles)
      }
      
      // 初始化蒙版数据
      if (imageRef.current) {
        const { width, height } = result.imageSize
        
        // 计算默认蒙版位置和大小
        const presetType = getDefaultPresetType(type)
        const aspectRatio = getPresetAspectRatio(presetType)
        const maskWidth = width * 0.8
        const maskHeight = maskWidth / aspectRatio
        const maskX = (width - maskWidth) / 2
        const maskY = (height - maskHeight) / 2
        
        // 创建默认的蒙版数据
        const newMaskData: MaskData = {
          position: { x: maskX, y: maskY },
          size: { width: maskWidth, height: maskHeight },
          presetType: presetType,
          presetRectangles: []
        }
        
        // 根据预设类型生成矩形
        const presetRects = generatePresetRectangles(
          newMaskData.presetType,
          newMaskData.size.width,
          newMaskData.size.height,
          newMaskData.position
        )
        
        // 更新蒙版数据
        newMaskData.presetRectangles = presetRects
        
        setModeData(prev => ({
          ...prev,
          mask: newMaskData
        }))
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
    originalRectIds: number[]
  }> => {
    const contents = await getImageDescriptorsFromImageAndRectangles(
      imageUrl, 
      groupRectangles, 
      groupType
    )
    
    // 记录每个矩形的唯一ID，而不是索引
    const originalRectIds = groupRectangles.map(rect => rect.id);

    
    console.log(`Sending request for ${groupType}  to ${process.env.NEXT_PUBLIC_DETECT_API_BASE_URL}/detect/${groupType}`)
    const response = await fetch(`${process.env.NEXT_PUBLIC_DETECT_API_BASE_URL}/detect/${groupType}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contents }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error(`Recognition failed for ${groupType}:`, errorData)
      throw new Error(`Recognition failed for ${groupType}: ${JSON.stringify(errorData)}`)
    }

    const results = await response.json() as {id: string, confidence: number}[][]
    return { results, originalRectIds }
  }

  // 识别设备主函数，提取为纯函数
  const performEquipmentRecognition = async (
    targetRectangles: Rectangle[],
    imageUrl: string,
    equipmentType: EquipmentType
  ): Promise<Record<number, {id: string, confidence: number}[]>> => {
    if (!imageUrl) {
      throw new Error("Image URL not provided")
    }

    const rectangleGroups = groupRectanglesByTypeAndAspectRatio(targetRectangles, equipmentType)
    const recognizedResults: Record<number, {id: string, confidence: number}[]> = {}
    
    const processPromises = Object.entries(rectangleGroups)
      .filter(([_, groupRects]) => groupRects.length > 0)
      .map(async ([groupType, groupRects]) => {
        try {
          const { results, originalRectIds } = await processRectangleGroup(
            targetRectangles,
            imageUrl,
            groupType as DetectEquipmentType,
            groupRects
          )
          
          results.forEach((result, idx) => {
            // 使用矩形ID作为键，而不是索引
            recognizedResults[originalRectIds[idx]] = result
          })
        } catch (error) {
          console.error(`Failed to process group ${groupType}:`, error)
          // 继续处理其他组，而不是立即终止
        }
      })
    
    await Promise.all(processPromises)
    return recognizedResults
  }

  // TODO: 识别单个equipment
  const recognizeSingleEquipment = async (rectIndex: number) => {
    try {
      setIsRecognizing(true)
      if (!imageRef.current) {
        throw new Error("Image not found")
      }
      
      // 获取单个矩形
      const targetRect = rectangles[rectIndex]
      if (!targetRect) {
        throw new Error("Rectangle not found")
      }
      
      // 只识别单个矩形
      const results = await performEquipmentRecognition(
        [targetRect],
        imageRef.current.src,
        type
      )
      
      if (Object.keys(results).length > 0) {
        // 合并新识别结果
        const newRecognizedEquipments = {
          ...recognizedEquipments,
          ...results
        }
        setRecognizedEquipments(newRecognizedEquipments)
        onRecognitionResults?.(newRecognizedEquipments)
      }
    } catch (error) {
      console.error("Failed to recognize single equipment:", error)
    } finally {
      setIsRecognizing(false)
    }
  }

  // 重构后的设备识别主函数，支持两种模式
  const recognizeEquipment = async (autoRectangles?: Rectangle[]) => {
    try {
      setIsRecognizing(true)
      if (!imageRef.current) {
        throw new Error("Image not found")
      }

      // 根据当前模式选择要识别的矩形
      let usingRectangles: Rectangle[]
      
      if (mode === "individual") {
        usingRectangles = autoRectangles || rectangles
      } else {
        usingRectangles = modeData.mask.presetRectangles
      }

      const maxGroupLength = 3
      const subGroups = []
      for (let i = 0; i < usingRectangles.length; i += maxGroupLength) {
        subGroups.push(usingRectangles.slice(i, i + maxGroupLength))
      }

      // 如果没有子组，直接重置状态并返回
      if (subGroups.length === 0) {
        setIsRecognizing(false)
        return
      }

      // 创建并发Promise数组，但不等待它们全部完成
      const promises = subGroups.map(subGroup => {
        // 返回一个Promise，但不在外部等待它完成
        return (async () => {
          try {
            // 对每个子组并发执行识别
            const subGroupResults = await performEquipmentRecognition(
              subGroup,
              imageRef.current!.src,
              type
            )
            
            // 如果该子组有结果
            if (Object.keys(subGroupResults).length > 0) {
              // 使用函数式更新确保并发安全
              setRecognizedEquipments(prevRecognized => {
                const updatedResults = {...prevRecognized, ...subGroupResults}
                
                // 同步更新模式数据
                if (mode === "individual") {
                  setModeData(prev => ({
                    ...prev,
                    individual: {
                      rectangles: prev.individual.rectangles,
                      recognizedEquipments: updatedResults
                    }
                  }))
                } else {
                  setModeData(prev => ({
                    ...prev,
                    mask: {
                      ...prev.mask,
                      presetRectangles: prev.mask.presetRectangles
                    }
                  }))
                }
                
                return updatedResults
              })
            }
            return true // 成功标记
          } catch (error) {
            console.error("Failed to recognize subgroup:", error)
            return false // 失败标记
          }
        })()
      })
      
      // 等待所有Promise完成后重置识别状态
      // 使用Promise.all可以并发执行所有请求，但仍然等待所有请求完成后再重置状态
      await Promise.all(promises).finally(() => {
        setIsRecognizing(false)
      })
    } catch (error) {
      console.error("Failed to recognize equipment:", error)
      setIsRecognizing(false)
    }
  }

  return (
    <div className="space-y-2 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </h4>
        <div className="flex items-center gap-3">
          {/* 自动识别开关 */}
          {/* <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">自动识别</span>
            <Switch checked={autoRecognize} onCheckedChange={setAutoRecognize} />
          </div> */}
        </div>
      </div>
      <div
        className={`border-2 border-dashed rounded-lg transition-colors ${
          images.length > 0 ? "border-slate-300 dark:border-slate-700" : "border-primary/50 hover:border-primary"
        } ${images.length === 0 ? "p-3 sm:p-6" : "p-2 sm:p-4"}`}
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
              {mode === "individual" ? (
                <RectangleEditor
                  mode={mode}
                  onModeChange={handleModeChange}
                  imageUrl={images[0]}
                  imageRef={imageRef}
                  rectangles={rectangles}
                  containerScale={containerScale}
                  activeRectangle={activeRectangle}
                  hoveredRectangle={hoveredRectangle}
                  onRectanglesChange={(newRects) => {
                    setRectangles(newRects);
                    if (newRects.length > 0) {
                      // 使用setTimeout确保状态更新完成后再执行排序
                      setTimeout(() => rearrangeRectangles(newRects), 0);
                    }
                    console.log("newRects", newRects)
                  }}
                  onActiveRectangleChange={setActiveRectangle}
                  onHoveredRectangleChange={setHoveredRectangle}
                  onImageRemove={() => {
                    setImages([])
                    setRectangles([])
                    setRecognizedEquipments({})
                    onRecognitionResults?.({})
                    
                    // 重置模式数据
                    setModeData({
                      individual: {
                        rectangles: [],
                        recognizedEquipments: {}
                      },
                      mask: {
                        position: { x: 50, y: 50 },
                        size: { width: 300, height: type === "chara" ? 300/getPresetAspectRatio(getDefaultPresetType(type)) : 169 },
                        presetRectangles: [],
                        presetType: getDefaultPresetType(type)
                      }
                    })
                  }}
                  onDeleteRectangle={handleDeleteRectangle}
                  isRecognizing={isRecognizing}
                  onRecognize={() => recognizeEquipment()}
                  nextRectId={nextRectId}
                  onNextRectIdChange={setNextRectId}
                />
              ) : (
                <MaskEditor
                  mode={mode}
                  onModeChange={handleModeChange}
                  imageUrl={images[0]}
                  imageRef={imageRef}
                  maskData={modeData.mask}
                  onMaskDataChange={handleMaskDataChange}
                  containerScale={containerScale}
                  hoveredRectangle={hoveredRectangle}
                  activeRectangle={activeRectangle}
                  onHoveredRectangleChange={setHoveredRectangle}
                  onActiveRectangleChange={setActiveRectangle}
                  onImageRemove={() => {
                    setImages([])
                    setRectangles([])
                    setRecognizedEquipments({})
                    onRecognitionResults?.({})
                    
                    // 重置模式数据
                    setModeData({
                      individual: {
                        rectangles: [],
                        recognizedEquipments: {}
                      },
                      mask: {
                        position: { x: 50, y: 50 },
                        size: { width: 300, height: type === "chara" ? 300/getPresetAspectRatio(getDefaultPresetType(type)) : 169 },
                        presetRectangles: [],
                        presetType: getDefaultPresetType(type)
                      }
                    })
                  }}
                  isRecognizing={isRecognizing}
                  onRecognize={() => recognizeEquipment()}
                  type={type}
                />
              )}
            </div>

            {/* 列表 */}
            <RecognitionResults
              type={type}
              rectangles={mode === "individual" ? rectangles : modeData.mask.presetRectangles}
              recognizedEquipment={recognizedEquipments}
              hoveredRectangle={hoveredRectangle}
              activeRectangle={activeRectangle}
              displayDeleteButton={mode==="individual"}
              onHoveredRectangleChange={setHoveredRectangle}
              onEquipmentSelect={(index, equipment) => {
                // 使用矩形ID而不是索引
                const rect = mode === "individual" 
                  ? rectangles[index] 
                  : modeData.mask.presetRectangles[index];
                
                if (rect && rect.id !== undefined) {
                  const updatedRecognized = {
                    ...recognizedEquipments,
                    [rect.id]: [{ id: equipment.id, confidence: 100 }]
                  };
                  
                  setRecognizedEquipments(updatedRecognized);
                  
                  if (mode === "individual") {
                    // 更新individual模式的缓存
                    setModeData(prev => ({
                      ...prev,
                      individual: {
                        ...prev.individual,
                        recognizedEquipments: updatedRecognized
                      }
                    }));
                  } else {
                    // 更新mask模式的缓存
                    setModeData(prev => ({
                      ...prev,
                      mask: {
                        ...prev.mask
                      }
                    }));
                  }
                  
                  onRecognitionResults?.(updatedRecognized);
                }
              }}
              onDeleteItem={handleDeleteRectangle}
              isRecognizing={isRecognizing}
              onRetry={() => recognizeEquipment()}
            />
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

