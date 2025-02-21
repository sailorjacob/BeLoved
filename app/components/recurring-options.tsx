import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Database } from "@/lib/supabase"

type RecurringType = Database['public']['Tables']['rides']['Row']['recurring']

interface RecurringOptionsProps {
  value: RecurringType
  onChange: (value: RecurringType) => void
}

export function RecurringOptions({ value, onChange }: RecurringOptionsProps) {
  return (
    <div>
      <Label>Recurring Options</Label>
      <RadioGroup value={value} onValueChange={onChange} className="flex space-x-4">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="none" id="none" />
          <Label htmlFor="none">None</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="daily" id="daily" />
          <Label htmlFor="daily">Daily</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="weekly" id="weekly" />
          <Label htmlFor="weekly">Weekly</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="monthly" id="monthly" />
          <Label htmlFor="monthly">Monthly</Label>
        </div>
      </RadioGroup>
    </div>
  )
}

