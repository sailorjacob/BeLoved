'use client'

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Home } from "lucide-react"

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-lg shadow-lg p-8 text-center">
        {/* Logo */}
        <div className="mb-6">
          <Image 
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bloved-uM125dOkkSEXgRuEs8A8fnIfjsczvI.png" 
            alt="BeLoved Transportation Logo"
            width={150}
            height={75}
            className="mx-auto"
          />
        </div>
        
        {/* Error Status */}
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <p className="text-xl font-medium text-foreground mt-1">Page Not Found</p>
        </div>
        
        {/* Message */}
        <p className="text-muted-foreground mb-8">
          The page you're looking for hasn't been built yet or doesn't exist.
        </p>
        
        {/* Navigation Buttons */}
        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 w-full"
          >
            <ArrowLeft size={16} />
            Go Back
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => router.push('/')}
            className="flex items-center justify-center gap-2 w-full"
          >
            <Home size={16} />
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  )
} 