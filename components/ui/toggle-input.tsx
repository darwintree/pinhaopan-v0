"use client"

import * as React from "react"
import { Info } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground mr-2">
            {enabled ? "已启用" : "未启用"}
          </span>
          <label 
            htmlFor={`${id}Toggle`} 
            className="relative inline-flex h-5 w-10 items-center rounded-full bg-slate-300 dark:bg-slate-700 cursor-pointer"
          >
            <input
              id={`${id}Toggle`}
              type="checkbox"
              className="peer sr-only"
              checked={enabled}
              onChange={onToggle}
            />
            <span className={`absolute mx-1 h-3 w-3 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </label>
        </div>
      </div>
      {enabled && children}
    </div>
  )
} 