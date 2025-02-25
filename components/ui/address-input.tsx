'use client'

import { FormInput } from './form-input'

interface Address {
  address: string
  city: string
  state: string
  zip: string
}

interface AddressInputProps {
  label: string
  value: Address
  onChange: (address: Address) => void
  errors?: {
    address?: string
    city?: string
    state?: string
    zip?: string
  }
  required?: boolean
  id: string
}

export function AddressInput({
  label,
  value,
  onChange,
  errors = {},
  required,
  id
}: AddressInputProps) {
  const handleChange = (field: keyof Address, fieldValue: string) => {
    onChange({
      ...value,
      [field]: fieldValue
    })
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{label}</h3>
      <div className="space-y-4">
        <FormInput
          id={`${id}-address`}
          label="Street Address"
          value={value.address}
          onChange={(e) => handleChange('address', e.target.value)}
          error={errors.address}
          required={required}
        />
        <FormInput
          id={`${id}-city`}
          label="City"
          value={value.city}
          onChange={(e) => handleChange('city', e.target.value)}
          error={errors.city}
          required={required}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            id={`${id}-state`}
            label="State"
            value={value.state}
            onChange={(e) => handleChange('state', e.target.value)}
            error={errors.state}
            required={required}
          />
          <FormInput
            id={`${id}-zip`}
            label="ZIP Code"
            value={value.zip}
            onChange={(e) => handleChange('zip', e.target.value)}
            error={errors.zip}
            required={required}
          />
        </div>
      </div>
    </div>
  )
} 