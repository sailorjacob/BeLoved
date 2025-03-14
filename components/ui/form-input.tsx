'use client'

import React, { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  containerClassName?: string
  touched?: boolean
  submitted?: boolean
  onBlur?: React.FocusEventHandler<HTMLInputElement>
}

export function FormInput({
  label,
  error,
  id,
  containerClassName,
  className,
  touched = false,
  submitted = false,
  onBlur,
  ...props
}: FormInputProps) {
  const [isTouched, setIsTouched] = useState(touched);
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsTouched(true);
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <div className={cn('space-y-2', containerClassName)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className={cn(
          error && 'border-red-500 focus-visible:ring-red-500',
          isTouched && 'touched',
          className
        )}
        data-submitted={submitted ? 'true' : 'false'}
        onBlur={handleBlur}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
} 