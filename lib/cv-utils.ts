import cv from "@techstark/opencv-js";
import { Box, detectChara, detectWeapon, detectSummon, getDesBase64 } from "./cv";
import { DetectEquipmentType, EquipmentType } from "./types";
import { image_sizes, Rectangle, RectangleDetectionResult } from "./utils";


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
};export const getImageDescriptorsFromImageAndRectangles = async (imageUrl: string, rectangles: Rectangle[], equipmentDetectType: DetectEquipmentType) => {
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

