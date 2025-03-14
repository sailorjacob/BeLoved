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
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
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

  const handleBlur = (field: keyof T) => {
    // Mark field as touched when it loses focus
    setTouchedFields(prev => ({ ...prev, [field as string]: true }))
    
    // Validate this specific field
    if (validationRules[field]) {
      const rule = validationRules[field as keyof T]
      if (rule) {
        const error = rule(values[field as keyof T], values)
        if (error) {
          setErrors(prev => ({ ...prev, [field as string]: error }))
        }
      }
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
    setIsSubmitted(true)
    
    // Mark all fields as touched on submission
    const allTouched: Record<string, boolean> = {}
    Object.keys(validationRules).forEach(field => {
      allTouched[field] = true
    })
    setTouchedFields(allTouched)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } catch (error) {
      if (error instanceof Error) {
        setSubmitError(error.message)
      } else if (typeof error === 'string') {
        setSubmitError(error)
      } else {
        setSubmitError('An error occurred')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setValues(initialValues)
    setErrors({})
    setTouchedFields({})
    setIsSubmitted(false)
    setSubmitError(null)
  }

  const getInputProps = (field: keyof T) => {
    return {
      id: field as string,
      name: field as string,
      value: values[field],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleChange(field, e.target.value),
      onBlur: () => handleBlur(field),
      className: touchedFields[field as string] ? 'touched' : '',
      'data-submitted': isSubmitted ? 'true' : 'false',
    }
  }

  return {
    values,
    errors,
    touchedFields,
    isSubmitting,
    isSubmitted,
    submitError,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setValues,
    setSubmitError,
    getInputProps
  }
} 