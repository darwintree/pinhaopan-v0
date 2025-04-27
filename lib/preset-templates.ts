import type { EquipmentType, PresetType, Rectangle } from "./types";

// 设备类型到默认预设类型的映射
export const DEFAULT_PRESET_TYPES: Record<EquipmentType, PresetType> = {
  "chara": "chara",
  "weapon": "weapon",
  "summon": "summon"
};

const MASK_RECTS = {
  chara: [
    { x: 0, y: 1, w: 155, h: 276 },
    { x: 155, y: 1, w: 155, h: 276 },
    { x: 310, y: 1, w: 155, h: 276 },
    { x: 506, y: 1, w: 155, h: 276 },
    { x: 661, y: 1, w: 155, h: 276 }
  ],
  weapon: [
    {
      "x": 36,
      "y": 260,
      "w": 262,
      "h": 553,
    },
    {
      "x": 331,
      "y": 140,
      "w": 252,
      "h": 144,
    },
    {
      "x": 597.9998932825505,
      "y": 140.00000451554794,
      "w": 247.11713933415535,
      "h": 143.06781750924785,

    },
    {
      "x": 865,
      "y": 140,
      "w": 253,
      "h": 144,
    },
    {
      "x": 331,
      "y": 418,
      "w": 252,
      "h": 143,
    },
    {
      "x": 598,
      "y": 418,
      "w": 252,
      "h": 144,
    },
    {
      "x": 865,
      "y": 418,
      "w": 253,
      "h": 144,
    },
    {
      "x": 331.0000516277647,
      "y": 695.9999184943598,

      "w": 251.4525277435265,
      "h": 144.51294697903822,
    },
    {
      "x": 598,
      "y": 696,
      "w": 253,
      "h": 144,
    },
    {
      "x": 863.5548705302097,
      "y": 694.5548705302095,
      "w": 252,
      "h": 142,
    }
  ],
  weapon13: [
    {
      "x": 597.3107577510885,
      "y": 135.0000032714204,
      "w": 252.89765721331688,
      "h": 145.9580764488286,
    },
    {
      "x": 44,
      "y": 273,
      "w": 265,
      "h": 553,
    },
    {
      "x": 331,
      "y": 134,
      "w": 256,
      "h": 145,
    },
    {
      "x": 865,
      "y": 134,
      "w": 252,
      "h": 145,
    },
    {
      "x": 331,
      "y": 424,
      "w": 252,
      "h": 144,
    },
    {
      "x": 597.9998932825505,
      "y": 423.9999873917435,
      "w": 252.89765721331688,
      "h": 141.62268803945744,
    },
    {
      "x": 865,
      "y": 424,
      "w": 252,
      "h": 144,
    },
    {
      "x": 331,
      "y": 713,
      "w": 252,
      "h": 144,
    },
    {
      "x": 598,
      "y": 713,
      "w": 253,
      "h": 144,
    },
    {
      "x": 865,
      "y": 713,
      "w": 253,
      "h": 144,
    },
    {
      "x": 331,
      "y": 1012,
      "w": 252,
      "h": 144,
    },
    {
      "x": 598,
      "y": 1012,
      "w": 253,
      "h": 145,
    },
    {
      "x": 864,
      "y": 1012,
      "w": 254,
      "h": 144,
    }
  ],
  summon: [
    {
      "x": 28.890240877389026,
      "y": 213.48835297195302,
      "w": 377.17879161528975,
      "h": 634.4118372379778,
    },
    {
      "x": 448,
      "y": 167,
      "w": 338,
      "h": 255,
    },
    {
      "x": 795,
      "y": 167,
      "w": 339,
      "h": 255,
    },
    {
      "x": 446.3230415466534,
      "y": 593.0000002257774,
      "w": 339.6054254007398,
      "h": 257.23304562268805,

    },
    {
      "x": 795,
      "y": 595,
      "w": 339,
      "h": 255,
    },
    {
      "x": 455,
      "y": 1067,
      "w": 339,
      "h": 255,
    },
    {
      "x": 799,
      "y": 1067,
      "w": 337,
      "h": 254,
    }
  ]
}

function getLayoutFromRects(rects: { x: number, y: number, w: number, h: number }[]) {
  let maxX = -1
  let minX = rects[0].x
  let minY = rects[0].y
  let maxY = -1
  for (const rect of rects) {
    if (rect.x + rect.w > maxX) maxX = rect.x + rect.w
    if (rect.x < minX) minX = rect.x
    if (rect.y + rect.h > maxY) maxY = rect.y + rect.h
    if (rect.y < minY) minY = rect.y
  }
  return {
    standardWidth: maxX - minX,
    standardHeight: maxY - minY,
    aspectRatio: (maxX - minX) / (maxY - minY),
    standardRects: rects.map(rect => ({
      x: rect.x - minX,
      y: rect.y - minY,
      w: rect.w,
      h: rect.h
    }))
  }
}

export const PRESET_LAYOUTS = {
  chara: getLayoutFromRects(MASK_RECTS.chara),
  weapon: getLayoutFromRects(MASK_RECTS.weapon),
  weapon13: getLayoutFromRects(MASK_RECTS.weapon13),
  summon: getLayoutFromRects(MASK_RECTS.summon),
}


// 根据设备类型定义可用的预设模板列表
export const AVAILABLE_PRESETS: Record<EquipmentType, { value: PresetType; label: string }[]> = {
  "chara": [
    { value: "chara", label: "角色布局" },
  ],
  "weapon": [
    { value: "weapon", label: "武器10格" },
    { value: "weapon13", label: "武器13格" },
  ],
  "summon": [
    { value: "summon", label: "召唤石布局" },
  ]
};

// 根据类型获取默认预设类型
export function getDefaultPresetType(type: EquipmentType): PresetType {
  return DEFAULT_PRESET_TYPES[type]
}

// 从预设类型获取宽高比
export function getPresetAspectRatio(presetType: PresetType): number {
  return PRESET_LAYOUTS[presetType].aspectRatio;
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
  const layout = PRESET_LAYOUTS[presetType];
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
