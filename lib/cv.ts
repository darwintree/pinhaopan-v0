import cv from "@techstark/opencv-js"
import { DetectEquipmentType } from "./types";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

// 先确认 (a.y, a.y+h) 与 (b.y, b.y+h) 是否存在重叠部分
// 如果不存在，则返回 b.y-a.y
// 如果存在，则返回 b.x-a.x
function compareBox(a: Box, b: Box) {
  // 检查y轴是否有重叠
  const aYRange = { start: a.y, end: a.y + a.h };
  const bYRange = { start: b.y, end: b.y + b.h };
  
  // 如果a的结束位置小于b的开始位置，或者a的开始位置大于b的结束位置，则没有重叠
  const hasYOverlap = !(aYRange.end < bYRange.start || aYRange.start > bYRange.end);
  
  if (!hasYOverlap) {
    return a.y - b.y; // 按y轴位置排序
  }
  
  return a.x - b.x; // y轴重叠时按x轴位置排序
}

function createCharaMask(image: cv.Mat): cv.Mat {
  // 金色的 HSV 范围
  const colorRanges = [
    {
      lower: cv.matFromArray(1, 3, cv.CV_8UC1, [96, 160, 40]),
      upper: cv.matFromArray(1, 3, cv.CV_8UC1, [101, 255, 80])
    },
    {
      lower: cv.matFromArray(1, 3, cv.CV_8UC1, [60, 1, 1]),
      upper: cv.matFromArray(1, 3, cv.CV_8UC1, [100, 80, 25])
    }
  ];
  const bgr = new cv.Mat();
  cv.cvtColor(image, bgr, cv.COLOR_RGBA2BGR);

  const hsv = new cv.Mat();
  cv.cvtColor(bgr, hsv, cv.COLOR_BGR2HSV);

  // 创建初始空掩码
  const finalMask = new cv.Mat(image.rows, image.cols, cv.CV_8UC1, new cv.Scalar(0));

  // 为每个颜色范围创建掩码并合并
  colorRanges.forEach(({ lower, upper }) => {
    const mask = new cv.Mat();
    cv.inRange(hsv, lower, upper, mask);
    cv.bitwise_or(finalMask, mask, finalMask);
    mask.delete();
  });

  // 清理资源
  bgr.delete();
  hsv.delete();
  colorRanges.forEach(({ lower, upper }) => {
    lower.delete();
    upper.delete();
  });

  return finalMask;
}

export function detectChara(image: cv.Mat): Box[] {
  const picWidth = image.cols;
  const equipmentBoxes: Box[] = [];

  // 创建金色掩码
  const mask = createCharaMask(image);

  // 形态学操作
  const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
  cv.morphologyEx(mask, mask, cv.MORPH_CLOSE, kernel, new cv.Point(-1, -1), 5);

  // 查找轮廓
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(mask, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

  console.log(contours)

  // 处理轮廓
  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const rect = cv.boundingRect(contour);
    const { width: w, x, y } = rect;

    // 使用宽度过滤
    if (w > picWidth * 0.1 && w < picWidth * 0.3) {
      equipmentBoxes.push({
        x: x,
        y: y,
        w: rect.width,
        h: rect.height
      });
    }
  }

  // 清理资源
  mask.delete();
  kernel.delete();
  contours.delete();
  hierarchy.delete();

  // 对框进行排序
  return equipmentBoxes.sort(compareBox);
}

function createWeaponMask(image: cv.Mat): cv.Mat {
  // 金色的 HSV 范围
  const colorRanges = [
    {
      lower: cv.matFromArray(1, 3, cv.CV_8UC1, [15, 60, 180]),
      upper: cv.matFromArray(1, 3, cv.CV_8UC1, [25, 150, 255])
    }
  ];

  const bgr = new cv.Mat();
  cv.cvtColor(image, bgr, cv.COLOR_RGBA2BGR);

  const hsv = new cv.Mat();
  cv.cvtColor(bgr, hsv, cv.COLOR_BGR2HSV);

  // 创建初始空掩码
  const finalMask = new cv.Mat(image.rows, image.cols, cv.CV_8UC1, new cv.Scalar(0));

  // 为每个颜色范围创建掩码并合并
  colorRanges.forEach(({ lower, upper }) => {
    const mask = new cv.Mat();
    cv.inRange(hsv, lower, upper, mask);
    cv.bitwise_or(finalMask, mask, finalMask);
    mask.delete();
  });

  // 清理资源
  bgr.delete();
  hsv.delete();
  colorRanges.forEach(({ lower, upper }) => {
    lower.delete();
    upper.delete();
  });

  return finalMask;
}

export function detectWeapon(image: cv.Mat): Box[] {
  const picWidth = image.cols;
  const equipmentBoxes: Box[] = [];

  // 创建金色掩码
  const mask = createWeaponMask(image);

  // 形态学操作
  const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
  cv.morphologyEx(mask, mask, cv.MORPH_CLOSE, kernel, new cv.Point(-1, -1), 3);
  cv.morphologyEx(mask, mask, cv.MORPH_OPEN, kernel, new cv.Point(-1, -1), 1);

  // 查找轮廓
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  // 处理轮廓
  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const rect = cv.boundingRect(contour);
    const { width: w, height: h, x, y } = rect;

    // 使用宽度过滤
    if (w > picWidth * 0.1 && w < picWidth * 0.3 && h > w * 0.3) {
      equipmentBoxes.push({
        x: x,
        y: y,
        w: rect.width,
        h: rect.height
      });
    }
  }

  // 清理资源
  mask.delete();
  kernel.delete();
  contours.delete();
  hierarchy.delete();

  // 对框进行排序
  return equipmentBoxes.sort(compareBox);
}

function filterContours(
  contours: cv.MatVector,
  minAspect: number,
  maxAspect: number,
  minWidthRatio: number,
  maxWidthRatio: number,
  imageWidth: number
): Box[] {
  const filteredBoxes: Box[] = [];
  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const rect = cv.boundingRect(contour);
    const aspectRatio = rect.width / rect.height;
    
    if (minAspect <= aspectRatio && aspectRatio <= maxAspect &&
        imageWidth * minWidthRatio < rect.width && rect.width < imageWidth * maxWidthRatio) {
      filteredBoxes.push({
        x: rect.x,
        y: rect.y,
        w: rect.width,
        h: rect.height
      });
    }
  }
  return filteredBoxes;
}

function mergeOverlappingBoxes(
  boxes: Box[],
  overlapThreshold: number = 0.3
): Box[] {
  if (boxes.length === 0) {
    return [];
  }

  const mergedBoxes: Box[] = [];
  const boxesCopy = [...boxes].sort((a, b) => a.x - b.x);

  while (boxesCopy.length > 0) {
    const current = boxesCopy.shift()!;
    let x1 = current.x, y1 = current.y, w1 = current.w, h1 = current.h;

    let i = 0;
    while (i < boxesCopy.length) {
      const box = boxesCopy[i];
      const x2 = box.x, y2 = box.y, w2 = box.w, h2 = box.h;

      // 计算重叠区域
      const overlapX = Math.max(0, Math.min(x1 + w1, x2 + w2) - Math.max(x1, x2));
      const overlapY = Math.max(0, Math.min(y1 + h1, y2 + h2) - Math.max(y1, y2));
      const overlapArea = overlapX * overlapY;

      // 计算重叠比例
      const area1 = w1 * h1;
      const area2 = w2 * h2;
      const overlapRatio = overlapArea / Math.min(area1, area2);

      if (overlapRatio > overlapThreshold) {
        // 合并矩形
        x1 = Math.min(x1, x2);
        y1 = Math.min(y1, y2);
        w1 = Math.max(x1 + w1, x2 + w2) - x1;
        h1 = Math.max(y1 + h1, y2 + h2) - y1;

        boxesCopy.splice(i, 1);
      } else {
        i++;
      }
    }

    mergedBoxes.push({ x: x1, y: y1, w: w1, h: h1 });
  }

  return mergedBoxes;
}

export function detectGrid(
  image: cv.Mat,
  lowThreshold: number,
  highThreshold: number,
  apertureSize: number
): Box[] {
  // 转换为灰度图并模糊
  const gray = new cv.Mat();
  cv.cvtColor(image, gray, cv.COLOR_RGBA2GRAY);
  
  const blurred = new cv.Mat();
  cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

  // 应用Canny边缘检测
  const edges = new cv.Mat();
  cv.Canny(blurred, edges, lowThreshold, highThreshold, apertureSize);

  // 形态学操作
  const kernel = cv.Mat.ones(2, 2, cv.CV_8U);
  cv.morphologyEx(edges, edges, cv.MORPH_CLOSE, kernel, new cv.Point(-1, -1), 3);
  
  // 膨胀操作
  cv.dilate(edges, edges, kernel, new cv.Point(-1, -1), 1);

  // 查找轮廓
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  // 筛选装备格子
  const equipmentBoxes = filterContours(
    contours,
    0.5,  // minAspect
    2.0,  // maxAspect
    0.1,  // minWidthRatio
    0.5,  // maxWidthRatio
    image.cols
  );

  // 合并重叠的矩形
  const mergedBoxes = mergeOverlappingBoxes(equipmentBoxes);

  // 清理资源
  gray.delete();
  blurred.delete();
  edges.delete();
  kernel.delete();
  contours.delete();
  hierarchy.delete();

  return mergedBoxes.sort(compareBox);
}

export function detectSummon(image: cv.Mat): Box[] {
  return detectGrid(image, 100, 200, 3);
}

function get_orb(detectEquipmentType: DetectEquipmentType) {
  if (detectEquipmentType === "chara") {
    return new cv.ORB(500); // 角色检测需要更多的特征点
  }
  return new cv.ORB(200);
}

export function getDesBase64(image: cv.Mat, detectEquipmentType: DetectEquipmentType) {
  const des = new cv.Mat();
  getDes(image, des, detectEquipmentType);
  return serializeDes(des);
}

export function getDes(image: cv.Mat, des: cv.Mat, detectEquipmentType: DetectEquipmentType) {
  const keypoints = new cv.KeyPointVector();
  const mask = new cv.Mat();
  get_orb(detectEquipmentType).detectAndCompute(image, mask, keypoints, des);
  keypoints.delete();
  mask.delete();
}

export function serializeDes(des: cv.Mat): string {
  const buffer = new Uint8Array(des.data);
  const content = btoa(String.fromCharCode.apply(null, [...buffer]));
  return content;
}

