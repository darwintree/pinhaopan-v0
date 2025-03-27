
import cv from "@techstark/opencv-js";
import { serializeDes, getDes } from "./cv";

type DetectEquipmentType = "weapon/main" | "weapon/normal" | "summon/party_main" | "summon/party_sub" | "chara"

export async function detectEquipment(image: cv.Mat, type: DetectEquipmentType) {
  const des = new cv.Mat();
  getDes(image, des);
  const { content, shape } = serializeDes(des);
  des.delete();

  const response = await fetch(`${process.env.DETECT_API_BASE_URL}/${type}`, {
    method: "POST",
    body: JSON.stringify({ content, shape }),
  });

  return response.json();
}