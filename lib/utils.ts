import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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

export const image_sizes: Record<DetectEquipmentType, [number, number]> = {
  "weapon/main": [200, 420],
  "weapon/normal": [280, 160],
  "summon/party_main": [196, 340],
  "summon/party_sub": [184, 138],
  "chara": [78, 142],
}

/**
 * 调整图片大小，保持宽高比，确保不超过最大宽高
 * @param base64Image 原始base64图片
 * @param maxWidth 最大宽度
 * @param maxHeight 最大高度
 * @returns 调整大小后的base64图片
 */
export const resizeImageWithAspectRatio = async (
  base64Image: string,
  maxWidth: number = 300, 
  maxHeight: number = 300
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // 获取原始图片尺寸
      const originalWidth = img.width;
      const originalHeight = img.height;
      
      // 如果图片尺寸已经在限制范围内，直接返回原图
      if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
        resolve(base64Image);
        return;
      }
      
      // 计算缩放比例，取宽高比例的较小值确保图片完全在限制范围内
      const widthRatio = maxWidth / originalWidth;
      const heightRatio = maxHeight / originalHeight;
      const ratio = Math.min(widthRatio, heightRatio);
      
      // 计算新尺寸
      const newWidth = Math.floor(originalWidth * ratio);
      const newHeight = Math.floor(originalHeight * ratio);
      
      // 创建canvas并绘制调整大小后的图片
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // 将canvas内容转为base64，保持原始图片格式
      const format = base64Image.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
      const quality = 0.9; // JPEG压缩质量，PNG不受影响
      const resizedBase64 = canvas.toDataURL(format, quality);
      
      resolve(resizedBase64);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = base64Image;
  });
};
