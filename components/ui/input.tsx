import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const isIOS = typeof window !== 'undefined' && 
      /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.userAgent.includes("Mac") && "ontouchend" in document)
    
    // iOS-specific props to improve keyboard handling
    const iosProps = isIOS ? {
      autoCapitalize: "none" as const,
      autoCorrect: "off" as const,
      spellCheck: false,
      enterKeyHint: (type === "search" ? "search" : "done") as "search" | "done",
      autoComplete: props.autoComplete || "off",
    } : {}
    
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...iosProps}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
