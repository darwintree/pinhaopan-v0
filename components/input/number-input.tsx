"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface NumberInputProps {
  id: string
  value: number | null | undefined
  onChange: (newValue: number | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string // For the wrapper div if needed, though might not be used directly here
  inputClassName?: string // Specifically for the <Input> component
  allowDecimal?: boolean
  min?: number
  max?: number
  showStepButtons?: boolean
  step?: number
}

export function NumberInput({
  id,
  value,
  onChange,
  placeholder,
  disabled = false,
  className, // Main className for potential wrapper
  inputClassName, // Specific className for the input element
  allowDecimal = false,
  min,
  max,
  showStepButtons = true,
  step = 1,
}: NumberInputProps) {
  const [displayValue, setDisplayValue] = React.useState<string>("")

  // Effect to sync external value changes to internal display
  React.useEffect(() => {
    if (value === null || value === undefined || isNaN(value)) {
      setDisplayValue("")
    } else {
      setDisplayValue(value.toString())
    }
  }, [value])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let rawInput = event.target.value
    let filteredInput = ""

    // Filter input based on allowDecimal
    if (allowDecimal) {
      // Allow numbers and one decimal point
      filteredInput = rawInput.replace(/[^0-9.]/g, '')
      // Ensure only one decimal point
      const parts = filteredInput.split('.')
      if (parts.length > 2) {
        filteredInput = `${parts[0]}.${parts.slice(1).join('')}`
      }
    } else {
      // Allow only whole numbers
      filteredInput = rawInput.replace(/[^0-9]/g, '')
    }

    setDisplayValue(filteredInput)

    // Parse and validate the number
    let numericValue: number | null = null
    if (filteredInput !== "") {
      numericValue = allowDecimal ? parseFloat(filteredInput) : parseInt(filteredInput, 10)
      
      if (isNaN(numericValue)) {
        numericValue = null // Invalid number
      } else {
        // Clamp value if min/max are defined
        if (min !== undefined && numericValue < min) {
          // Optionally clamp or just prevent onChange? Let's prevent for now if invalid.
          // Or should we update displayValue back to min? Needs decision.
          // For simplicity, we pass the potentially invalid value and let parent handle?
          // Let's pass the parsed value, parent can validate.
        }
        if (max !== undefined && numericValue > max) {
          // Similar decision for max
        }
      }
    } else {
      numericValue = null // Empty input means null value
    }

    // Call onChange only if the numeric interpretation changes
    // Avoids calling onChange excessively while typing if intermediate values are invalid
    // Let's call onChange on every valid keystroke for responsiveness.
    onChange(numericValue)

  }

  // Function to handle increment/decrement
  const handleStep = (direction: 1 | -1) => {
    // Determine the current numeric value, defaulting to 0 if invalid/empty
    let currentValue = allowDecimal ? parseFloat(displayValue) : parseInt(displayValue, 10)
    if (isNaN(currentValue)) {
      currentValue = 0 // Default to 0 if display is not a number
    }

    let newValue = currentValue + direction * step

    // Round if decimals are not allowed and step isn't necessarily integer
    if (!allowDecimal) {
      newValue = Math.round(newValue)
    }

    // Clamp value within min/max bounds
    if (min !== undefined) {
      newValue = Math.max(min, newValue)
    }
    if (max !== undefined) {
      newValue = Math.min(max, newValue)
    }

    // Update the state and call onChange
    setDisplayValue(newValue.toString()) // Update display immediately
    onChange(newValue)
  }

  // Determine current numeric value for button disabling logic
  const currentNumericValue = allowDecimal ? parseFloat(displayValue) : parseInt(displayValue, 10);
  const isValidCurrentNumber = !isNaN(currentNumericValue);

  return (
    // Use flex container to group input and buttons
    <div className={cn("flex items-center", className)}>
      <Input
        id={id}
        type="text" 
        inputMode={allowDecimal ? "decimal" : "numeric"}
        pattern={allowDecimal ? "[0-9]*[.,]?[0-9]*" : "[0-9]*"}
        value={displayValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        // Apply specific input styling, make it flexible if needed
        className={cn(inputClassName, showStepButtons ? "rounded-r-none focus:z-10" : "")}
        // Remove right border radius if buttons are shown
      />
      {showStepButtons && (
        <div className="flex">
          <Button
            type="button" // Prevent form submission
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-l-none border-l-0 p-0 focus:z-10"
            onClick={() => handleStep(-1)}
            disabled={disabled || (isValidCurrentNumber && min !== undefined && currentNumericValue <= min)}
            aria-label="Decrement"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            type="button" // Prevent form submission
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-l-none border-l-0 rounded-r-md p-0 focus:z-10"
            onClick={() => handleStep(1)}
            disabled={disabled || (isValidCurrentNumber && max !== undefined && currentNumericValue >= max)}
            aria-label="Increment"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
