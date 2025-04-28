import type {
  EquipmentType,
  DetectEquipmentType,
  Rectangle,
} from "@/lib/types";
import { getImageDescriptorsFromImageAndRectangles } from "@/lib/cv-utils";

const groupRectanglesByTypeAndAspectRatio = (
  rectangles: Rectangle[],
  type: EquipmentType
): Record<DetectEquipmentType, Rectangle[]> => {
  const groups: Record<DetectEquipmentType, Rectangle[]> = {
    chara: [],
    "weapon/normal": [],
    "weapon/main": [],
    "summon/party_sub": [],
    "summon/party_main": [],
  };

  rectangles.forEach((rect) => {
    const aspectRatio = rect.width / rect.height;

    if (type === "chara") {
      groups["chara"].push(rect);
    } else if (type === "weapon") {
      if (aspectRatio >= 1) {
        groups["weapon/normal"].push(rect);
      } else {
        groups["weapon/main"].push(rect);
      }
    } else if (type === "summon") {
      if (aspectRatio >= 1) {
        groups["summon/party_sub"].push(rect);
      } else {
        groups["summon/party_main"].push(rect);
      }
    }
  });

  return groups;
};

// 识别设备主函数，提取为纯函数
export const performEquipmentRecognition = async (
  targetRectangles: Rectangle[],
  imageUrl: string,
  equipmentType: EquipmentType
): Promise<Record<number, { id: string; confidence: number }[]>> => {
  if (!imageUrl) {
    throw new Error("Image URL not provided");
  }

  const rectangleGroups = groupRectanglesByTypeAndAspectRatio(
    targetRectangles,
    equipmentType
  );
  const recognizedResults: Record<
    number,
    { id: string; confidence: number }[]
  > = {};

  const processPromises = Object.entries(rectangleGroups)
    .filter(([_, groupRects]) => groupRects.length > 0)
    .map(async ([groupType, groupRects]) => {
      try {
        const { results, originalRectIds } = await processRectangleGroup(
          targetRectangles,
          imageUrl,
          groupType as DetectEquipmentType,
          groupRects
        );

        results.forEach((result, idx) => {
          // 使用矩形ID作为键，而不是索引
          recognizedResults[originalRectIds[idx]] = result;
        });
      } catch (error) {
        console.error(`Failed to process group ${groupType}:`, error);
        // 继续处理其他组，而不是立即终止
      }
    });

  await Promise.all(processPromises);
  return recognizedResults;
};

// 新增：封装的请求函数
const sendRecognitionRequest = async (
  apiUrl: string,
  groupType: DetectEquipmentType,
  contents: string[],
  quickMode: boolean = false
): Promise<{ id: string; confidence: number }[][]> => {
  console.log(
    `Sending request for ${groupType} to ${apiUrl}/detect/${groupType}`
  );
  let url = `${apiUrl}/detect/${groupType}`
  
  if (quickMode) {
    if (groupType === "weapon/main" || groupType === "weapon/normal") {
      url = `${apiUrl}/detect/priority/${groupType}`
    } else {
        // 返回全空，因为未实现
        return Array.from({ length: contents.length }, () => []);
    }
  }
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contents, earlyReturn: true }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error(`Recognition failed for ${groupType}:`, errorData);
    throw new Error(
      `Recognition failed for ${groupType}: ${JSON.stringify(errorData)}`
    );
  }

  return (await response.json()) as { id: string; confidence: number }[][];
};

// 处理一组矩形的识别请求
const processRectangleGroup = async (
  rectangles: Rectangle[], // 注意：这个参数现在未使用，但保留以防未来需要
  imageUrl: string,
  groupType: DetectEquipmentType,
  groupRectangles: Rectangle[]
): Promise<{
  results: { id: string; confidence: number }[][];
  originalRectIds: number[];
}> => {
  const contents = await getImageDescriptorsFromImageAndRectangles(
    imageUrl,
    groupRectangles,
    groupType
  );

  // 记录每个矩形的唯一ID
  const originalRectIds = groupRectangles.map((rect) => rect.id);

  // 检查并获取 API 基础 URL
  if (process.env.NEXT_PUBLIC_DETECT_API_BASE_URL === undefined) {
    throw new Error("NEXT_PUBLIC_DETECT_API_BASE_URL is not defined");
  }
  const apiUrl = process.env.NEXT_PUBLIC_DETECT_API_BASE_URL;

  // 1. 第一次调用 (Quick Mode)
  console.log(`Phase 1: Quick Mode for ${groupType} (${contents.length} items)`);
  const quickResults = await sendRecognitionRequest(
    apiUrl,
    groupType,
    contents,
    true // quickMode = true
  );

  // 2. 处理第一次结果并识别未匹配项
  const finalResultsMap = new Map<number, { id: string; confidence: number }[]>();
  const unmatchedIndices: number[] = [];
  const unmatchedContents: string[] = [];

  quickResults.forEach((resultList, i) => {
    const currentRectId = originalRectIds[i];
    const topResult = resultList?.[0]; // 取置信度最高的结果

    if (topResult) {
      finalResultsMap.set(currentRectId, resultList);
    } else {
      unmatchedIndices.push(i);
      unmatchedContents.push(contents[i]);
    }
  });

  // 3. 第二次调用 (Normal Mode, 如果需要)
  if (unmatchedIndices.length > 0) {
    console.log(
      `Phase 2: Normal Mode for ${groupType} (${unmatchedContents.length} unmatched items)`
    );
    try {
      const normalResults = await sendRecognitionRequest(
        apiUrl,
        groupType,
        unmatchedContents,
        false // quickMode = false
      );

      normalResults.forEach((resultList, j) => {
        const originalIndex = unmatchedIndices[j];
        const originalRectIdForNormal = originalRectIds[originalIndex];
        // 无论普通模式结果如何，都用它覆盖（或填充）
        finalResultsMap.set(originalRectIdForNormal, resultList);
      });
    } catch (error) {
        console.error(
            `Normal mode recognition failed for ${unmatchedContents.length} items of type ${groupType}. These items might be missing results.`, error
        );
        // 即使普通模式失败，也要确保未匹配项在最终结果中有占位符
        unmatchedIndices.forEach(index => {
            const rectId = originalRectIds[index];
            if (!finalResultsMap.has(rectId)) {
                finalResultsMap.set(rectId, []); // 使用空数组表示失败
            }
        });
    }
  }

  // 4. 格式化最终输出 (确保顺序与原始输入一致)
  const finalResultsArray: { id: string; confidence: number }[][] = originalRectIds.map(
    (rectId) => finalResultsMap.get(rectId) || [] // 如果map中没有（理论上不应发生，除非普通模式也失败且未捕获），则默认为空
  );

  return { results: finalResultsArray, originalRectIds };
};
