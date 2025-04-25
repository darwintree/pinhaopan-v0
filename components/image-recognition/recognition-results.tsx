import { Button } from "@/components/ui/button"
import { EquipmentSelectorModal } from "@/components/selector/equipment-selector-modal"
import type { EquipmentType, DetailedEquipmentData } from "@/lib/types"
import { useMemo } from "react"
import { EquipmentSelector } from "@/components/selector/equipment-selector"

interface RecognitionResultsProps {
  type: EquipmentType
  rectangles: { id: number, width: number, height: number }[]
  recognizedEquipment: Record<number, { id: string; confidence: number }[]>
  hoveredRectangle: number | null
  activeRectangle: number | null
  onHoveredRectangleChange: (index: number | null) => void
  onEquipmentSelect: (index: number, equipment: DetailedEquipmentData) => void
  onDeleteItem?: (index: number) => void
  isRecognizing?: boolean
  displayDeleteButton?: boolean
  onRetry?: () => void
}

export function RecognitionResults({
  type,
  rectangles,
  recognizedEquipment,
  hoveredRectangle,
  activeRectangle,
  onHoveredRectangleChange,
  onEquipmentSelect,
  displayDeleteButton = true,
  onDeleteItem,
  isRecognizing = false,
  onRetry,
}: RecognitionResultsProps) {
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

  const getDefaultSelectionLabel = (index: number) => {
    const rectId = rectangles[index]?.id;
    const results = rectId !== undefined ? recognizedEquipment[rectId] : undefined;
    if (!results || results.length === 0 || !results[0]) {
      return `未识别${type}${index + 1}`
    }
    return results[0].id
  }

  const placeholderSize = getPlaceholderSize()

  const { mainGroup, otherGroup } = useMemo(() => {
    const grouped = rectangles.reduce((acc, rect, index) => {
      const aspectRatio = rect.width / rect.height
      if (aspectRatio < 1) {
        acc.mainGroup.push(index)
      } else {
        acc.otherGroup.push(index)
      }
      return acc
    }, { mainGroup: [] as number[], otherGroup: [] as number[] })

    return grouped
  }, [rectangles])

  const getResultForRectangle = (rectangleId: number, recognizedEquipment: Record<number, {id: string, confidence: number}[]>) => {
    return recognizedEquipment[rectangleId] || [];
  }

  const renderItem = (index: number) => {
    const rect = rectangles[index];
    const rectId = rect.id;
    const results = getResultForRectangle(rectId, recognizedEquipment);
    
    return (
      <EquipmentSelector
        key={index}
        index={rectId}
        rectangle={rect}
        recognizedEquipments={results}
        type={type}
        label={getDefaultSelectionLabel(index)}
        onEquipmentSelect={(equipment) => onEquipmentSelect(index, equipment)}
        isHovered={hoveredRectangle === index}
        isActive={activeRectangle === index}
        displayDeleteButton={displayDeleteButton}
        onMouseEnter={() => onHoveredRectangleChange(index)}
        onMouseLeave={() => onHoveredRectangleChange(null)}
        onDelete={onDeleteItem ? () => onDeleteItem(index) : undefined}
      />
    )
  }

  const renderResults = () => {
    // 如果没有检测到矩形，显示提示信息
    if (rectangles.length === 0) {
      return (
        <div className="flex items-center justify-center h-20 bg-slate-50 dark:bg-slate-800/50 rounded-md">
          <p className="text-sm text-slate-500">
            {isRecognizing ? "识别中..." : "未检测到内容，请添加矩形或点击识别"}
          </p>
        </div>
      )
    }

    switch (type) {
      case "chara":
        return (
          <div className="flex flex-row gap-2 overflow-x-auto pb-2">
            {rectangles.map((_, index) => renderItem(index))}
          </div>
        )
      case "summon":
        return (
          <div className="flex flex-row gap-4">
            {mainGroup.length > 0 && (
              <div className="flex flex-col gap-2">
                {mainGroup.map(index => renderItem(index))}
              </div>
            )}
            {otherGroup.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {otherGroup.map(index => renderItem(index))}
              </div>
            )}
          </div>
        )
      case "weapon":
        return (
          <div className="flex flex-row gap-4">
            {mainGroup.length > 0 && (
              <div className="flex flex-col gap-2">
                {mainGroup.map(index => renderItem(index))}
              </div>
            )}
            {otherGroup.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {otherGroup.map(index => renderItem(index))}
              </div>
            )}
          </div>
        )
      default:
        return (
          <div className="grid grid-cols-3 gap-2">
            {rectangles.map((_, index) => renderItem(index))}
          </div>
        )
    }
  }

  return (
    <div className="space-y-2 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">列表</h4>
        {onRetry && (
          <Button
            variant="secondary"
            size="sm"
            type="button"
            className="h-7 text-xs"
            onClick={onRetry}
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
        )}
      </div>
      {renderResults()}
    </div>
  )
} 