import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FormErrors } from '@/hooks/useFormHandling'

interface FormContainerProps {
  title: string
  onSubmit: (e: React.FormEvent) => void
  isSubmitting: boolean
  submitError: string | null
  submitButtonText?: string
  children: React.ReactNode
}

export function FormContainer({
  title,
  onSubmit,
  isSubmitting,
  submitError,
  submitButtonText = 'Submit',
  children
}: FormContainerProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {children}

          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full bg-red-500 hover:bg-red-600 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : submitButtonText}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 