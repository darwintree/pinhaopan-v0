import charaList from '@/public/list/chara.json'
import skinList from '@/public/list/skin.json'

interface CrewInfoMap {
  [key: string]: string[]
}

const crewInfoMap: CrewInfoMap = {}
for (const chara of charaList) {
  // set default if no crew
  if (!chara["character_id"]) {
    crewInfoMap[chara.character_id] = [chara.ID]
  } else {
    crewInfoMap[chara.character_id].push(chara.ID)
  }
}
for (const skin of skinList) {
  if (!skin["character_id"]) {
    crewInfoMap[skin.character_id] = [skin.ID]
  } else {
    crewInfoMap[skin.character_id].push(skin.ID)
  }
}

const skinIdList = skinList.map((skin) => skin.ID)

export { crewInfoMap, skinIdList }
