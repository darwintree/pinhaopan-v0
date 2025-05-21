"use client"

import type React from "react"

import { useState, useReducer, useMemo } from "react" // Added useMemo
import { Button } from "@/components/ui/button"
import { QuestSelector } from "@/components/input/quest-selector"
import { useQuestList } from "@/hooks/use-quest-list"
import { useEquipmentsList } from "@/hooks/use-equipments-list" // Added
import { GuidePostData, BoundingBox, EquipmentData } from "@/lib/types"
import { getEquipmentPhotoUrl } from "@/lib/utils" // Added
import { resizeImageWithAspectRatio, cropImage } from "@/lib/utils"
import { UsersIcon } from "@/components/icon/users-icon"
import { SwordIcon } from "@/components/icon/sword-icon"
import { SparklesIcon } from "@/components/icon/sparkles-icon" // Will be used for Friend Summon title
import { EquipmentSelectorModal } from "@/components/input/equipment-selector-modal" // Added
import { saveGuide } from "@/lib/remote-db"
import { isSkin } from "@/hooks/use-crew-info"
import { normalizeEquipmentId } from "@/lib/asset"
import { formReducer, GuideBasicInfoForm, initialFormState } from "@/components/publish/guide-basic-info-form"
import { GuideImageUploader } from "@/components/publish/guide-image-uploader"
import { validateDescription } from "@/lib/validation"

export function PublishGuide() {
  // Use reducer for form state
  const [formState, dispatch] = useReducer(formReducer, initialFormState);

  // Image upload states
  const [teamImages, setTeamImages] = useState<string[]>([])
  const [weaponImages, setWeaponImages] = useState<string[]>([])
  const [summonImages, setSummonImages] = useState<string[]>([])

  // Auto-recognize state (shared across all uploads)
  const [autoRecognize, setAutoRecognize] = useState(false)

  const [isPending, setIsPending] = useState(false)

  // Friend Summon State
  const [selectedFriendSummon, setSelectedFriendSummon] = useState<EquipmentData | undefined>(undefined);
  const [isFriendSummonModalOpen, setIsFriendSummonModalOpen] = useState(false);

  const [selectedQuest, setSelectedQuest] = useState<string>("")

  const { questList } = useQuestList()

  // Recognition results states
  const [charaResults, setCharaResults] = useState<Record<number, EquipmentData>>({})
  const [weaponResults, setWeaponResults] = useState<Record<number, EquipmentData>>({})
  const [summonResults, setSummonResults] = useState<Record<number, EquipmentData>>({})

  // Bounding Box states
  const [charaBoundingBox, setCharaBoundingBox] = useState<BoundingBox | null>(null);
  const [weaponBoundingBox, setWeaponBoundingBox] = useState<BoundingBox | null>(null);
  const [summonBoundingBox, setSummonBoundingBox] = useState<BoundingBox | null>(null);

  // Fetch summons for friend summon selector
  const { equipmentsList, loading: equipmentsLoading, error: equipmentsError } = useEquipmentsList();

  const friendSummonIds = useMemo(() => {
    if (equipmentsList && equipmentsList.summon) {
      return equipmentsList.summon
        .filter(s => s.tags && s.tags.includes("友召"))
        .map(s => s.id);
    }
    return [];
  }, [equipmentsList]);

  // Image upload configurations
  const uploadConfigs = [
    {
      type: "chara" as const,
      title: "角色图片上传",
      icon: <UsersIcon />,
      images: teamImages,
      setImages: setTeamImages,
      infoText: "上传一张包含所有角色的图片，系统将自动识别主体",
      onEquipmentsUpdate: setCharaResults,
      onBoundingBoxChange: setCharaBoundingBox
    },
    {
      type: "weapon" as const,
      title: "武器图片上传",
      icon: <SwordIcon />,
      images: weaponImages,
      setImages: setWeaponImages,
      infoText: "上传一张包含所有武器的图片，系统将自动识别主体",
      onEquipmentsUpdate: setWeaponResults,
      onBoundingBoxChange: setWeaponBoundingBox
    },
    {
      type: "summon" as const,
      title: "召唤石图片上传",
      icon: <SparklesIcon />,
      images: summonImages,
      setImages: setSummonImages,
      infoText: "上传一张包含所有召唤石的图片，系统将自动识别主体",
      onEquipmentsUpdate: setSummonResults,
      onBoundingBoxChange: setSummonBoundingBox
    }
  ]

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)

    try {
      validateDescription(formState.description)
      for (const linkError of formState.linkErrors) {
        if (linkError.trim() !== "") {
          throw new Error(linkError);
        }
      }
      // Validate required fields
      if (!selectedQuest) {
        throw new Error("请选择副本")
      }

      if (teamImages.length === 0) {
        throw new Error("请上传角色图片")
      }

      if (weaponImages.length === 0) {
        throw new Error("请上传武器图片")
      }

      if (summonImages.length === 0) {
        throw new Error("请上传召唤石图片")
      }

      // 1. Crop images if bounding box exists
      let charaBase64ToResize = teamImages[0];
      if (charaBoundingBox) {
        charaBase64ToResize = await cropImage(charaBase64ToResize, charaBoundingBox);
      }

      let weaponBase64ToResize = weaponImages[0];
      if (weaponBoundingBox) {
        weaponBase64ToResize = await cropImage(weaponBase64ToResize, weaponBoundingBox);
      }

      let summonBase64ToResize = summonImages[0];
      if (summonBoundingBox) {
        summonBase64ToResize = await cropImage(summonBase64ToResize, summonBoundingBox);
      }

      // 2. Resize potentially cropped images
      const resizedCharasBase64 = await resizeImageWithAspectRatio(charaBase64ToResize)
      const resizedWeaponsBase64 = await resizeImageWithAspectRatio(weaponBase64ToResize)
      const resizedSummonsBase64 = await resizeImageWithAspectRatio(summonBase64ToResize)

      // Get recognized equipment IDs
      const charas = Object.values(charaResults).filter(Boolean)
      const hasCharaSkin = charas.some((chara) => isSkin(normalizeEquipmentId(chara.id)))
      if (hasCharaSkin) {
        throw new Error("角色列表中存在皮肤，请手动选择对应角色")
      }
      const weapons = Object.values(weaponResults).filter(Boolean)
      const summons = Object.values(summonResults).filter(Boolean)

      // Prepare the data

      const filteredLinks = formState.links.filter(link => link.trim() !== ""); // Filter out empty links

      const postData: GuidePostData = {
        quest: selectedQuest,
        ...(formState.isTimeEnabled ? { time: formState.time } : {}),
        ...(formState.isTurnEnabled ? { turn: formState.turn } : {}),
        ...(formState.isContributionEnabled ? { contribution: formState.contribution } : {}),
        ...(formState.isButtonEnabled ? { button: { skill: formState.buttonSkill, summon: formState.buttonSummon } } : {}),
        description: formState.description,
        tags: formState.tags,
        ...(filteredLinks.length > 0 ? { links: filteredLinks } : {}), // Conditionally add links
        charas,
        charasBase64: resizedCharasBase64,
        weapons,
        weaponsBase64: resizedWeaponsBase64,
        summons,
        summonsBase64: resizedSummonsBase64,
        ...(selectedFriendSummon && { friendSummon: selectedFriendSummon }), // Add friend summon
      }

      console.log(postData)

      // 使用remote-db的saveGuide函数替代直接调用API
      const guideId = await saveGuide(postData)

      // Reset form on success
      dispatch({ type: 'RESET_FORM' });
      setTeamImages([])
      setWeaponImages([])
      setSummonImages([])
      setSelectedQuest("")
      setCharaResults({})
      setWeaponResults({})
      setSummonResults({})
      setCharaBoundingBox(null)
      setWeaponBoundingBox(null)
      setSummonBoundingBox(null)
      setSelectedFriendSummon(undefined) // Reset friend summon

      // Show success message
      alert("配置发布成功！")

    } catch (error) {
      // Show error message
      alert(error instanceof Error ? error.message : "发布失败，请重试")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
      <QuestSelector
        selectedQuest={selectedQuest}
        onQuestSelect={setSelectedQuest}
      />

      <GuideBasicInfoForm
        formState={formState}
        dispatch={dispatch}
        selectedQuest={selectedQuest}
        questList={questList}
      />

      <GuideImageUploader
        uploadConfigs={uploadConfigs}
        autoRecognize={autoRecognize}
        setAutoRecognize={setAutoRecognize}
      />

      {/* Friend Summon Selector UI */}
      <div className="space-y-4 p-4 border rounded-md">
        <h3 className="text-lg font-medium flex items-center">
          <SparklesIcon className="w-5 h-5 mr-2" />
          选择友召（可选）
        </h3>
        {selectedFriendSummon ? (
          <div className="flex items-center space-x-4 p-2 border rounded-md">
            <img
              src={getEquipmentPhotoUrl(selectedFriendSummon.id, "summon")}
              alt={equipmentsList?.summon?.find(s => s.id === selectedFriendSummon.id)?.name || selectedFriendSummon.id}
              className="w-16 h-16 object-contain border rounded"
            />
            <div className="flex-grow">
              <p className="font-semibold">
                {equipmentsList?.summon?.find(s => s.id === selectedFriendSummon.id)?.name || "未知召唤"}
              </p>
              <p className="text-xs text-gray-500">{selectedFriendSummon.id}</p>
            </div>
            <Button variant="outline" onClick={() => setSelectedFriendSummon(undefined)}>清除</Button>
            <Button onClick={() => setIsFriendSummonModalOpen(true)}>更换</Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setIsFriendSummonModalOpen(true)}>选择友召</Button>
        )}
        <EquipmentSelectorModal
          type="summon"
          open={isFriendSummonModalOpen}
          onOpenChange={setIsFriendSummonModalOpen}
          onSelect={(equipment) => {
            setSelectedFriendSummon(equipment);
            // setIsFriendSummonModalOpen(false); // Modal usually closes itself
          }}
          priorityIds={friendSummonIds}
        />
        {equipmentsLoading && <p>加载召唤石列表中...</p>}
        {equipmentsError && <p className="text-red-500">加载召唤石列表失败: {equipmentsError.message}</p>}
      </div>

      <div className="flex justify-center mt-8">
        <Button type="submit" size="lg" className="px-8 relative group">
          <span className={isPending ? "invisible" : ""}>发布配置</span>
          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          )}
        </Button>
      </div>
    </form>
  )
}

