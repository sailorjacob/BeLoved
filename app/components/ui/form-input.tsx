import * as React from "react"
import { cn } from "@/lib/utils"

export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, error, label, type, required, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          ref={ref}
          required={required}
          aria-invalid={error ? "true" : "false"}
          aria-errormessage={error ? `${props.id}-error` : undefined}
          {...props}
        />
        {error && (
          <p
            className="text-sm font-medium text-red-500 mt-1"
            id={`${props.id}-error`}
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)
FormInput.displayName = "FormInput"

export { FormInput } 