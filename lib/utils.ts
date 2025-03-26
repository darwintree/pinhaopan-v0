import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import cv from "@techstark/opencv-js"
import { detectChara, detectWeapon, detectSummon, Box } from "./cv"
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
