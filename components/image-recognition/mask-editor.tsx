import { RefObject, useState, useEffect, useCallback } from "react"
import { X, Move } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { Rectangle } from "@/lib/utils"
import type { MaskData, EquipmentType, RectangleMode } from "@/lib/types"
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select"
import { 
  generatePresetRectangles as generateTemplateRectangles,
  getPresetAspectRatio,
  AVAILABLE_PRESETS,
  PresetType
} from "@/lib/preset-templates"

interface MaskEditorProps {
  mode: RectangleMode
  onModeChange: (mode: RectangleMode) => void
  imageUrl: string
  imageRef: RefObject<HTMLImageElement>
  maskData: MaskData
  onMaskDataChange: (data: MaskData) => void
  containerScale: number
  hoveredRectangle: number | null
  activeRectangle: number | null
  onHoveredRectangleChange: (index: number | null) => void
  onActiveRectangleChange: (index: number | null) => void
  onImageRemove: () => void
  isRecognizing?: boolean
  onRecognize?: () => void
  type: EquipmentType
}

export function MaskEditor({
  mode,
  onModeChange,
  imageUrl,
  imageRef,
  maskData,
  onMaskDataChange,
  containerScale,
  hoveredRectangle,
  activeRectangle,
  onHoveredRectangleChange,
  onActiveRectangleChange,
  onImageRemove,
  isRecognizing = false,
  onRecognize,
  type
}: MaskEditorProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeEdge, setResizeEdge] = useState<"top" | "right" | "bottom" | "left" | null>(null)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  
  // 生成预设矩形的函数
  const generatePresetRectangles = useCallback((
    presetType: PresetType, 
    width: number, 
    height: number, 
    position: { x: number; y: number }
  ): Rectangle[] => {
    return generateTemplateRectangles(presetType, width, height, position, type);
  }, [type])
  
  // 处理蒙版位置或尺寸变化
  const handleMaskChange = useCallback((
    newPosition?: { x: number; y: number },
    newSize?: { width: number; height: number }
  ) => {
    const updatedMaskData = {
      ...maskData,
      position: newPosition || maskData.position,
      size: newSize || maskData.size
    }
    
    // 更新预设矩形
    const newRectangles = generatePresetRectangles(
      updatedMaskData.presetType,
      updatedMaskData.size.width,
      updatedMaskData.size.height,
      updatedMaskData.position
    )
    
    onMaskDataChange({
      ...updatedMaskData,
      presetRectangles: newRectangles
    })
  }, [maskData, onMaskDataChange, generatePresetRectangles])
  
  // 处理拖动开始
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    
    let clientX: number, clientY: number
    
    if ("touches" in e) {
      // 触摸事件
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      // 鼠标事件
      clientX = e.clientX
      clientY = e.clientY
    }
    
    setDragStart({
      x: clientX,
      y: clientY
    })
    
    setIsDragging(true)
  }, [])
  
  // 处理拖动
  const handleDrag = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return
    e.preventDefault()
    
    let clientX: number, clientY: number
    
    if (e.type.startsWith('touch')) {
      // 触摸事件
      const touchEvent = e as TouchEvent
      clientX = touchEvent.touches[0].clientX
      clientY = touchEvent.touches[0].clientY
    } else {
      // 鼠标事件
      const mouseEvent = e as MouseEvent
      clientX = mouseEvent.clientX
      clientY = mouseEvent.clientY
    }
    
    const deltaX = (clientX - dragStart.x) / containerScale
    const deltaY = (clientY - dragStart.y) / containerScale
    
    const newPosition = {
      x: maskData.position.x + deltaX,
      y: maskData.position.y + deltaY
    }
    
    setDragStart({
      x: clientX,
      y: clientY
    })
    
    handleMaskChange(newPosition)
  }, [isDragging, dragStart, containerScale, maskData.position, handleMaskChange])
  
  // 处理拖动结束
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])
  
  // 处理缩放开始
  const handleResizeStart = useCallback((
    e: React.MouseEvent | React.TouchEvent, 
    edge: "top" | "right" | "bottom" | "left"
  ) => {
    e.preventDefault()
    e.stopPropagation()
    
    let clientX: number, clientY: number
    
    if ("touches" in e) {
      // 触摸事件
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      // 鼠标事件
      clientX = e.clientX
      clientY = e.clientY
    }
    
    setResizeStart({
      x: clientX,
      y: clientY,
      width: maskData.size.width,
      height: maskData.size.height
    })
    
    setResizeEdge(edge)
    setIsResizing(true)
  }, [maskData.size])
  
  // 处理缩放
  const handleResize = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isResizing || !resizeEdge) return
    e.preventDefault()
    
    let clientX: number, clientY: number
    
    if (e.type.startsWith('touch')) {
      // 触摸事件
      const touchEvent = e as TouchEvent
      clientX = touchEvent.touches[0].clientX
      clientY = touchEvent.touches[0].clientY
    } else {
      // 鼠标事件
      const mouseEvent = e as MouseEvent
      clientX = mouseEvent.clientX
      clientY = mouseEvent.clientY
    }
    
    const deltaX = (clientX - resizeStart.x) / containerScale
    const deltaY = (clientY - resizeStart.y) / containerScale
    
    let newWidth = resizeStart.width
    let newHeight = resizeStart.height
    let newX = maskData.position.x
    let newY = maskData.position.y
    
    const aspectRatio = getPresetAspectRatio(maskData.presetType)
    
    switch (resizeEdge) {
      case "right":
        // 右侧拖动 - 左上角固定
        newWidth = Math.max(50, resizeStart.width + deltaX)
        if (aspectRatio > 0) {
          newHeight = newWidth / aspectRatio
        }
        break
        
      case "left":
        // 左侧拖动 - 右上角固定
        const oldWidth = newWidth
        newWidth = Math.max(50, resizeStart.width - deltaX)
        newX = maskData.position.x + (oldWidth - newWidth)
        if (aspectRatio > 0) {
          newHeight = newWidth / aspectRatio
        }
        break
        
      case "bottom":
        // 底部拖动 - 左上角固定
        newHeight = Math.max(50, resizeStart.height + deltaY)
        if (aspectRatio > 0) {
          newWidth = newHeight * aspectRatio
        }
        break
        
      case "top":
        // 顶部拖动 - 左下角固定
        const oldHeight = newHeight
        newHeight = Math.max(50, resizeStart.height - deltaY)
        newY = maskData.position.y + (oldHeight - newHeight)
        if (aspectRatio > 0) {
          newWidth = newHeight * aspectRatio
        }
        break
    }
    
    handleMaskChange(
      { x: newX, y: newY },
      { width: newWidth, height: newHeight }
    )
  }, [isResizing, resizeEdge, resizeStart, containerScale, maskData.position, maskData.presetType, handleMaskChange])
  
  // 处理缩放结束
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
    setResizeEdge(null)
  }, [])
  
  // 使用useEffect添加全局事件监听来处理拖拽
  useEffect(() => {
    if (isDragging) {
      // 添加全局鼠标移动和鼠标松开事件监听
      window.addEventListener('mousemove', handleDrag)
      window.addEventListener('mouseup', handleDragEnd)
      window.addEventListener('touchmove', handleDrag)
      window.addEventListener('touchend', handleDragEnd)
      
      // 清理函数
      return () => {
        window.removeEventListener('mousemove', handleDrag)
        window.removeEventListener('mouseup', handleDragEnd)
        window.removeEventListener('touchmove', handleDrag)
        window.removeEventListener('touchend', handleDragEnd)
      }
    }
    
    return undefined
  }, [isDragging, handleDrag, handleDragEnd])
  
  // 使用useEffect添加全局事件监听来处理缩放
  useEffect(() => {
    if (isResizing) {
      // 添加全局鼠标移动和鼠标松开事件监听
      window.addEventListener('mousemove', handleResize)
      window.addEventListener('mouseup', handleResizeEnd)
      window.addEventListener('touchmove', handleResize)
      window.addEventListener('touchend', handleResizeEnd)
      
      // 清理函数
      return () => {
        window.removeEventListener('mousemove', handleResize)
        window.removeEventListener('mouseup', handleResizeEnd)
        window.removeEventListener('touchmove', handleResize)
        window.removeEventListener('touchend', handleResizeEnd)
      }
    }
    
    return undefined
  }, [isResizing, handleResize, handleResizeEnd])
  
  // 处理预设类型变化
  const handlePresetTypeChange = useCallback((value: string) => {
    const presetType = value as PresetType
    const aspectRatio = getPresetAspectRatio(presetType)
    
    // 计算当前的中心点
    const centerX = maskData.position.x + maskData.size.width / 2
    const centerY = maskData.position.y + maskData.size.height / 2
    
    // 计算新高度，保持宽度不变
    const newHeight = maskData.size.width / aspectRatio
    
    // 计算新的位置，保持中心点不变
    const newX = centerX - maskData.size.width / 2
    const newY = centerY - newHeight / 2

    // Plan Item 3: Calculate new rectangles directly
    const newRectangles = generatePresetRectangles(
      presetType,
      maskData.size.width, // Keep width constant
      newHeight,
      { x: newX, y: newY }
    )
    
    // Plan Item 4: Update state with all changes including new rectangles
    onMaskDataChange({
      ...maskData, // Spread existing data first
      presetType,
      position: { x: newX, y: newY },
      size: {
        width: maskData.size.width, // Keep width constant
        height: newHeight
      },
      presetRectangles: newRectangles // Add the newly generated rectangles
    })
    
    // Plan Item 1: Removed setTimeout call
  }, [maskData, onMaskDataChange, generatePresetRectangles]) // Plan Item 5: Removed updatePresetRectangles from dependencies
  
  return (
    <div className="flex flex-col gap-2 sm:gap-4">
      <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        {/* 图片容器 */}
        <div className="relative w-full">
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Recognition target"
            className="w-full h-auto"
          />
          
          {/* Four overlay divs for masking */}
          <div
            className="absolute pointer-events-none bg-black/50"
            style={{
              top: 0,
              left: 0,
              width: '100%',
              height: `${maskData.position.y * containerScale}px`,
            }}
          />
          <div
            className="absolute pointer-events-none bg-black/50"
            style={{
              top: `${(maskData.position.y + maskData.size.height) * containerScale}px`,
              left: 0,
              width: '100%',
              height: `${Math.max(0, (imageRef.current?.naturalHeight ?? 0) - (maskData.position.y + maskData.size.height)) * containerScale}px`,
            }}
          />
          <div
            className="absolute pointer-events-none bg-black/50"
            style={{
              top: `${maskData.position.y * containerScale}px`,
              left: 0,
              width: `${maskData.position.x * containerScale}px`,
              height: `${maskData.size.height * containerScale}px`,
            }}
          />
          <div
            className="absolute pointer-events-none bg-black/50"
            style={{
              top: `${maskData.position.y * containerScale}px`,
              left: `${(maskData.position.x + maskData.size.width) * containerScale}px`,
              width: `${Math.max(0, (imageRef.current?.naturalWidth ?? 0) - (maskData.position.x + maskData.size.width)) * containerScale}px`,
              height: `${maskData.size.height * containerScale}px`,
            }}
          />

          {/* 蒙版和预设矩形 */}
          <div 
            className="absolute bg-transparent cursor-move"
            style={{
              left: `${maskData.position.x * containerScale}px`,
              top: `${maskData.position.y * containerScale}px`,
              width: `${maskData.size.width * containerScale}px`,
              height: `${maskData.size.height * containerScale}px`,
              border: '2px dashed rgba(255, 255, 255, 0.8)',
              pointerEvents: 'auto',
              touchAction: 'none'
            }}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            {/* 缩放控制点 */}
            {[
              // 'top',
              'right',
              'bottom',
              // 'left'
            ].map((edge) => {
              // 根据边的位置确定控制点的样式和位置
              const getEdgeStyle = (edge: string) => {
                const baseStyle = {
                  backgroundColor: 'white',
                  border: '2px solid #3b82f6',
                  position: 'absolute' as const,
                  zIndex: 10,
                  borderRadius: '4px',
                  transition: 'background-color 0.15s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                };
                
                switch(edge) {
                  case 'top':
                    return {
                      ...baseStyle,
                      top: '-6px',
                      left: '50%',
                      width: '40px',
                      height: '12px',
                      transform: 'translateX(-50%)',
                      cursor: 'ns-resize'
                    };
                  case 'right':
                    return {
                      ...baseStyle,
                      top: '50%',
                      right: '-6px',
                      width: '12px',
                      height: '40px',
                      transform: 'translateY(-50%)',
                      cursor: 'ew-resize'
                    };
                  case 'bottom':
                    return {
                      ...baseStyle,
                      bottom: '-6px',
                      left: '50%',
                      width: '40px',
                      height: '12px',
                      transform: 'translateX(-50%)',
                      cursor: 'ns-resize'
                    };
                  case 'left':
                    return {
                      ...baseStyle,
                      top: '50%',
                      left: '-6px',
                      width: '12px',
                      height: '40px',
                      transform: 'translateY(-50%)',
                      cursor: 'ew-resize'
                    };
                  default:
                    return baseStyle;
                }
              };
              
              return (
                <div 
                  key={edge}
                  style={{
                    ...getEdgeStyle(edge),
                    touchAction: 'none'
                  }}
                  className="hover:bg-blue-100 active:bg-blue-200"
                  onMouseDown={(e) => handleResizeStart(e, edge as "top" | "right" | "bottom" | "left")}
                  onTouchStart={(e) => handleResizeStart(e, edge as "top" | "right" | "bottom" | "left")}
                />
              );
            })}
            
            {/* 预设矩形 */}
            {maskData.presetRectangles.map((rect, index) => (
              <div
                key={rect.id}
                className={`absolute border-2 pointer-events-auto ${
                  activeRectangle === index
                    ? "border-blue-500"
                    : hoveredRectangle === index
                      ? "border-green-500"
                      : "border-yellow-300"
                }`}
                style={{
                  left: `${(rect.x - maskData.position.x) * containerScale}px`,
                  top: `${(rect.y - maskData.position.y) * containerScale}px`,
                  width: `${rect.width * containerScale}px`,
                  height: `${rect.height * containerScale}px`
                }}
                onMouseEnter={() => onHoveredRectangleChange(index)}
                onMouseLeave={() => onHoveredRectangleChange(null)}
                onClick={() => onActiveRectangleChange(index)}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* 蒙版选项工具栏 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          {/* 模式切换 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">蒙版模式</span>
            <Switch 
              checked={mode === "mask"} 
              onCheckedChange={(checked) => onModeChange(checked ? "mask" : "individual")} 
            />
          </div>
          
          {/* 预设类型选择 */}
          {AVAILABLE_PRESETS[type].length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm">预设:</span>
              <Select 
                value={maskData.presetType} 
                onValueChange={handlePresetTypeChange}
              >
                <SelectTrigger className="h-10 w-[120px]">
                  <SelectValue placeholder="选择预设" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_PRESETS[type].map(preset => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* 识别按钮 */}
          <Button
            type="button"
            size="sm"
            variant="default"
            onClick={onRecognize}
            disabled={isRecognizing}
            className="h-10 px-3 text-sm ml-auto"
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
              <>开始识别</>
            )}
          </Button>
        </div>
      </div>
      
      {/* 删除图片按钮 */}
      <button
        type="button"
        onClick={onImageRemove}
        className="absolute top-2 right-2 rounded-full bg-red-500/90 p-1.5 sm:p-1 text-white shadow-md touch-manipulation"
      >
        <X className="h-5 w-5 sm:h-4 sm:w-4" />
      </button>
    </div>
  )
} 