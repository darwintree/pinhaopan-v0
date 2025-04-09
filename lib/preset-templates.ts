import type { Rectangle } from "./utils";
import type { EquipmentType } from "./types";

// 宽高比常量
export const ASPECT_RATIOS = {
  "16:9": 1.77,
  "4:3": 1.33,
  "1:1": 1,
  "3:4": 0.75,
  "9:16": 0.56,
  "CHARACTER": 3.475 // 角色布局 (973:280)
};

// 预设类型
export type PresetType = "grid3x3" | "weapon" | "summon" | "chara";

// 设备类型到默认宽高比的映射
export const DEFAULT_ASPECT_RATIOS: Record<EquipmentType, number> = {
  "chara": ASPECT_RATIOS.CHARACTER,
  "weapon": ASPECT_RATIOS["16:9"],
  "summon": ASPECT_RATIOS["16:9"]
};

// 设备类型到默认预设类型的映射
export const DEFAULT_PRESET_TYPES: Record<EquipmentType, PresetType> = {
  "chara": "chara",
  "weapon": "weapon",
  "summon": "summon"
};

// 预设布局标准数据
export const PRESET_LAYOUTS = {
  // 角色预设布局数据
  chara: {
    standardWidth: 973,
    standardHeight: 280,
    // 标准矩形位置 (x, y, w, h)
    standardRects: [
      {x: 0, y: 1, w: 155, h: 276},
      {x: 155, y: 1, w: 155, h: 276}, 
      {x: 310, y: 1, w: 155, h: 276},
      {x: 465, y: 1, w: 155, h: 276},
      {x: 661, y: 1, w: 155, h: 276},
      {x: 816, y: 1, w: 155, h: 276}
    ]
  },
  
  // 武器预设布局数据
  weapon: {
    // 这里无需标准宽高，因为是基于输入尺寸的百分比
    mainWidthRatio: 0.15, // 主武器宽度占总宽度的比例
    mainHeightRatio: 0.8, // 主武器高度占总高度的比例
    gridRows: 3,
    gridCols: 3
  },
  
  // 召唤石预设布局数据
  summon: {
    // 这里无需标准宽高，因为是基于输入尺寸的百分比
    mainWidthRatio: 0.2, // 主召唤石宽度占总宽度的比例
    mainHeightRatio: 1.0, // 主召唤石高度占总高度的比例
    gridRows: 2,
    gridCols: 4
  }
};

// 根据类型获取默认宽高比
export function getDefaultAspectRatio(type: EquipmentType): number {
  return DEFAULT_ASPECT_RATIOS[type] || ASPECT_RATIOS["16:9"];
}

// 根据类型获取默认预设类型
export function getDefaultPresetType(type: EquipmentType): PresetType {
  return DEFAULT_PRESET_TYPES[type] || "grid3x3";
}

// 生成预设矩形的统一函数
export function generatePresetRectangles(
  presetType: PresetType,
  width: number,
  height: number,
  position: { x: number; y: number },
  equipmentType: EquipmentType,
  startId: number = 1
): Rectangle[] {
  const { x, y } = position;
  
  switch(presetType) {
    case "grid3x3": {
      // 生成3x3网格
      const cellWidth = width / 3;
      const cellHeight = height / 3;
      const grid: Rectangle[] = [];
      
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          grid.push({
            id: startId + row * 3 + col,
            x: x + col * cellWidth,
            y: y + row * cellHeight,
            width: cellWidth,
            height: cellHeight
          });
        }
      }
      
      return grid;
    }
    
    case "chara": {
      // 角色预设布局
      if (equipmentType !== "chara") {
        return generatePresetRectangles("grid3x3", width, height, position, equipmentType, startId);
      }
      
      const layout = PRESET_LAYOUTS.chara;
      const { standardWidth, standardHeight, standardRects } = layout;
      
      // 计算缩放比例
      const scaleX = width / standardWidth;
      const scaleY = height / standardHeight;
      
      // 创建缩放后的矩形
      const rectangles: Rectangle[] = standardRects.map((rect, index) => ({
        id: startId + index,
        x: x + rect.x * scaleX,
        y: y + rect.y * scaleY,
        width: rect.w * scaleX,
        height: rect.h * scaleY
      }));
      
      return rectangles;
    }
    
    case "weapon": {
      // 武器预设布局
      if (equipmentType !== "weapon") {
        return generatePresetRectangles("grid3x3", width, height, position, equipmentType, startId);
      }
      
      const layout = PRESET_LAYOUTS.weapon;
      const mainWidth = width * layout.mainWidthRatio;
      const mainHeight = height * layout.mainHeightRatio;
      const gridWidth = (width - mainWidth) / layout.gridCols;
      const gridHeight = height / layout.gridRows;
      
      const rectangles: Rectangle[] = [
        // 主武器（左侧长条）
        {
          id: startId,
          x,
          y: y + (height - mainHeight) / 2,
          width: mainWidth,
          height: mainHeight
        }
      ];
      
      // 3x3网格（右侧）
      for (let row = 0; row < layout.gridRows; row++) {
        for (let col = 0; col < layout.gridCols; col++) {
          rectangles.push({
            id: startId + rectangles.length,
            x: x + mainWidth + col * gridWidth,
            y: y + row * gridHeight,
            width: gridWidth,
            height: gridHeight
          });
        }
      }
      
      return rectangles;
    }
    
    case "summon": {
      // 召唤石预设布局
      if (equipmentType !== "summon") {
        return generatePresetRectangles("grid3x3", width, height, position, equipmentType, startId);
      }
      
      const layout = PRESET_LAYOUTS.summon;
      const mainWidth = width * layout.mainWidthRatio;
      const mainHeight = height * layout.mainHeightRatio;
      const subWidth = (width - mainWidth) / layout.gridCols;
      const subHeight = height / layout.gridRows;
      
      const rectangles: Rectangle[] = [
        // 主召唤石（左侧长条）
        {
          id: startId,
          x,
          y,
          width: mainWidth,
          height: mainHeight
        }
      ];
      
      // 网格（右侧）
      for (let row = 0; row < layout.gridRows; row++) {
        for (let col = 0; col < layout.gridCols; col++) {
          rectangles.push({
            id: startId + rectangles.length,
            x: x + mainWidth + col * subWidth,
            y: y + row * subHeight,
            width: subWidth,
            height: subHeight
          });
        }
      }
      
      return rectangles;
    }
    
    default:
      return [];
  }
}

// 获取宽高比选项列表，用于UI展示
export function getAspectRatioOptions() {
  return [
    { value: String(ASPECT_RATIOS["16:9"]), label: "16:9" },
    { value: String(ASPECT_RATIOS["4:3"]), label: "4:3" },
    { value: String(ASPECT_RATIOS["1:1"]), label: "1:1" },
    { value: String(ASPECT_RATIOS["3:4"]), label: "3:4" },
    { value: String(ASPECT_RATIOS["9:16"]), label: "9:16" },
    { value: String(ASPECT_RATIOS.CHARACTER), label: "角色布局 (973:280)" },
  ];
} 