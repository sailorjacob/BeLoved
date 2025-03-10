"use client"

import * as React from "react"
import { format } from "date-fns"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TimePickerProps {
  date: Date | undefined
  onSelect: (date: Date) => void
}

export function TimePicker({ date, onSelect }: TimePickerProps) {
  // Create a temporary date object if none provided
  const baseDate = date || new Date()
  
  const [hour, setHour] = React.useState<string>(
    format(baseDate, "h")
  )
  const [minute, setMinute] = React.useState<string>(
    format(baseDate, "mm")
  )
  const [meridiem, setMeridiem] = React.useState<"AM" | "PM">(
    format(baseDate, "a") as "AM" | "PM"
  )

  React.useEffect(() => {
    const newDate = new Date(baseDate)
    const parsedHour = parseInt(hour)
    
    // Adjust hour for 12-hour format
    if (meridiem === "PM" && parsedHour < 12) {
      newDate.setHours(parsedHour + 12)
    } else if (meridiem === "AM" && parsedHour === 12) {
      newDate.setHours(0)
    } else {
      newDate.setHours(parsedHour)
    }
    
    newDate.setMinutes(parseInt(minute))
    newDate.setSeconds(0)
    onSelect(newDate)
  }, [hour, minute, meridiem, baseDate, onSelect])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {date ? format(date, "h:mm a") : <span>Pick a time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4">
        <div className="flex gap-2">
          <Select
            value={hour}
            onValueChange={(value) => setHour(value)}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder="Hour" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                <SelectItem key={hour} value={hour.toString()}>
                  {hour}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={minute}
            onValueChange={(value) => setMinute(value)}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="Minute" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                <SelectItem 
                  key={minute} 
                  value={minute.toString().padStart(2, '0')}
                >
                  {minute.toString().padStart(2, '0')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={meridiem}
            onValueChange={(value) => setMeridiem(value as "AM" | "PM")}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder="AM/PM" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AM">AM</SelectItem>
              <SelectItem value="PM">PM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  )
} 