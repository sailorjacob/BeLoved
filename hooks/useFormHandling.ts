import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export type FormErrors = Record<string, string>

interface UseFormHandlingProps<T> {
  initialValues: T
  validationRules?: {
    [K in keyof T]?: (value: T[K], formValues: T) => string | undefined
  }
  onSubmit: (values: T) => Promise<void>
}

export function useFormHandling<T extends Record<string, any>>({
  initialValues,
  validationRules = {},
  onSubmit
}: UseFormHandlingProps<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleChange = (field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
    // Clear error when field is modified
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field as string]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    Object.keys(validationRules).forEach(field => {
      const rule = validationRules[field as keyof T]
      if (rule) {
        const error = rule(values[field as keyof T], values)
        if (error) {
          newErrors[field] = error
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setValues(initialValues)
    setErrors({})
    setSubmitError(null)
  }

  return {
    values,
    errors,
    isSubmitting,
    submitError,
    handleChange,
    handleSubmit,
    resetForm,
    setValues
  }
} 