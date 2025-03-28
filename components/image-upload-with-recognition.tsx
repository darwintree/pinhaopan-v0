"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Upload, X, Move } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EquipmentSelectorModal } from "@/components/equipment-selector-modal"
import { Switch } from "@/components/ui/switch"
import { Rnd } from "react-rnd"
import type { DetectEquipmentType, EquipmentDetectResults } from "@/lib/types"
import type { Rectangle, EquipmentType } from "@/lib/utils"
import { detectRectangles, getImageDescriptorsFromImageAndRectangles, getPhotoUrl } from "@/lib/utils"

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

      // 如果启用了自动识别，继续识别过程
      if (autoRecognize) {
        // 重置显示结果状态
        setShowResults(false)
        // 等待识别完成
        if (!imageRef.current) {
          // 等待imageRef.current被设置
          await new Promise(resolve => {
            const checkImageRef = () => {
              if (imageRef.current) {
                console.log("imageRef.current is set")
                resolve(true);
              }
            }
            checkImageRef()
          })
        }
        await recognizeEquipment(result.rectangles)
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

        // 设置容器高度与图像成比例
        if (containerRef.current) {
          const containerWidth = containerRef.current.clientWidth || 800
          const aspectRatio = img.height / img.width
          containerRef.current.style.height = `${containerWidth * aspectRatio}px`
          
          // 计算缩放比例
          const scale = containerWidth / img.width
          setContainerScale(scale)
        }
      }
      img.src = images[0]
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
    };
    
    rectangles.forEach(rect => {
      const aspectRatio = rect.width / rect.height;
      
      if (type === "chara") {
        groups["chara"].push(rect);
      } else if (type === "weapon") {
        if (aspectRatio >= 1) { // 宽 > 高
          groups["weapon/normal"].push(rect);
        } else { // 宽 < 高
          groups["weapon/main"].push(rect);
        }
      } else if (type === "summon") {
        if (aspectRatio >= 1) { // 宽 > 高
          groups["summon/party_sub"].push(rect);
        } else { // 宽 < 高
          groups["summon/party_main"].push(rect);
        }
      }
    });
    
    return groups;
  };

  // 处理一组矩形的识别请求
  const processRectangleGroup = async (
    rectangles: Rectangle[],
    imageUrl: string,
    groupType: DetectEquipmentType,
    groupRectangles: Rectangle[]
  ): Promise<{
    results: {id: string, confidence: number}[][];
    originalIndices: number[];
  }> => {
    // 获取该组的图像描述符
    const contents = await getImageDescriptorsFromImageAndRectangles(
      imageUrl, 
      groupRectangles, 
      groupType
    );
    
    // 记录原始索引
    const originalIndices = groupRectangles.map(
      rect => rectangles.findIndex(r => r === rect)
    );
    
    const payload = {
      type: groupType,
      contents,
    };
    
    console.log(`Sending request for ${groupType} with payload:`, payload);
    const response = await fetch("/api/equipment/recognize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Recognition failed for ${groupType}`, await response.json());
      throw new Error(`Recognition failed for ${groupType}`);
    }

    const results = await response.json() as {id: string, confidence: number}[][];
    return { results, originalIndices };
  };

  // 识别设备主函数
  const recognizeEquipment = async (autoRectangles?: Rectangle[]) => {
    try {
      setIsRecognizing(true);
      if (!imageRef.current) {
        throw new Error("Image not found");
      }

      const usingRectangles = autoRectangles || rectangles
      
      // 按类型和宽高比分组矩形
      const rectangleGroups = groupRectanglesByTypeAndAspectRatio(usingRectangles, type);
      
      // 结果容器
      const recognizedResults: Record<number, {id: string, confidence: number}[]> = {};
      
      // 处理每个非空组并收集结果
      const processPromises = Object.entries(rectangleGroups)
        .filter(([_, groupRects]) => groupRects.length > 0)
        .map(async ([groupType, groupRects]) => {
          const { results, originalIndices } = await processRectangleGroup(
            usingRectangles,
            imageRef.current!.src,
            groupType as DetectEquipmentType,
            groupRects
          );
          
          // 将结果映射回原始索引
          results.forEach((result, idx) => {
            recognizedResults[originalIndices[idx]] = result;
          });
        });
      
      // 等待所有处理完成
      await Promise.all(processPromises);
      
      // 更新状态和显示结果（仅在实际有结果时）
      setRecognizedEquipment(recognizedResults);
      
      // 只在有识别结果时显示结果区域
      if (Object.keys(recognizedResults).length > 0) {
        setShowResults(true);
      }
    } catch (error) {
      console.error("Failed to recognize equipment:", error);
      // 发生错误时不显示结果
      setShowResults(false);
    } finally {
      setIsRecognizing(false);
    }
  };

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
    const results = recognizedEquipment[index]
    if (!results || results.length === 0) {
      return `未识别${title}${index + 1}`
    }
    return results[0].id
  }

  const placeholderSize = getPlaceholderSize()

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
              className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 mb-4"
            >
              {/* Image */}
              <img
                ref={imageRef}
                src={images[0] || "/placeholder.svg"}
                alt={`${title} screenshot`}
                className="w-full h-full object-cover"
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
            </div>

            {/* 矩形工具条 */}
            <div className="flex items-center gap-2 mb-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Button 
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (containerRef.current && imageRef.current) {
                      // 生成最大ID+1
                      const maxId = Math.max(0, ...rectangles.map(r => r.id));
                      const newRect: Rectangle = {
                        id: maxId + 1,
                        x: 50,
                        y: 50,
                        width: 100,
                        height: 100
                      };
                      setRectangles([...rectangles, newRect]);
                      setActiveRectangle(rectangles.length);
                    }
                  }}
                  className="h-8"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                添加矩形
              </Button>
              
              <Button 
                size="sm"
                variant={activeRectangle !== null ? "destructive" : "outline"}
                disabled={activeRectangle === null}
                onClick={() => {
                  if (activeRectangle !== null) {
                    const newRectangles = [...rectangles];
                    newRectangles.splice(activeRectangle, 1);
                    setRectangles(newRectangles);
                    setActiveRectangle(null);
                  }
                }}
                className="h-8"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
                {activeRectangle !== null ? `删除 ${rectangles[activeRectangle]?.id}` : "删除矩形"}
              </Button>
              
              <span className="ml-auto text-xs text-slate-500">
                {activeRectangle !== null ? 
                  `当前选中: ID ${rectangles[activeRectangle]?.id} (共 ${rectangles.length} 个)` : 
                  `点击矩形进行选择 (共 ${rectangles.length} 个)`}
              </span>
            </div>

            {/* 识别按钮 */}
            <div className="flex justify-center mb-4">
              <Button 
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  recognizeEquipment();
                }} 
                className="w-full"
                disabled={isRecognizing}
              >
                {isRecognizing ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    识别中...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2"
                    >
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                      <path d="M3 21v-5h5" />
                    </svg>
                    开始识别
                  </>
                )}
              </Button>
            </div>

            {/* 自动识别结果 */}
            {showResults && (
              <div className="space-y-2 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">自动识别结果</h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    type="button"
                    className="h-7 text-xs" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      recognizeEquipment();
                    }}
                    disabled={isRecognizing}
                  >
                    {isRecognizing ? (
                      <>
                        <svg
                          className="animate-spin mr-1 h-3 w-3"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        识别中
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                  </Button>
                </div>
                <div className={`grid grid-cols-${gridCols} gap-2`}>
                  {Array.from({ length: rectangles.length }).map((_, index) => (
                    <div
                      key={index}
                      className={`flex flex-col items-center ${
                        hoveredRectangle === index ? "bg-green-100 dark:bg-green-900/20 rounded-lg p-1" : "p-1"
                      }`}
                      onMouseEnter={() => setHoveredRectangle(index)}
                      onMouseLeave={() => setHoveredRectangle(null)}
                    >
                      <div className={`${placeholderSize.className} bg-slate-200 dark:bg-slate-700 mb-1 overflow-hidden`}>
                        {recognizedEquipment[index]?.length > 0 ? (
                          <img
                            src={getPhotoUrl(recognizedEquipment[index][0].id)}
                            alt={recognizedEquipment[index][0].id}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={`/placeholder.svg?height=${placeholderSize.height}&width=${placeholderSize.width}`}
                            alt={type}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        <div className="flex justify-center items-center w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-medium">
                          {index}
                        </div>
                        <span className="text-xs text-muted-foreground">{getDefaultSelectionLabel(index)}</span>
                      </div>
                      <EquipmentSelectorModal
                        type={type}
                        buttonLabel="手动选择"
                        buttonVariant="ghost"
                        onSelect={(equipment) => {
                          setRecognizedEquipment(prev => ({
                            ...prev,
                            [index]: [{ id: equipment.name, confidence: 100 }]
                          }))
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
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

