import { EquipmentType } from "./utils";

export function getGuidePhotoUrl(guideId: string, equipmentType: EquipmentType) {
  const baseUrl = process.env.NEXT_PUBLIC_UPLOAD_IMG_BASE_URL
  return `${baseUrl}/${equipmentType}s/${guideId}_${equipmentType}s.png`
}

export function getQuestPhotoUrl(questImg: string | undefined) {
  const baseUrl = process.env.NEXT_PUBLIC_ASSETS_BASE_URL
  if (!questImg) {
    return `${process.env.NEXT_PUBLIC_ASSETS_BASE_URL}/placeholder.svg`
  }
  return `${baseUrl}/quest/${questImg}.png`
}

export function getEquipmentPhotoUrl(id: string, equipmentType?: EquipmentType) {
  const baseUrl = process.env.NEXT_PUBLIC_ASSETS_BASE_URL
  if (!baseUrl) {
    throw new Error("ASSETS_BASE_URL is not set")
  }
  if (id.startsWith("f_")) {
    return `${baseUrl}/chara/${id}.jpg`
  }
  if (id.startsWith("party_main_")) {
    return `${baseUrl}/summon/party_main/${id}.jpg`
  }
  if (id.startsWith("party_sub_")) {
    return `${baseUrl}/summon/party_sub/${id}.jpg`
  }
  if (id.startsWith("ls_")) {
    return `${baseUrl}/weapon/main/${id}.jpg`
  }
  if (id.startsWith("m_")) {
    return `${baseUrl}/weapon/normal/${id}.jpg`
  }
  if (equipmentType) {
    switch (equipmentType) {
      case "chara":
        return `${baseUrl}/chara/f_${id}_01.jpg`
      case "weapon":
        return `${baseUrl}/weapon/normal/m_${id}.jpg`
      case "summon":
        return `${baseUrl}/summon/party_sub/party_sub_${id}.jpg`
    }
  }
  return `${baseUrl}/placeholder.svg`
}

export function normalizeEquipmentId(id: string) {
  const prefixes = ["party_main_", "party_sub_", "f_", "ls_", "m_"]
  const prefix = prefixes.find(prefix => id.startsWith(prefix))
  let normalizedId = id.split("_")[0]
  if (prefix) {
    normalizedId = id.slice(prefix.length).split("_")[0]
  }
  try {
    // 检查是否可以转换为数字
    Number(normalizedId)
    return normalizedId
  } catch (error) {
    throw new Error(`Invalid equipment ID: ${id}`)
  }
}
