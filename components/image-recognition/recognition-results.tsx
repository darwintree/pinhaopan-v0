import { Button } from "@/components/ui/button"
import { EquipmentSelectorModal } from "@/components/equipment-selector-modal"
import type { EquipmentType } from "@/lib/types"
import { getPhotoUrl } from "@/lib/utils"

interface RecognitionResultsProps {
  type: EquipmentType
  rectangles: { id: number }[]
  recognizedEquipment: Record<number, { id: string; confidence: number }[]>
  hoveredRectangle: number | null
  onHoveredRectangleChange: (index: number | null) => void
  onEquipmentSelect: (index: number, equipment: { name: string }) => void
  gridCols?: number
  isRecognizing?: boolean
  onRetry?: () => void
}

export function RecognitionResults({
  type,
  rectangles,
  recognizedEquipment,
  hoveredRectangle,
  onHoveredRectangleChange,
  onEquipmentSelect,
  gridCols = 3,
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
    const results = recognizedEquipment[index]
    if (!results || results.length === 0) {
      return `未识别${type}${index + 1}`
    }
    return results[0].id
  }

  const placeholderSize = getPlaceholderSize()

  return (
    <div className="space-y-2 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">自动识别结果</h4>
        {onRetry && (
          <Button
            variant="ghost"
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
      <div className={`grid grid-cols-${gridCols} gap-2`}>
        {rectangles.map((_, index) => (
          <div
            key={index}
            className={`flex flex-col items-center ${
              hoveredRectangle === index ? "bg-green-100 dark:bg-green-900/20 rounded-lg p-1" : "p-1"
            }`}
            onMouseEnter={() => onHoveredRectangleChange(index)}
            onMouseLeave={() => onHoveredRectangleChange(null)}
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
              onSelect={(equipment) => onEquipmentSelect(index, equipment)}
            />
          </div>
        ))}
      </div>
    </div>
  )
} 