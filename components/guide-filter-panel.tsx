import React, { useState } from 'react'; // Added useState
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Clock,
  Calendar,
  Sword,
  X,
  Plus,
  Users,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/selector/date-range-picker";
import type { UseGuideFiltersReturn } from "@/hooks/useGuideFilters"; // Import the hook return type
import type { EquipmentFilterCondition, DetailedEquipmentData, EquipmentType } from "@/lib/types"; // Keep this if needed by EquipmentSelector etc. Added DetailedEquipmentData, EquipmentType
import { TagSelector } from "@/components/selector/tag-selector";
import { ToggleInput } from "@/components/ui/toggle-input";
import { EquipmentConditionCard } from './equipment-condition-card'; // Import the new card component
import { SparklesIcon } from '@/components/icon/sparkles-icon'; // Import the summon icon
import { EquipmentSelectorModal } from '@/components/selector/equipment-selector-modal'; // Import the modal

// Helper functions moved here
const getTimeScaleConfig: (scale: "small" | "medium" | "large") => {
  max: number;
  step: number;
} = (scale: "small" | "medium" | "large") => {
  switch (scale) {
    case "small":
      return { max: 600, step: 5 };
    case "medium":
      return { max: 1800, step: 30 };
    case "large":
      return { max: 5400, step: 60 };
    default:
      return { max: 600, step: 5 };
  }
};
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Define Props interface based on the hook's return type
// Remove specific open states, use unified isPanelOpen
interface GuideFilterPanelProps extends Omit<UseGuideFiltersReturn, 'filters' | 'handlers'> {
  filters: Omit<UseGuideFiltersReturn['filters'], 'basicFilterOpen' | 'timeFilterOpen' | 'configFilterOpen'> & {
    isPanelOpen: boolean;
  };
  handlers: Omit<UseGuideFiltersReturn['handlers'], 'setBasicFilterOpen' | 'setTimeFilterOpen' | 'setConfigFilterOpen'> & {
    setIsPanelOpen: (isOpen: boolean) => void;
  };
  filterCount: number;
}

export function GuideFilterPanel({
  filters,
  handlers,
  filterCount,
}: GuideFilterPanelProps) {
  // State for the add condition modal
  const [isAddConditionModalOpen, setIsAddConditionModalOpen] = useState(false);
  const [addConditionModalType, setAddConditionModalType] = useState<EquipmentType | null>(null);

  // Function to open the modal
  const openAddConditionModal = (type: EquipmentType) => {
    setAddConditionModalType(type);
    setIsAddConditionModalOpen(true);
  };

  // Function to handle selection from the modal and add the condition
  const handleAddNewCondition = (equipment: DetailedEquipmentData) => {
    if (!addConditionModalType) return; // Should not happen, but safety check

    switch (addConditionModalType) {
      case 'weapon':
        handlers.handleAddWeaponCondition(equipment);
        break;
      case 'summon':
        handlers.handleAddSummonCondition(equipment);
        break;
      case 'chara':
        handlers.handleAddCharaCondition(equipment);
        break;
      default:
        console.error("Unknown type for adding condition:", addConditionModalType);
    }
    // No need to call setIsAddConditionModalOpen(false) here as onOpenChange in modal handles it
  };

  // Define the configuration for condition sections
  const conditionSectionsConfig = [
    {
      key: 'weapon',
      title: '武器条件',
      icon: Sword, // Lucide icon component
      conditions: filters.selectedWeaponConditions,
      addConditionHandler: () => openAddConditionModal('weapon'), // Use the modal opener
      removeConditionHandler: handlers.handleRemoveWeaponCondition,
      updateConditionHandler: handlers.handleUpdateWeaponCondition,
      type: 'weapon' as const, // Ensure literal type
      showCountSelector: true,
      emptyStateMessage: '点击"添加条件"按钮来创建武器筛选条件'
    },
    {
      key: 'summon',
      title: '召唤石条件',
      icon: SparklesIcon, // Use the imported SparklesIcon
      conditions: filters.selectedSummonConditions,
      addConditionHandler: () => openAddConditionModal('summon'), // Use the modal opener
      removeConditionHandler: handlers.handleRemoveSummonCondition,
      updateConditionHandler: handlers.handleUpdateSummonCondition,
      type: 'summon' as const,
      showCountSelector: false,
      emptyStateMessage: '点击"添加条件"按钮来创建召唤石筛选条件'
    },
    {
      key: 'chara',
      title: '角色条件',
      icon: Users, // Lucide icon component
      conditions: filters.selectedCharaConditions,
      addConditionHandler: () => openAddConditionModal('chara'), // Use the modal opener
      removeConditionHandler: handlers.handleRemoveCharaCondition,
      updateConditionHandler: handlers.handleUpdateCharaCondition,
      type: 'chara' as const,
      showCountSelector: false,
      emptyStateMessage: '点击"添加条件"按钮来创建角色筛选条件'
    }
  ];

  // Helper to generate filter summary based on current filters
  const getFilterSummary = () => {
    const summaries: string[] = [];

    // Tag filter summary
    if (filters.selectedTags.length > 0) {
      summaries.push(`标签(${filters.selectedTags.length})`);
    }

    // Time filter summary
    if (filters.timeFilterEnabled) {
      summaries.push(
        `消耗时间: ${formatTime(filters.timeRange[0])}-${formatTime(
          filters.timeRange[1]
        )}`
      );
    }

    // Date range summary
    if (filters.dateRange?.from || filters.dateRange?.to) {
      summaries.push("发布时间筛选");
    }

    // Equipment filter summaries
    if (filters.selectedWeaponConditions.length > 0) {
      summaries.push(`武器(${filters.selectedWeaponConditions.length})`);
    }

    if (filters.selectedSummonConditions.length > 0) {
      summaries.push(`召唤石(${filters.selectedSummonConditions.length})`);
    }

    if (filters.selectedCharaConditions.length > 0) {
      summaries.push(`角色(${filters.selectedCharaConditions.length})`);
    }

    return summaries;
  };

  // Get the filter summary for display
  const filterSummary = getFilterSummary();

  return (
    <Card className="overflow-hidden backdrop-blur-lg bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-700/50 shadow-sm">
      {/* Header - always visible */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer border-b border-slate-200/50 dark:border-slate-700/50"
        onClick={() => {
          // Toggle unified panel state
          handlers.setIsPanelOpen(!filters.isPanelOpen);
        }}
      >
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">筛选条件</h2>
          {/* Use filterCount from props */}
          {filterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {filterCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Use filterCount and handler from props */}
          {filterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handlers.handleResetFilters();
              }}
            >
              <X className="mr-2 h-4 w-4" />
              重置
            </Button>
          )}
          <Button variant="ghost" size="sm">
            {/* Use unified panel state for icon */}
            {filters.isPanelOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Summary panel - shown when collapsed (uses !isPanelOpen) */}
      {!filters.isPanelOpen && filterCount > 0 && (
          <div className="p-4 flex flex-wrap gap-2">
            {filterSummary.map((summary, index) => (
              <Badge
                key={index}
                variant="outline"
                className="bg-slate-100/70 dark:bg-slate-800/70 px-3 py-1"
              >
                {summary}
              </Badge>
            ))}
          </div>
        )}

      {/* Filter content - shown when expanded (uses isPanelOpen) */}
      {filters.isPanelOpen && (
        <CardContent className="p-0">
          {/* Tag filter section */}
          <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">标签筛选</h3>
              {/* Use state from props */}
              {filters.selectedTags.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {filters.selectedTags.length}
                </Badge>
              )}
            </div>
            <TagSelector
              selectedTags={filters.selectedTags}
              onTagSelect={handlers.handleTagSelect}
            />
          </div>

          {/* Time filter section */}
          <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">时间筛选</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <ToggleInput
                  id="timeFilter"
                  label="消耗时间"
                  tooltipText="按完成副本所需时间筛选"
                  enabled={filters.timeFilterEnabled}
                  onToggle={handlers.handleTimeFilterToggle}
                >
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm text-muted-foreground">
                        {formatTime(filters.timeRange[0])} -{" "}
                        {formatTime(filters.timeRange[1])}
                      </span>
                    </div>
                    <Select
                      value={filters.timeScale}
                      onValueChange={handlers.handleTimeScaleChange}
                    >
                      <SelectTrigger className="w-[110px] h-8">
                        <SelectValue placeholder="时间范围" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">0-10分钟</SelectItem>
                        <SelectItem value="medium">0-30分钟</SelectItem>
                        <SelectItem value="large">0-90分钟</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Slider
                    max={getTimeScaleConfig(filters.timeScale).max}
                    step={getTimeScaleConfig(filters.timeScale).step}
                    value={filters.timeRange}
                    onValueChange={handlers.handleTimeRangeChange}
                    className="mt-2"
                  />
                </ToggleInput>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  发布时间
                </Label>
                <DateRangePicker
                  date={filters.dateRange}
                  setDate={handlers.setDateRange}
                />
              </div>
            </div>
          </div>

          {/* Equipment filter section */}
          <div className="p-4">
            <div className="mb-4">
              <h3 className="font-medium mb-3">配置筛选</h3>
              {/* Map over the configuration array to render sections dynamically */}
              {conditionSectionsConfig.map((section, sectionIndex) => (
                <React.Fragment key={section.key}>
                  <div className="space-y-4 mb-4">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <section.icon className="h-4 w-4" /> {/* Render the icon component */}
                        {section.title}
                        {section.conditions.length > 0 && (
                          <Badge variant="secondary" className="ml-1">
                            {section.conditions.length}
                          </Badge>
                        )}
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={section.addConditionHandler}
                        className="h-8"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        添加条件
                      </Button>
                    </div>
                    {section.conditions.length === 0 ? (
                      <div className="text-sm text-muted-foreground italic">
                        {section.emptyStateMessage}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {/* Use state and handlers from props */} 
                        {/* Use the new EquipmentConditionCard component */}                       
                        {section.conditions.map((condition: EquipmentFilterCondition, index: number) => (
                          <EquipmentConditionCard
                            key={`${section.key}-${index}`} // Use a more specific key
                            condition={condition}
                            index={index}
                            type={section.type}
                            showCountSelector={section.showCountSelector}
                            onUpdate={section.updateConditionHandler} // Pass the correct update handler
                            onRemove={section.removeConditionHandler} // Pass the correct remove handler
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Add Separator between sections, but not after the last one */}
                  {sectionIndex < conditionSectionsConfig.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </React.Fragment>
              ))}
            </div>
            {/* Condition explanation */}
            <div className="text-xs text-muted-foreground bg-slate-100/50 dark:bg-slate-800/50 p-2 rounded-md mt-2">
              <p>所有条件使用AND逻辑（全部满足）。例如：</p>
              <ul className="list-disc list-inside mt-1">
                <li>包含3把光剑 + 排除暗刀 = 必须有3把光剑且不能有暗刀</li>
                <li>
                  包含巴哈姆特 + 排除路西法 = 必须有巴哈姆特且不能有路西法
                </li>
                <li>包含水狗 + 排除火狐 = 必须有水狗且不能有火狐</li>
              </ul>
            </div>
          </div>
        </CardContent>
      )}

      {/* Add Condition Modal Instance */}
      {addConditionModalType && (
        <EquipmentSelectorModal
          open={isAddConditionModalOpen}
          onOpenChange={setIsAddConditionModalOpen}
          type={addConditionModalType} 
          onSelect={handleAddNewCondition}
          priorityIds={[]}
        />
      )}
    </Card>
  );
}
