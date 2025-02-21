import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

type PaymentMethod = 'cash' | 'insurance' | 'pay_now'

interface PaymentOptionsProps {
  value: PaymentMethod
  onChange: (value: PaymentMethod) => void
}

export function PaymentOptions({ value, onChange }: PaymentOptionsProps) {
  return (
    <div>
      <Label>Payment Method</Label>
      <RadioGroup value={value} onValueChange={onChange} className="flex space-x-4">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="cash" id="cash" />
          <Label htmlFor="cash">Cash</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="insurance" id="insurance" />
          <Label htmlFor="insurance">Insurance</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="pay_now" id="pay_now" />
          <Label htmlFor="pay_now">Pay Now</Label>
        </div>
      </RadioGroup>
    </div>
  )
}

