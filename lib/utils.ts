import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import type { DetectEquipmentType, BoundingBox, Rectangle } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export interface RectangleDetectionResult {
  rectangles: Rectangle[]
  imageSize: {
    width: number
    height: number
  }
}

export const imageSizes: Record<DetectEquipmentType, [number, number]> = {
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
  maxWidth: number = 600, 
  maxHeight: number = 600
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

/**
 * Crops an image based on the provided bounding box.
 * Clamps the bounding box to the image dimensions.
 * @param base64Image The original base64 image string.
 * @param bbox The bounding box { x, y, width, height }.
 * @returns A promise resolving to the cropped base64 image string.
 */
export const cropImage = async (
  base64Image: string,
  bbox: BoundingBox
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const originalWidth = img.naturalWidth;
      const originalHeight = img.naturalHeight;

      // Clamp the bounding box coordinates and dimensions
      const sx = Math.max(0, bbox.x);
      const sy = Math.max(0, bbox.y);
      // Ensure width doesn't exceed image bounds from sx
      const sWidth = Math.max(0, Math.min(bbox.width, originalWidth - sx));
      // Ensure height doesn't exceed image bounds from sy
      const sHeight = Math.max(0, Math.min(bbox.height, originalHeight - sy));

      // If the resulting width or height is zero or negative, return the original image
      if (sWidth <= 0 || sHeight <= 0) {
        console.warn("Bounding box is outside the image or invalid. Returning original image.");
        resolve(base64Image);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = sWidth;
      canvas.height = sHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context for cropping'));
        return;
      }

      // Draw the cropped portion onto the canvas
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

      // Convert the canvas to base64
      const format = base64Image.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
      const quality = 0.9; // Adjust quality as needed for JPEG
      const croppedBase64 = canvas.toDataURL(format, quality);

      resolve(croppedBase64);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for cropping'));
    };

    img.src = base64Image;
  });
};
