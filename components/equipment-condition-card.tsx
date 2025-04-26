import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { EquipmentSelector } from "@/components/input/equipment-selector";
import type { EquipmentFilterCondition } from "@/lib/types"; // Import the type

// Define Props interface
interface EquipmentConditionCardProps {
  condition: EquipmentFilterCondition;
  index: number;
  type: "weapon" | "summon" | "chara";
  showCountSelector: boolean;
  onUpdate: (index: number, field: keyof EquipmentFilterCondition | 'include', value: any) => void;
  onRemove: (index: number) => void;
}

export function EquipmentConditionCard({
  condition,
  index,
  type,
  showCountSelector,
  onUpdate,
  onRemove,
}: EquipmentConditionCardProps) {
  const handleIncludeChange = (value: string) => {
    onUpdate(index, 'include', value === 'include');
  };

  const handleEquipmentSelect = (equipment: { id: string; name?: string }) => {
    onUpdate(index, 'id', equipment.id);
  };

  const handleCountChange = (value: string) => {
    onUpdate(index, 'count', parseInt(value, 10)); // Ensure value is parsed as number
  };

  const handleRemoveClick = () => {
    onRemove(index);
  };

  return (
    <div className="flex flex-col gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-2 rounded-md">
      <div className="flex items-center gap-2">
        <Select
          value={condition.include ? "include" : "exclude"}
          onValueChange={handleIncludeChange}
        >
          <SelectTrigger className="w-24 h-8">
            <SelectValue placeholder="类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="include">包含</SelectItem>
            <SelectItem value="exclude">排除</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRemoveClick}
          className="h-8 w-8 ml-auto"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <EquipmentSelector
        // Pass a unique key if possible, or use index combined with type
        key={`${type}-${index}-${condition.id || 'new'}`}
        index={index + 1} // Keep index 1-based for display if needed
        type={type}
        label={
          condition.include
            ? showCountSelector ? `需要${condition.count}把` : '需要'
            : "排除"
        }
        rectangle={{ width: 160, height: 100 }}
        recognizedEquipments={
          condition.id
            ? [{ id: condition.id, confidence: 1 }]
            : undefined
        }
        onEquipmentSelect={handleEquipmentSelect}
        isHovered={false} // Assuming these are not needed for this component directly
        onMouseEnter={() => {}} // Or manage hover state if required later
        onMouseLeave={() => {}}
      />
      {/* Conditional rendering for count selector */}
      {showCountSelector && condition.include && (
        <Select
          value={condition.count.toString()}
          onValueChange={handleCountChange}
        >
          <SelectTrigger className="w-full h-8">
            <SelectValue placeholder="数量" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 11 }, (_, i) => i).map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num} 把
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
} 