import { VAPIClient } from '@vapi-ai/web'

if (!process.env.NEXT_PUBLIC_VAPI_API_KEY) {
  throw new Error('Missing VAPI API key')
}

if (!process.env.NEXT_PUBLIC_VAPI_PROJECT_ID) {
  throw new Error('Missing VAPI project ID')
}

export const vapiClient = new VAPIClient({
  apiKey: process.env.NEXT_PUBLIC_VAPI_API_KEY,
  projectId: process.env.NEXT_PUBLIC_VAPI_PROJECT_ID,
  environment: process.env.NEXT_PUBLIC_VAPI_ENVIRONMENT as 'development' | 'production'
})

// Helper function to initialize call session
export const initializeCallSession = async (callerId: string) => {
  try {
    const session = await vapiClient.createCallSession({
      caller: {
        id: callerId,
      },
      recording: {
        enabled: true,
        storageConfig: {
          type: 'supabase',
          bucket: 'vapi-recordings',
          path: `calls/${callerId}/${Date.now()}`
        }
      }
    })
    return session
  } catch (error) {
    console.error('Failed to initialize VAPI call session:', error)
    throw error
  }
}

// Types for VAPI responses
export interface VAPICallSession {
  id: string
  status: 'active' | 'completed' | 'failed'
  recording?: {
    url?: string
    duration?: number
  }
}

export interface VAPIError {
  code: string
  message: string
  details?: any
} 