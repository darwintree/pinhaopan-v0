import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import cv from "@techstark/opencv-js"
import { detectChara, detectWeapon, detectSummon, Box, getDesBase64 } from "./cv"
import { DetectEquipmentType } from "./types"

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

// 模拟矩形检测过程
export const detectRectangles = async (imageUrl: string, type: EquipmentType): Promise<RectangleDetectionResult> => {
  console.log(type)
  // imgUrl to HTMLImageElement
  const imgSrc = new Image()
  imgSrc.src = imageUrl
  // wait for imgSrc to load
  await new Promise((resolve) => {
    imgSrc.onload = resolve
  })
  const img = cv.imread(imgSrc)
  let boxes: Box[] = []
  switch (type) {
    case "chara":
      boxes = detectChara(img)
      break
    case "weapon":
      boxes = detectWeapon(img)
      break
    case "summon":
      boxes = detectSummon(img)
      break
  }
  return {
    rectangles: boxes.map((box, index) => ({
      ...box,
      id: index,
      width: box.w,
      height: box.h
    })),
    imageSize: {
      width: img.cols,
      height: img.rows,
    },
  }
}

const image_sizes: Record<DetectEquipmentType, [number, number]> = {
  "weapon/main": [200, 420],
  "weapon/normal": [280, 160],
  "summon/party_main": [196, 340],
  "summon/party_sub": [184, 138],
  "chara": [196, 408],
}

export const getImageDescriptorsFromImageAndRectangles = async (imageUrl: string, rectangles: Rectangle[], equipmentDetectType: DetectEquipmentType) => {
  const imgSrc = new Image()
  imgSrc.src = imageUrl
  await new Promise((resolve) => {
    imgSrc.onload = resolve
  })
  const img = cv.imread(imgSrc)
  const contents: string[] = []
  try {
    for (const rectangle of rectangles) {
      const { x, y, width, height } = rectangle
      const subImage = img.roi(new cv.Rect(x, y, width, height))
      const shouldSize = image_sizes[equipmentDetectType]
      if (!shouldSize) {
        throw new Error(`Unknown equipment detect type: ${equipmentDetectType}`)
      }
      const [shouldWidth, shouldHeight] = shouldSize
      cv.resize(subImage, subImage, new cv.Size(shouldWidth, shouldHeight))
      try {
        const content = getDesBase64(subImage)
        console.log("content:", content)
        contents.push(content)
      } finally {
        subImage.delete()
      }
    }
  } finally {
    img.delete()
  }
  return contents
}
