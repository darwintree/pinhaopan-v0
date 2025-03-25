import cv from "@techstark/opencv-js"

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

function createCharaMask(image: cv.Mat): cv.Mat {
  // 金色的 HSV 范围
  const colorRanges = [
    {
      lower: cv.matFromArray(1, 3, cv.CV_8UC1, [96, 225, 40]),
      upper: cv.matFromArray(1, 3, cv.CV_8UC1, [98, 255, 80])
    },
    {
      lower: cv.matFromArray(1, 3, cv.CV_8UC1, [60, 20, 1]),
      upper: cv.matFromArray(1, 3, cv.CV_8UC1, [100, 50, 25])
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
  return equipmentBoxes.sort((a, b) => a.x - b.x);
}

