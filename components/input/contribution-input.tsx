"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

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
  // Internal state for the displayed value (e.g., "100")
  const [displayValue, setDisplayValue] = React.useState<string>("")

  // Update display value when the actual value prop changes from outside
  React.useEffect(() => {
    if (value === 0) {
      setDisplayValue("") // Show empty for 0
    } else if (value % UNIT === 0) {
      // Only update if it's a multiple of UNIT or 0 to avoid weird rounding displays
      setDisplayValue((value / UNIT).toString())
    } else {
       // If the initial value is not a multiple of UNIT, display it directly
       // but this might be confusing. Consider rounding or clearing.
       // For now, let's display the raw number divided by UNIT, potentially with decimals.
       // Or maybe clear it to force user input in the correct format? Let's clear for now.
       // setDisplayValue((value / UNIT).toFixed(2)); // Alternative: show decimals
       setDisplayValue("") // Clear if not a clean multiple
    }
  }, [value])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = event.target.value
    // Allow only numbers and potentially a single decimal point if we wanted fractions of '万'
    const filteredInput = rawInput.replace(/[^0-9]/g, '') 
    
    setDisplayValue(filteredInput)

    // Calculate the actual value and call onChange
    const numericValue = parseInt(filteredInput, 10)
    if (!isNaN(numericValue)) {
      onChange(numericValue * UNIT)
    } else if (filteredInput === "") {
      // Handle empty input - treat as 0 contribution
      onChange(0)
    }
  }

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
        <Input
          id={id}
          type="text" // Use text to allow empty string and control formatting
          inputMode="numeric" // Hint for mobile keyboards
          pattern="[0-9]*" // Basic pattern validation
          value={displayValue}
          onChange={handleInputChange}
          className="text-center flex-1"
          placeholder="0" // Placeholder when empty
          disabled={disabled} // Pass disabled state
        />
        <span className="text-sm text-muted-foreground">{UNIT_LABEL}</span>
      </div>
    </div>
  )
} 