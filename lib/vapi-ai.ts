import { supabase } from '@/lib/supabase'
import { vapiClient, initializeCallSession, VAPICallSession, VAPIError } from './vapi-config'

interface VAPIContext {
  member_id?: string
  trip_id?: string
  driver_id?: string
  appointment_time?: string
  appointment_date?: string
  provider_name?: string
  provider_address?: string
  is_recurring?: boolean
  recurring_pattern?: {
    frequency: 'daily' | 'weekly' | 'multiple_times_week'
    days?: string[]
    start_date: string
    end_date?: string
    total_days?: number
  }
  call_session?: VAPICallSession
}

interface VAPIResponse {
  success: boolean
  message: string
  data?: any
}

export class VAPIAgent {
  private context: VAPIContext = {}
  private callSession?: VAPICallSession

  constructor(initialContext?: Partial<VAPIContext>) {
    if (initialContext) {
      this.context = { ...this.context, ...initialContext }
    }
  }

  // Initialize the conversation with VAPI
  async initializeConversation(callerId: string): Promise<VAPIResponse> {
    try {
      // Initialize VAPI call session
      this.callSession = await initializeCallSession(callerId)
      this.context.call_session = this.callSession

      // Start the conversation with VAPI
      await vapiClient.startConversation(this.callSession.id, {
        initialPrompt: "Thank you for calling BeLoved Transportation. This is Alex. May I ask who I'm speaking with?",
        voice: {
          provider: 'elevenlabs',
          voiceId: 'alex', // Replace with your actual voice ID
        }
      })

      return {
        success: true,
        message: "Call session initialized successfully",
        data: { session: this.callSession }
      }
    } catch (error) {
      console.error('Failed to initialize conversation:', error)
      return {
        success: false,
        message: "Failed to initialize the call",
        data: { error }
      }
    }
  }

  // Handle member identification with VAPI
  async identifyMember(name: string): Promise<VAPIResponse> {
    try {
      if (!this.callSession) {
        throw new Error('Call session not initialized')
      }

      // Query the database for member information
      const { data: member, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, email, medicaid_id')
        .ilike('full_name', `%${name}%`)
        .single()

      if (error) {
        // Send response through VAPI
        await vapiClient.sendMessage(this.callSession.id, {
          content: "I couldn't find your information in our system. Are you a new member?",
          voice: {
            provider: 'elevenlabs',
            voiceId: 'alex'
          }
        })

        return {
          success: false,
          message: "Member not found",
          data: { error }
        }
      }

      this.context.member_id = member.id

      // Send confirmation through VAPI
      await vapiClient.sendMessage(this.callSession.id, {
        content: `Hello ${member.full_name}, how can I help you today?`,
        voice: {
          provider: 'elevenlabs',
          voiceId: 'alex'
        }
      })

      return {
        success: true,
        message: "Member identified successfully",
        data: { member }
      }
    } catch (error) {
      console.error('Error in member identification:', error)
      return {
        success: false,
        message: "Failed to process member identification",
        data: { error }
      }
    }
  }

  // Handle ride scheduling through VAPI
  async scheduleRide(rideInfo: {
    appointment_date: string
    appointment_time: string
    provider_name: string
    provider_address: string
    is_recurring?: boolean
    recurring_pattern?: VAPIContext['recurring_pattern']
  }): Promise<VAPIResponse> {
    try {
      if (!this.callSession) {
        throw new Error('Call session not initialized')
      }

      if (!this.context.member_id) {
        await vapiClient.sendMessage(this.callSession.id, {
          content: "I need to verify your identity first. Could you please provide your member ID?",
          voice: {
            provider: 'elevenlabs',
            voiceId: 'alex'
          }
        })

        return {
          success: false,
          message: "Member identification required"
        }
      }

      // Calculate pickup time (1 hour before appointment)
      const appointmentDateTime = new Date(`${rideInfo.appointment_date}T${rideInfo.appointment_time}`)
      const pickupDateTime = new Date(appointmentDateTime.getTime() - 60 * 60 * 1000)

      // Create the ride record
      const { data: ride, error } = await supabase
        .from('rides')
        .insert({
          member_id: this.context.member_id,
          scheduled_pickup_time: pickupDateTime.toISOString(),
          appointment_time: appointmentDateTime.toISOString(),
          provider_name: rideInfo.provider_name,
          provider_address: rideInfo.provider_address,
          status: 'pending',
          is_recurring: rideInfo.is_recurring || false,
          recurring_pattern: rideInfo.recurring_pattern || null
        })
        .select()
        .single()

      if (error) throw error

      // Generate a trip ID
      const trip_id = `T${ride.id.toString().padStart(6, '0')}`
      
      // Update the ride with the trip ID
      await supabase
        .from('rides')
        .update({ trip_id })
        .eq('id', ride.id)

      this.context.trip_id = trip_id

      // Prepare confirmation message
      let confirmationMessage = `I've scheduled your ride. Your Trip ID is ${trip_id}. For your ${rideInfo.appointment_time} appointment on ${rideInfo.appointment_date}, please be ready at ${pickupDateTime.toLocaleTimeString()}. Remember, our driver will wait for 10 minutes. After that, it may be marked as a no-show. For your return trip, please call this number when you're ready to be picked up. A driver will arrive within 1 hour.`

      if (rideInfo.is_recurring && rideInfo.recurring_pattern) {
        confirmationMessage += `\n\nI've scheduled recurring rides according to your pattern: ${this.formatRecurringPattern(rideInfo.recurring_pattern)}.`
      }

      // Send confirmation through VAPI
      await vapiClient.sendMessage(this.callSession.id, {
        content: confirmationMessage,
        voice: {
          provider: 'elevenlabs',
          voiceId: 'alex'
        }
      })

      return {
        success: true,
        message: "Ride scheduled successfully",
        data: { ride, trip_id }
      }
    } catch (error) {
      console.error('Error scheduling ride:', error)
      
      if (this.callSession) {
        await vapiClient.sendMessage(this.callSession.id, {
          content: "I'm having trouble scheduling your ride. Could you please try again or hold while I connect you with a human representative?",
          voice: {
            provider: 'elevenlabs',
            voiceId: 'alex'
          }
        })
      }

      return {
        success: false,
        message: "Failed to schedule ride",
        data: { error }
      }
    }
  }

  // Helper function to format recurring patterns
  private formatRecurringPattern(pattern: VAPIContext['recurring_pattern']): string {
    if (!pattern) return ''

    switch (pattern.frequency) {
      case 'daily':
        return `Daily from ${new Date(pattern.start_date).toLocaleDateString()} to ${pattern.end_date ? new Date(pattern.end_date).toLocaleDateString() : 'ongoing'}`
      case 'weekly':
        return `Weekly on ${pattern.days?.join(', ')} from ${new Date(pattern.start_date).toLocaleDateString()} to ${pattern.end_date ? new Date(pattern.end_date).toLocaleDateString() : 'ongoing'}`
      case 'multiple_times_week':
        return `${pattern.days?.length} times per week on ${pattern.days?.join(', ')} from ${new Date(pattern.start_date).toLocaleDateString()} to ${pattern.end_date ? new Date(pattern.end_date).toLocaleDateString() : 'ongoing'}`
      default:
        return ''
    }
  }

  // End the conversation and cleanup
  async endConversation(): Promise<VAPIResponse> {
    try {
      if (this.callSession) {
        await vapiClient.endConversation(this.callSession.id)
      }
      return {
        success: true,
        message: "Call ended successfully"
      }
    } catch (error) {
      console.error('Error ending conversation:', error)
      return {
        success: false,
        message: "Failed to end conversation properly",
        data: { error }
      }
    }
  }
} 