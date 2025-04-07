import { EquipmentType } from "./types";

export function getGuidePhotoUrl(guideId: string, equipmentType: EquipmentType) {
  const baseUrl = process.env.NEXT_PUBLIC_UPLOAD_IMG_BASE_URL
  return `${baseUrl}/${equipmentType}s/${guideId}_${equipmentType}s.png`
}

export function getGuidePhotoThumbUrl(guideId: string, equipmentType: EquipmentType) {
  const baseUrl = process.env.NEXT_PUBLIC_UPLOAD_IMG_BASE_URL
  return `${baseUrl}/${equipmentType}s/${guideId}_${equipmentType}s_thumb.png`
}

export function getCategoryUrl(categoryId: string | undefined) {
  const baseUrl = process.env.NEXT_PUBLIC_ASSETS_BASE_URL
  if (!categoryId) {
    return `${baseUrl}/placeholder.svg`
  }
  return `${baseUrl}/category/${categoryId}.png`
}

export function getQuestPhotoUrl(questImg: string | undefined) {
  const baseUrl = process.env.NEXT_PUBLIC_ASSETS_BASE_URL
  if (!questImg) {
    return `${process.env.NEXT_PUBLIC_ASSETS_BASE_URL}/placeholder.svg`
  }
  return `${baseUrl}/quest/${questImg}.png`
}

export function getEquipmentPhotoUrl(id: string, equipmentType?: EquipmentType) {
  const baseUrl = process.env.NEXT_PUBLIC_OFFICIAL_ASSETS_BASE_URL
  const normalizedId = normalizeEquipmentId(id)
  if (!baseUrl) {
    throw new Error("NEXT_OFFICIAL_ASSETS_BASE_URL is not set")
  }
  if (id.startsWith("f_")) {
    return `${baseUrl}/assets/img/sp/assets/npc/m/${normalizedId}_01.jpg`
  }
  if (id.startsWith("party_main_") || id.startsWith("party_sub_")) {
    return `${baseUrl}/assets/img/sp/assets/summon/party_sub/${normalizedId}.jpg`
  }
  if (id.startsWith("ls_") || id.startsWith("m_")) {
    return `${baseUrl}/assets/img/sp/assets/weapon/m/${normalizedId}.jpg`
  }
  if (equipmentType) {
    switch (equipmentType) {
      case "chara":
        return `${baseUrl}/assets/img/sp/assets/npc/m/${normalizedId}_01.jpg`
      case "weapon":
        return `${baseUrl}/assets/img/sp/assets/weapon/m/${normalizedId}.jpg`
      case "summon":
        return `${baseUrl}/assets/img/sp/assets/summon/party_sub/${normalizedId}.jpg`
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
