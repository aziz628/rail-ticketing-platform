import { useState } from "react"
import { format, isValid, parseISO } from "date-fns"
// icons are calendar and x from lucide react
import { CalendarIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
  value?: string | null
  onChange: (value: string | null) => void
  minDate?: string
  disabled?: boolean
  placeholder?: string
  className?: string
  allowClear?: boolean
  id?: string
}

// Parses a date string in ISO format and returns a Date object if valid, otherwise undefined
const parseDate = (value?: string | null) => {
  if (!value) return undefined
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : undefined
}

/** A date picker component that uses a popover to display a calendar for date selection.
* It supports optional minimum date constraints, disabled state, and a clear button to reset the selection.
*/
export function DatePicker({
  value,
  onChange,
  minDate,
  disabled,
  placeholder = "YYYY/MM/DD",
  className,
  allowClear = false,
  id,
}: DatePickerProps) {
  const selected = parseDate(value)
  const min = parseDate(minDate)
  const [open, setOpen] = useState(false)

  return (
    <div className={cn("flex items-center gap-2", className)}>
    {/* The button that triggers the popover, showing the selected date */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                "sncft-date-input justify-start font-normal px-2",
                !selected && "text-slate-400"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selected ? format(selected, "yyyy/MM/dd") : <span>{placeholder}</span>}
            </Button>
          }
        />
        {/* The content of the popover, contains the calendar for date selection */}
        <PopoverContent className="w-[220px] p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={(date) => {
              onChange(date ? format(date, "yyyy-MM-dd") : null)
              if (date) setOpen(false)
            }}
            disabled={min ? { before: min } : undefined}
            classNames={{ root: "w-full" }}
          />
        </PopoverContent>
      </Popover>
      
      {/* Clear button to reset the selected date  */ }
      {allowClear && selected && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 px-2 text-xs"
          onClick={() => onChange(null)}
        >
          {/* x icon from lucid react to reset */}
              <XIcon className="h-4 w-4" />
          
        </Button>
      )}
    </div>
  )
}
