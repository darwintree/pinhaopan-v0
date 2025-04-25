import { useState, useEffect, useCallback, useRef } from "react"
import type { DateRange } from "react-day-picker"
import type { EquipmentFilterCondition, DetailedEquipmentData, EquipmentType } from "@/lib/types"

// Helper function (can be moved to a utils file later if needed)
const getTimeScaleConfig = (scale: "small" | "medium" | "large"): { max: number, step: number } => {
  switch (scale) {
    case "small": return { max: 600, step: 5 }
    case "medium": return { max: 1800, step: 30 }
    case "large": return { max: 5400, step: 60 }
    default: return { max: 600, step: 5 }
  }
}

interface UseGuideFiltersProps {
  resetPage: () => void;
}

export function useGuideFilters({ resetPage }: UseGuideFiltersProps) {
  // Unified panel open state
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  // Filter states
  const [timeFilterEnabled, setTimeFilterEnabled] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 600])
  const [debouncedTimeRange, setDebouncedTimeRange] = useState<[number, number]>([0, 600])
  const [timeScale, setTimeScale] = useState<"small" | "medium" | "large">("small")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [selectedWeaponConditions, setSelectedWeaponConditions] = useState<EquipmentFilterCondition[]>([])
  const [selectedSummonConditions, setSelectedSummonConditions] = useState<EquipmentFilterCondition[]>([])
  const [selectedCharaConditions, setSelectedCharaConditions] = useState<EquipmentFilterCondition[]>([])

  // --- Filter Update Handlers (with page reset) ---
  const handleTagSelect = useCallback((tags: string[]) => {
    setSelectedTags(tags)
    resetPage()
  }, [resetPage])

  const handleTimeFilterToggle = useCallback(() => {
    setTimeFilterEnabled(prev => !prev)
    resetPage()
  }, [resetPage])

  const handleTimeRangeChange = useCallback((value: [number, number]) => {
    // Only update state, debouncing is handled by useEffect
    setTimeRange(value)
  }, [])

  const handleTimeScaleChange = useCallback((value: "small" | "medium" | "large") => {
    setTimeScale(value)
    const { max } = getTimeScaleConfig(value)
    // Reset time range when scale changes
    setTimeRange([0, max])
    // Since timeRange changes, the debounce effect will handle resetPage
  }, []) // No resetPage here directly, handled by debounce

  const handleAddWeaponCondition = useCallback((equipment: DetailedEquipmentData) => {
    const newCondition: EquipmentFilterCondition = {
      type: "weapon",
      id: equipment.id,
      include: true,
      count: 1
    };
    setSelectedWeaponConditions(prev => [...prev, newCondition])
    resetPage()
  }, [resetPage])

  const handleUpdateWeaponCondition = useCallback((index: number, field: keyof EquipmentFilterCondition, value: any) => {
    setSelectedWeaponConditions(prev => {
      const updated = [...prev]
      // Ensure count is stored as a number if updated
      const newValue = field === 'count' ? Number.parseInt(value) : value;
      updated[index] = { ...updated[index], [field]: newValue }
      return updated
    })
    resetPage()
  }, [resetPage])


  const handleRemoveWeaponCondition = useCallback((index: number) => {
    setSelectedWeaponConditions(prev => prev.filter((_, i) => i !== index))
    resetPage()
  }, [resetPage])

  const handleAddSummonCondition = useCallback((equipment: DetailedEquipmentData) => {
    const newCondition: EquipmentFilterCondition = {
      type: "summon",
      id: equipment.id,
      include: true,
      count: 1 // Summons typically don't have count, but keep consistent for type
    };
    setSelectedSummonConditions(prev => [...prev, newCondition])
    resetPage()
  }, [resetPage])

  const handleUpdateSummonCondition = useCallback((index: number, field: keyof EquipmentFilterCondition, value: any) => {
    setSelectedSummonConditions(prev => {
      const updated = [...prev]
      // Ensure count is stored as a number if updated
      const newValue = field === 'count' ? Number.parseInt(value) : value;
      updated[index] = { ...updated[index], [field]: newValue }
      return updated
    })
    resetPage()
  }, [resetPage])

  const handleRemoveSummonCondition = useCallback((index: number) => {
    setSelectedSummonConditions(prev => prev.filter((_, i) => i !== index))
    resetPage()
  }, [resetPage])

  const handleAddCharaCondition = useCallback((equipment: DetailedEquipmentData) => {
    const newCondition: EquipmentFilterCondition = {
      type: "chara",
      id: equipment.id,
      include: true,
      count: 1 // Characters typically don't have count, but keep consistent for type
    };
    setSelectedCharaConditions(prev => [...prev, newCondition])
    resetPage()
  }, [resetPage])

  const handleUpdateCharaCondition = useCallback((index: number, field: keyof EquipmentFilterCondition, value: any) => {
    setSelectedCharaConditions(prev => {
      const updated = [...prev]
      // Ensure count is stored as a number if updated
      const newValue = field === 'count' ? Number.parseInt(value) : value;
      updated[index] = { ...updated[index], [field]: newValue }
      return updated
    })
    resetPage()
  }, [resetPage])

  const handleRemoveCharaCondition = useCallback((index: number) => {
    setSelectedCharaConditions(prev => prev.filter((_, i) => i !== index))
    resetPage()
  }, [resetPage])

  const handleResetFilters = useCallback(() => {
    setSelectedTags([])
    setTimeFilterEnabled(false)
    setTimeRange([0, 600]) // Reset to initial scale max
    setTimeScale("small")
    setDateRange(undefined)
    setSelectedWeaponConditions([])
    setSelectedSummonConditions([])
    setSelectedCharaConditions([])
    // Reset panel open state? No, keep it as the user left it.
    resetPage()
  }, [resetPage])

  // Filter count calculation
  const filterCount = [
    selectedTags.length > 0,
    timeFilterEnabled && (timeRange[0] !== 0 || timeRange[1] !== getTimeScaleConfig(timeScale).max),
    dateRange?.from !== undefined || dateRange?.to !== undefined,
    selectedWeaponConditions.length > 0,
    selectedSummonConditions.length > 0,
    selectedCharaConditions.length > 0,
  ].filter(Boolean).length

  // Debounce time range changes
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only update and reset page if the debounced value actually changes
      if (timeRange[0] !== debouncedTimeRange[0] || timeRange[1] !== debouncedTimeRange[1]) {
        setDebouncedTimeRange(timeRange)
        resetPage()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [timeRange, debouncedTimeRange, resetPage])

  // Effect to reset page when dateRange changes *after initial mount*
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      if (dateRange !== undefined) { // Or a more sophisticated check if needed
        resetPage();
      }
    }
  }, [dateRange, resetPage]);


  return {
    filters: {
      isPanelOpen, // Add new state
      timeFilterEnabled,
      selectedTags,
      timeRange,
      debouncedTimeRange,
      timeScale,
      dateRange,
      selectedWeaponConditions,
      selectedSummonConditions,
      selectedCharaConditions,
    },
    handlers: {
      setIsPanelOpen, // Add new handler
      handleTagSelect,
      handleTimeFilterToggle,
      handleTimeRangeChange,
      handleTimeScaleChange,
      setDateRange, // Pass the original setState for DateRangePicker
      handleAddWeaponCondition,
      handleUpdateWeaponCondition,
      handleRemoveWeaponCondition,
      handleAddSummonCondition,
      handleUpdateSummonCondition,
      handleRemoveSummonCondition,
      handleAddCharaCondition,
      handleUpdateCharaCondition,
      handleRemoveCharaCondition,
      handleResetFilters,
    },
    filterCount,
  }
}

export type UseGuideFiltersReturn = ReturnType<typeof useGuideFilters>; // Export the return type 