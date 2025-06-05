"use client"

import { useState } from "react";
import { EquipmentSelectorModal } from "@/components/input/equipment-selector-modal"
import { getSameCrewNonSkinIdList, isSkin } from "@/hooks/use-crew-info"
import { getEquipmentPhotoUrl, getAwakenIconUrl } from "@/lib/asset-path"
import { normalizeEquipmentId } from "@/lib/asset"
import { EquipmentType, EquipmentData } from "@/lib/types"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEquipmentsList } from "@/hooks/use-equipments-list";
import { imageSizes } from "@/lib/utils";
import { NumberInput } from "@/components/input/number-input";

interface EquipmentSelectorProps {
  width?: number
  height?: number
  rectangle: { width: number; height: number }
  recognizedEquipments?: { id: string; confidence: number }[]
  type: EquipmentType,
  selectedEquipment?: EquipmentData,
  onEquipmentSelect: (equipment: EquipmentData) => void
  isHovered: boolean
  isActive?: boolean
  displayDeleteButton?: boolean
  disabled?: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onDelete?: () => void
}

export function EquipmentSelector({
  width = 60,
  height,
  rectangle,
  recognizedEquipments,
  type,
  selectedEquipment,
  onEquipmentSelect,
  isHovered,
  isActive = false,
  displayDeleteButton = true,
  onMouseEnter,
  onMouseLeave,
  onDelete,
  disabled = false,
}: EquipmentSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);


  const handleEquipmentSelect = (equipment: EquipmentData) => {
    onEquipmentSelect(equipment)
  }

  const { equipmentsList, loading, error } = useEquipmentsList();

  function getAspectRatio(type: EquipmentType) {
    switch (type) {
      case "chara":
        return imageSizes["weapon/normal"][1] / imageSizes["weapon/normal"][0]
      case "weapon":
        return imageSizes["weapon/normal"][1] / imageSizes["weapon/normal"][0]
      case "summon":
        return imageSizes["summon/party_sub"][1] / imageSizes["summon/party_sub"][0]
      default:
        return 1
    }
  }
  const calculatedHeight = height || width * getAspectRatio(type)
  const detailedEquipmentData = equipmentsList[type].find(
    (item) => item.id === normalizeEquipmentId(selectedEquipment?.id || '0')
  );
  const currentAwakenValue = selectedEquipment?.properties?.awaken;

  let priorityIds = recognizedEquipments?.map(item => normalizeEquipmentId(item.id)) || []
  let equipmentIsSkin = false
  if (type === "chara") {
    if (!selectedEquipment && recognizedEquipments?.[0]?.id) {
      selectedEquipment = {
        id: recognizedEquipments[0].id,
        type: type,
      };
    }
    if (selectedEquipment) {
      const normalizedId = normalizeEquipmentId(selectedEquipment.id)
      priorityIds = priorityIds?.concat(
        getSameCrewNonSkinIdList(normalizedId)
      )
      equipmentIsSkin = isSkin(normalizedId)
    }
  }

  const awakenOptions = detailedEquipmentData?.awaken;

  const handleAwakenChange = (newAwakenValue: string) => {
    if (!selectedEquipment) {
      console.warn("No equipment selected, cannot set awaken level.");
      return;
    }
    const updatedEquipment: EquipmentData = {
      ...selectedEquipment,
      properties: {
        ...(selectedEquipment.properties || {}),
        awaken: newAwakenValue === "" ? undefined : newAwakenValue,
      },
    };
    onEquipmentSelect(updatedEquipment);
  };

  const currentLvValue = selectedEquipment?.properties?.lv;

  const handleLvChange = (newLvValue: number | null) => {
    if (!selectedEquipment) {
      console.warn("No equipment selected, cannot set level.");
      return;
    }
    const updatedEquipment: EquipmentData = {
      ...selectedEquipment,
      properties: {
        ...(selectedEquipment.properties || {}),
        lv: newLvValue === null ? undefined : newLvValue,
      },
    };
    onEquipmentSelect(updatedEquipment);
  };


  return (
    <div
      className={`flex flex-col items-center ${
        equipmentIsSkin
          ? "bg-red-100 dark:bg-red-900/30 rounded-lg p-1"
          : isActive
          ? "bg-blue-100 dark:bg-blue-900/30 rounded-lg p-1"
          : isHovered
          ? "bg-green-100 dark:bg-green-900/20 rounded-lg p-1"
          : "p-1"
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className="relative mb-1 overflow-hidden"
        style={{
          width: `${width}px`,
          height: `${calculatedHeight}px`,
        }}
      >
        {!!selectedEquipment ? (
          <img
            src={getEquipmentPhotoUrl(selectedEquipment?.id || "", type)}
            alt={selectedEquipment?.id || ""}
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : (
          <img
            src={`/placeholder.svg?height=${rectangle.height}&width=${rectangle.width}`}
            alt={type}
            className="absolute inset-0 w-full h-full object-contain"
          />
        )}
        {selectedEquipment?.properties?.awaken && (
          <img
            src={getAwakenIconUrl(selectedEquipment.properties.awaken)}
            alt={`Awaken: ${selectedEquipment.properties.awaken}`}
            className="absolute top-0 left-0 w-5 h-5 z-10"
            title={`Awaken: ${selectedEquipment.properties.awaken}`}
          />
        )}

        {!disabled && displayDeleteButton && onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-0 right-0 bg-red-500/90 text-white p-0.5 rounded-bl-md hover:bg-red-600"
            title="删除"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      {/* Awaken Level Selector */}
      {!disabled && detailedEquipmentData && awakenOptions && awakenOptions.length > 0 && (
        <div className="mb-2 w-full px-1">
          <Select
            value={currentAwakenValue || ""}
            onValueChange={handleAwakenChange}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="觉醒" />
            </SelectTrigger>
            <SelectContent>
              {awakenOptions.map((option) => (
                <SelectItem key={option} value={option} className="text-xs">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {!disabled && (
        <div className="mb-2 w-full px-1">
          <NumberInput
            id={`lv-${type}`}
            value={currentLvValue ?? null}
            onChange={handleLvChange}
            placeholder="Lv"
            min={1}
            max={200}
            inputClassName="text-center text-xs"
            allowDecimal={false}
            showStepButtons={false}
          />
        </div>
      )}
      {!disabled && (
        <Button
          type="button"
          variant={equipmentIsSkin ? "default" : "secondary"}
          size="xs"
          onClick={() => setIsModalOpen(true)}
        >
          {equipmentIsSkin
            ? "必须重选"
            : recognizedEquipments?.length
            ? "手动选择"
            : "未识别"}
        </Button>)
      }

      <EquipmentSelectorModal
        type={type}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSelect={handleEquipmentSelect}
        priorityIds={priorityIds}
      />
    </div>
  );
}
