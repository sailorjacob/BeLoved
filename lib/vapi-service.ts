import { vapiClient } from './vapi-config'
import { supabase } from './supabase'

export interface CallOptions {
  memberId?: string
  driverId?: string
  callType: 'inbound' | 'outbound'
  priority?: 'normal' | 'high'
}

export class VAPIService {
  static async initiateCall(phoneNumber: string, options: CallOptions) {
    try {
      // Create call record in database
      const { data: callLog, error: dbError } = await supabase
        .from('call_logs')
        .insert({
          status: 'initiating',
          caller_id: options.memberId || options.driverId,
          call_type: options.callType,
          priority: options.priority || 'normal',
          timestamp: new Date().toISOString()
        })
        .select()
        .single()

      if (dbError) throw dbError

      // Initiate call through VAPI
      const call = await vapiClient.createCall({
        to: phoneNumber,
        from: process.env.NEXT_PUBLIC_VAPI_PHONE_NUMBER,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/webhook`,
        metadata: {
          callLogId: callLog.id,
          memberId: options.memberId,
          driverId: options.driverId,
          callType: options.callType
        }
      })

      // Update call record with VAPI call ID
      await supabase
        .from('call_logs')
        .update({
          call_id: call.id,
          status: 'initiated'
        })
        .eq('id', callLog.id)

      return {
        success: true,
        callId: call.id,
        callLogId: callLog.id
      }
    } catch (error) {
      console.error('Error initiating call:', error)
      throw error
    }
  }

  static async endCall(callId: string) {
    try {
      // End call through VAPI
      await vapiClient.endCall(callId)

      // Update call record
      await supabase
        .from('call_logs')
        .update({
          status: 'ended',
          end_timestamp: new Date().toISOString()
        })
        .eq('call_id', callId)

      return {
        success: true,
        message: 'Call ended successfully'
      }
    } catch (error) {
      console.error('Error ending call:', error)
      throw error
    }
  }

  static async getCallHistory(userId: string, userType: 'member' | 'driver') {
    try {
      const { data: calls, error } = await supabase
        .from('call_logs')
        .select(`
          *,
          transcripts:call_transcripts(*)
        `)
        .eq('caller_id', userId)
        .order('timestamp', { ascending: false })

      if (error) throw error

      return {
        success: true,
        calls
      }
    } catch (error) {
      console.error('Error fetching call history:', error)
      throw error
    }
  }

  static async getCallDetails(callId: string) {
    try {
      const { data: call, error } = await supabase
        .from('call_logs')
        .select(`
          *,
          transcripts:call_transcripts(*)
        `)
        .eq('call_id', callId)
        .single()

      if (error) throw error

      return {
        success: true,
        call
      }
    } catch (error) {
      console.error('Error fetching call details:', error)
      throw error
    }
  }
} 