'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  containerClassName?: string
}

export function FormInput({
  label,
  error,
  id,
  containerClassName,
  className,
  ...props
}: FormInputProps) {
  return (
    <div className={cn('space-y-2', containerClassName)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className={cn(
          error && 'border-red-500 focus-visible:ring-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
} 