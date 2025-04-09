import { RefObject, useState, useEffect, useCallback } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Rectangle } from "@/lib/utils"
import type { MaskData, DetectEquipmentType, EquipmentType } from "@/lib/types"
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select"
import { 
  generatePresetRectangles as generateTemplateRectangles, 
  getAspectRatioOptions 
} from "@/lib/preset-templates"

interface MaskEditorProps {
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
    presetType: "grid3x3" | "weapon" | "summon" | "chara", 
    width: number, 
    height: number, 
    position: { x: number; y: number }
  ): Rectangle[] => {
    return generateTemplateRectangles(presetType, width, height, position, type);
  }, [type])
  
  // 更新预设矩形
  const updatePresetRectangles = useCallback(() => {
    const newRectangles = generatePresetRectangles(
      maskData.presetType, 
      maskData.size.width, 
      maskData.size.height, 
      maskData.position
    )
    
    onMaskDataChange({
      ...maskData,
      presetRectangles: newRectangles
    })
  }, [maskData, generatePresetRectangles, onMaskDataChange])
  
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
    
    switch (resizeEdge) {
      case "right":
        // 右侧拖动 - 左上角固定
        newWidth = Math.max(50, resizeStart.width + deltaX)
        if (maskData.aspectRatio > 0) {
          newHeight = newWidth / maskData.aspectRatio
        }
        break
        
      case "left":
        // 左侧拖动 - 右上角固定
        const oldWidth = newWidth
        newWidth = Math.max(50, resizeStart.width - deltaX)
        newX = maskData.position.x + (oldWidth - newWidth)
        if (maskData.aspectRatio > 0) {
          newHeight = newWidth / maskData.aspectRatio
        }
        break
        
      case "bottom":
        // 底部拖动 - 左上角固定
        newHeight = Math.max(50, resizeStart.height + deltaY)
        if (maskData.aspectRatio > 0) {
          newWidth = newHeight * maskData.aspectRatio
        }
        break
        
      case "top":
        // 顶部拖动 - 左下角固定
        const oldHeight = newHeight
        newHeight = Math.max(50, resizeStart.height - deltaY)
        newY = maskData.position.y + (oldHeight - newHeight)
        if (maskData.aspectRatio > 0) {
          newWidth = newHeight * maskData.aspectRatio
        }
        break
    }
    
    handleMaskChange(
      { x: newX, y: newY },
      { width: newWidth, height: newHeight }
    )
  }, [isResizing, resizeEdge, resizeStart, containerScale, maskData.position, maskData.aspectRatio, handleMaskChange])
  
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
  
  // 处理宽高比变化
  const handleAspectRatioChange = useCallback((value: string) => {
    const newAspectRatio = parseFloat(value)
    
    // 计算当前的中心点
    const centerX = maskData.position.x + maskData.size.width / 2
    const centerY = maskData.position.y + maskData.size.height / 2
    
    // 计算新高度，保持宽度不变
    const newHeight = maskData.size.width / newAspectRatio
    
    // 计算新的位置，保持中心点不变
    const newX = centerX - maskData.size.width / 2
    const newY = centerY - newHeight / 2
    
    onMaskDataChange({
      ...maskData,
      aspectRatio: newAspectRatio,
      position: { x: newX, y: newY },
      size: {
        width: maskData.size.width,
        height: newHeight
      }
    })
    
    // 更新预设矩形
    setTimeout(updatePresetRectangles, 0)
  }, [maskData, onMaskDataChange, updatePresetRectangles])
  
  // 处理预设类型变化
  const handlePresetTypeChange = useCallback((value: string) => {
    onMaskDataChange({
      ...maskData,
      presetType: value as "grid3x3" | "weapon" | "summon" | "chara"
    })
    
    // 更新预设矩形
    setTimeout(updatePresetRectangles, 0)
  }, [maskData, onMaskDataChange, updatePresetRectangles])
  
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
          
          {/* 蒙版和预设矩形 */}
          <div 
            className="absolute inset-0 bg-black/50 pointer-events-none"
            style={{
              width: '100%',
              height: '100%'
            }}
          >
            {/* 蒙版区域 */}
            <div 
              className="absolute bg-transparent cursor-move"
              style={{
                left: `${maskData.position.x * containerScale}px`,
                top: `${maskData.position.y * containerScale}px`,
                width: `${maskData.size.width * containerScale}px`,
                height: `${maskData.size.height * containerScale}px`,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                border: '2px dashed rgba(255, 255, 255, 0.8)',
                pointerEvents: 'auto'
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
                    style={getEdgeStyle(edge)}
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
          
          {/* 删除图片按钮 */}
          <button
            type="button"
            onClick={onImageRemove}
            className="absolute top-2 right-2 rounded-full bg-red-500/90 p-1.5 sm:p-1 text-white shadow-md touch-manipulation"
          >
            <X className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>
      
      {/* 蒙版选项工具栏 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          {/* 预设类型选择 */}
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
                <SelectItem value="grid3x3">3x3网格</SelectItem>
                <SelectItem value="weapon">武器布局</SelectItem>
                <SelectItem value="summon">召唤石布局</SelectItem>
                <SelectItem value="chara">角色布局</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* 宽高比选择 */}
          <div className="flex items-center gap-2">
            <span className="text-sm">宽高比:</span>
            <Select 
              value={String(maskData.aspectRatio)} 
              onValueChange={handleAspectRatioChange}
            >
              <SelectTrigger className="h-10 w-[120px]">
                <SelectValue placeholder="选择宽高比" />
              </SelectTrigger>
              <SelectContent>
                {getAspectRatioOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
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
    </div>
  )
} 