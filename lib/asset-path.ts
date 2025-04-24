import { normalizeEquipmentId } from "./asset";
import { EquipmentType } from "./types";
import categoryList from "@/public/list/category.json";

export function getGuidePhotoUrl(guideId: string, equipmentType: EquipmentType) {
  const baseUrl = process.env.NEXT_PUBLIC_UPLOAD_IMG_BASE_URL
  return `${baseUrl}/${equipmentType}s/${guideId}_${equipmentType}s.png`
}

export function getGuidePhotoThumbUrl(guideId: string, equipmentType: EquipmentType) {
  const baseUrl = process.env.NEXT_PUBLIC_UPLOAD_IMG_BASE_URL
  return `${baseUrl}/${equipmentType}s/${guideId}_${equipmentType}s_thumb.png`
}

export function getCategoryUrl(categoryId: string | undefined) {
  const category = categoryList.find(category => category.category_id === categoryId)
  const baseUrl = process.env.NEXT_PUBLIC_ASSETS_BASE_URL
  const officialAssetsBaseUrl = process.env.NEXT_PUBLIC_OFFICIAL_ASSETS_BASE_URL
  if (!category) {
    return `${baseUrl}/placeholder.svg`
  }
  if (category.official_image) {
    return `${officialAssetsBaseUrl}/assets/img/sp/lobby/room_index/thumb/${category.official_image}.png`
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
