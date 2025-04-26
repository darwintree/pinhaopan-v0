"use client"

import * as React from "react"
import { Info } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"

export interface ToggleInputProps {
  id: string
  label: string
  tooltipText?: string
  enabled: boolean
  onToggle: () => void
  children?: React.ReactNode
}

export function ToggleInput({
  id,
  label,
  tooltipText,
  enabled,
  onToggle,
  children
}: ToggleInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="flex items-center gap-2">
          {label}
          {tooltipText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tooltipText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </Label>
        <Switch 
          id={id} 
          checked={enabled} 
          onCheckedChange={onToggle} 
        />
      </div>
      {enabled && children}
    </div>
  )
} 