import charaList from '@/public/list/chara.json'
import skinList from '@/public/list/skin.json'

interface CrewInfoMap {
  [key: string]: string[]
}

const crewInfoMap: CrewInfoMap = {}
for (const card of charaList) {
  // set default if no crew
  const crewId = card["character_id"]
  if (!crewId) {
    continue
  }
  if (!crewInfoMap[crewId]) {
    crewInfoMap[crewId] = []
  }
  crewInfoMap[crewId].push(card.ID)
}


export const getSameCrewNonSkinIdList = (normalizedId: string) => {
  const skin = (skinList as any[]).concat(charaList as any[]).find((skin) => skin.ID === normalizedId)
  if (!skin) {
    return []
  }
  return crewInfoMap[skin.character_id]
}

export const isSkin = (normalizedId: string) => {
  const skin = skinList.find((skin) => skin.ID === normalizedId)
  return skin !== undefined
}
