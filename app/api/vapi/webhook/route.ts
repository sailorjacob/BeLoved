import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { VAPIAgent } from '@/lib/vapi-ai'
import { supabase } from '@/lib/supabase'
import { validateVAPIRequest } from '@/lib/vapi-utils'

interface VAPIEvent {
  type: 'status.update' | 'transcript.update' | 'function.call' | 'assistant.request' | 'call.end' | 'hang.notification'
  conversation: {
    id: string
    status?: string
    duration?: number
    recording?: {
      url?: string
    }
  }
  transcript?: {
    text: string
    final: boolean
  }
  function?: {
    name: string
    parameters: Record<string, any>
  }
  request?: {
    type: string
    parameters: Record<string, any>
  }
  summary?: {
    text: string
    metadata: Record<string, any>
  }
}

// Verify VAPI webhook signature
const verifyVAPISignature = (signature: string, body: string) => {
  // Implement VAPI signature verification here
  // This will be provided in VAPI's documentation
  return true
}

export async function POST(request: Request) {
  try {
    const headersList = headers()
    const body = await request.text()

    // Verify the request is from VAPI
    if (!validateVAPIRequest(headersList, body)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const event = JSON.parse(body) as VAPIEvent

    // Log incoming event for debugging
    console.log('Received VAPI event:', event.type, event)

    // Handle different event types
    switch (event.type) {
      case 'status.update':
        await handleStatusUpdate(event)
        break

      case 'transcript.update':
        if (event.transcript) {
          await handleTranscriptUpdate(event)
        }
        break

      case 'function.call':
        if (event.function) {
          const response = await handleFunctionCall(event)
          return NextResponse.json(response)
        }
        break

      case 'assistant.request':
        if (event.request) {
          const response = await handleAssistantRequest(event)
          return NextResponse.json(response)
        }
        break

      case 'call.end':
        await handleCallEnd(event)
        break

      case 'hang.notification':
        await handleHangNotification(event)
        break

      default:
        console.log('Unhandled event type:', event.type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleStatusUpdate(event: VAPIEvent) {
  await supabase
    .from('call_logs')
    .update({
      status: event.conversation.status,
      updated_at: new Date().toISOString()
    })
    .eq('call_id', event.conversation.id)
}

async function handleTranscriptUpdate(event: VAPIEvent) {
  if (!event.transcript) return

  await supabase
    .from('call_transcripts')
    .insert({
      call_id: event.conversation.id,
      transcript: event.transcript.text,
      is_final: event.transcript.final,
      timestamp: new Date().toISOString()
    })
}

async function handleFunctionCall(event: VAPIEvent) {
  if (!event.function) return { success: false, error: 'No function data' }

  const agent = new VAPIAgent()
  
  switch (event.function.name) {
    case 'scheduleRide':
      return await agent.scheduleRide(event.function.parameters)
    
    case 'modifyRide':
      // Implement ride modification
      break
    
    case 'cancelRide':
      // Implement ride cancellation
      break
    
    default:
      return {
        success: false,
        error: `Unknown function: ${event.function.name}`
      }
  }
}

async function handleAssistantRequest(event: VAPIEvent) {
  if (!event.request) return { success: false, error: 'No request data' }

  switch (event.request.type) {
    case 'member_verification':
      // Implement member verification
      break
    
    case 'ride_status':
      // Implement ride status check
      break
    
    default:
      return {
        success: false,
        error: `Unknown request type: ${event.request.type}`
      }
  }
}

async function handleCallEnd(event: VAPIEvent) {
  await supabase
    .from('call_logs')
    .update({
      status: 'completed',
      duration: event.conversation.duration,
      recording_url: event.conversation.recording?.url,
      end_timestamp: new Date().toISOString()
    })
    .eq('call_id', event.conversation.id)
}

async function handleHangNotification(event: VAPIEvent) {
  await supabase
    .from('call_logs')
    .update({
      status: 'hung',
      updated_at: new Date().toISOString()
    })
    .eq('call_id', event.conversation.id)

  // You might want to implement retry logic or alert support staff here
} 