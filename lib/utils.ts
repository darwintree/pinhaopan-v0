import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 矩形检测相关接口
export interface Rectangle {
  id: number
  x: number
  y: number
  width: number
  height: number
}

export interface RectangleDetectionResult {
  rectangles: Rectangle[]
  imageSize: {
    width: number
    height: number
  }
}

export type EquipmentType = "chara" | "weapon" | "summon"

// Mock 矩形检测数据
export const mockRectangleDetection = (type: EquipmentType): RectangleDetectionResult => {
  // 模拟图片尺寸
  const imageSize = {
    width: 800,
    height: 450,
  }

  // 根据不同类型生成不同的矩形数据
  let rectangles: Rectangle[] = []

  switch (type) {
    case "chara":
      rectangles = [
        { id: 0, x: 50, y: 50, width: 100, height: 100 },
        { id: 1, x: 200, y: 50, width: 100, height: 100 },
        { id: 2, x: 350, y: 50, width: 100, height: 100 },
        { id: 3, x: 50, y: 200, width: 100, height: 100 },
        { id: 4, x: 200, y: 200, width: 100, height: 100 },
      ]
      break
    case "weapon":
      rectangles = [
        { id: 0, x: 50, y: 50, width: 80, height: 80 },
        { id: 1, x: 150, y: 50, width: 80, height: 80 },
        { id: 2, x: 250, y: 50, width: 80, height: 80 },
        { id: 3, x: 350, y: 50, width: 80, height: 80 },
        { id: 4, x: 450, y: 50, width: 80, height: 80 },
        { id: 5, x: 50, y: 150, width: 80, height: 80 },
        { id: 6, x: 150, y: 150, width: 80, height: 80 },
        { id: 7, x: 250, y: 150, width: 80, height: 80 },
        { id: 8, x: 350, y: 150, width: 80, height: 80 },
      ]
      break
    case "summon":
      rectangles = [
        { id: 0, x: 100, y: 50, width: 100, height: 100 },
        { id: 1, x: 300, y: 50, width: 100, height: 100 },
        { id: 2, x: 100, y: 200, width: 100, height: 100 },
        { id: 3, x: 300, y: 200, width: 100, height: 100 },
      ]
      break
  }

  return {
    rectangles,
    imageSize,
  }
}

// 模拟矩形检测过程
export const detectRectangles = async (imageUrl: string, type: EquipmentType): Promise<RectangleDetectionResult> => {
  // 模拟 API 调用延迟
  await new Promise((resolve) => setTimeout(resolve, 1000))
  
  // 返回 mock 数据
  return mockRectangleDetection(type)
}
