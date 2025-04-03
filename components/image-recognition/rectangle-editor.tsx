import { Move, X } from "lucide-react"
import { Rnd } from "react-rnd"
import { Button } from "@/components/ui/button"
import type { Rectangle } from "@/lib/utils"
import { RefObject } from "react"

interface RectangleEditorProps {
  imageUrl: string
  imageRef: RefObject<HTMLImageElement>
  rectangles: Rectangle[]
  containerScale: number
  activeRectangle: number | null
  hoveredRectangle: number | null
  onRectanglesChange: (rectangles: Rectangle[]) => void
  onActiveRectangleChange: (index: number | null) => void
  onHoveredRectangleChange: (index: number | null) => void
  onImageRemove: () => void
  onDeleteRectangle: (index: number) => void
  isRecognizing?: boolean
  onRecognize?: () => void
  nextRectId?: number
  onNextRectIdChange?: (nextId: number) => void
}

export function RectangleEditor({
  imageUrl,
  imageRef,
  rectangles,
  containerScale,
  activeRectangle,
  hoveredRectangle,
  onRectanglesChange,
  onActiveRectangleChange,
  onHoveredRectangleChange,
  onImageRemove,
  onDeleteRectangle,
  isRecognizing = false,
  onRecognize,
  nextRectId = 9999,
  onNextRectIdChange,
}: RectangleEditorProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        {/* Image container */}
        <div className="relative w-full">
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Recognition target"
            className="w-full h-auto"
          />

          {/* Resizable rectangles */}
          <div 
            className="absolute inset-0"
            style={{
              width: '100%',
              height: '100%'
            }}
          >
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
                  onRectanglesChange(newRectangles)
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
                  onRectanglesChange(newRectangles)
                }}
                className={`${
                  activeRectangle === index
                    ? "border-blue-500"
                    : hoveredRectangle === index
                      ? "border-green-500"
                      : "border-red-500"
                } border-2 cursor-move`}
                onMouseEnter={() => onHoveredRectangleChange(index)}
                onMouseLeave={() => onHoveredRectangleChange(null)}
                onClick={() => onActiveRectangleChange(index)}
                onTouchStart={() => onActiveRectangleChange(index)}
                enableUserSelectHack={false}
                disableDragging={activeRectangle !== index}
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
                  {activeRectangle === index && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteRectangle(index)
                      }}
                      className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md z-10 transition-colors"
                      title="删除矩形"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <div className="drag-handle absolute inset-0 flex items-center justify-center">
                    <Move className="h-4 w-4 text-white opacity-50 pointer-events-none" />
                  </div>
                </div>
              </Rnd>
            ))}
          </div>

          <button
            type="button"
            onClick={onImageRemove}
            className="absolute top-2 right-2 rounded-full bg-red-500/90 p-1 text-white shadow-md"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Rectangle toolbar - Responsive layout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              const newRect: Rectangle = {
                id: nextRectId,
                x: 50,
                y: 50,
                width: 100,
                height: 100
              }
              onRectanglesChange([...rectangles, newRect])
              onActiveRectangleChange(rectangles.length)
              
              if (onNextRectIdChange) {
                onNextRectIdChange(nextRectId + 1)
              }
            }}
            className="h-10 px-3 text-sm"
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
              className="mr-1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            添加矩形
          </Button>

          <Button
            type="button"
            size="sm"
            variant={activeRectangle !== null ? "destructive" : "outline"}
            disabled={activeRectangle === null}
            onClick={() => {
              if (activeRectangle !== null) {
                onDeleteRectangle(activeRectangle)
              }
            }}
            className="h-10 px-3 text-sm"
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
              className="mr-1.5"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
            {activeRectangle !== null ? `删除 ${rectangles[activeRectangle]?.id}` : "删除矩形"}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="default"
            onClick={onRecognize}
            disabled={isRecognizing || !onRecognize}
            className="h-10 px-3 text-sm"
          >
            {isRecognizing ? "识别中..." : "开始识别"}
          </Button>
        </div>

        <div className="text-xs text-slate-500 mt-1 sm:mt-0 sm:ml-auto w-full sm:w-auto">
          {activeRectangle !== null
            ? `当前选中: ID ${rectangles[activeRectangle]?.id} (共 ${rectangles.length} 个)`
            : `点击矩形进行选择 (共 ${rectangles.length} 个)`}
        </div>
      </div>
    </div>
  )
} 