"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { NumberInput } from "./number-input"

interface ContributionInputProps {
  id: string
  label?: string // Made optional as ToggleInput provides the main label
  tooltipText?: string
  value: number // Actual value (e.g., 1,000,000)
  onChange: (newValue: number) => void
  className?: string
  disabled?: boolean // Add disabled prop
}

const UNIT = 10000
const UNIT_LABEL = "万"

export function ContributionInput({
  id,
  label,
  tooltipText,
  value,
  onChange,
  className,
  disabled = false, // Default to false
}: ContributionInputProps) {
  // New handler to bridge NumberInput's onChange to ContributionInput's onChange
  const handleNumberChange = (numericValue: number | null) => {
    if (numericValue === null || isNaN(numericValue)) {
      onChange(0) // Treat null/invalid as 0 contribution
    } else {
      onChange(numericValue * UNIT) // Multiply by unit
    }
  }

  // Calculate the value to pass to NumberInput (the displayed part)
  const numberInputValue = React.useMemo(() => {
    if (value === 0 || value === null || value === undefined || isNaN(value) || value % UNIT !== 0) {
        // If value is 0, invalid, or not a clean multiple, display nothing in NumberInput
        // Or potentially handle non-multiples? For now, clear it.
      return null 
    }
    return value / UNIT
  }, [value])

  return (
    <div className={cn("space-y-1", className)}>
      {label && ( // Conditionally render label
        <Label htmlFor={id} className="flex items-center gap-1 text-xs text-muted-foreground">
          {label}
          {tooltipText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tooltipText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </Label>
      )}
      <div className="flex items-center gap-2">
        <NumberInput
          id={id}
          value={numberInputValue} // Pass the calculated value (e.g., 100)
          onChange={handleNumberChange} // Use the new handler
          inputClassName="text-center flex-1" // Pass specific class to input
          placeholder="0"
          disabled={disabled}
          allowDecimal={false} // Contribution is likely whole numbers of '万'
          showStepButtons={false}
        />
        <span className="text-sm text-muted-foreground">{UNIT_LABEL}</span>
      </div>
    </div>
  )
} 