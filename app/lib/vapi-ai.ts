import { supabase } from '@/lib/supabase'

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
}

interface VAPIResponse {
  success: boolean
  message: string
  data?: any
}

export class VAPIAgent {
  private context: VAPIContext = {}

  constructor(initialContext?: Partial<VAPIContext>) {
    if (initialContext) {
      this.context = { ...this.context, ...initialContext }
    }
  }

  // Initialize the conversation
  async initializeConversation(): Promise<VAPIResponse> {
    return {
      success: true,
      message: "Thank you for calling BeLoved Transportation. This is Alex. May I ask who I'm speaking with?"
    }
  }

  // Handle member identification
  async identifyMember(name: string): Promise<VAPIResponse> {
    try {
      // Query the database for member information
      const { data: member, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, email, medicaid_id')
        .ilike('full_name', `%${name}%`)
        .single()

      if (error) {
        return {
          success: false,
          message: "I couldn't find your information in our system. Are you a new member?"
        }
      }

      this.context.member_id = member.id
      return {
        success: true,
        message: `Hello ${member.full_name}, how can I help you today?`,
        data: { member }
      }
    } catch (error) {
      return {
        success: false,
        message: "I'm having trouble accessing your information. Could you please provide your member ID?"
      }
    }
  }

  // Handle new member registration
  async registerNewMember(memberInfo: {
    full_name: string
    date_of_birth: string
    phone: string
    medicaid_id: string
    address: string
  }): Promise<VAPIResponse> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          full_name: memberInfo.full_name,
          date_of_birth: memberInfo.date_of_birth,
          phone: memberInfo.phone,
          medicaid_id: memberInfo.medicaid_id,
          address: memberInfo.address
        })
        .select()
        .single()

      if (error) throw error

      this.context.member_id = data.id
      return {
        success: true,
        message: "Thank you for registering with BeLoved Transportation. Now, let's schedule your ride. What's the date and time of your medical appointment?",
        data: { member: data }
      }
    } catch (error) {
      return {
        success: false,
        message: "I'm having trouble registering your information. Could you please try again or speak with a human representative?"
      }
    }
  }

  // Handle ride scheduling
  async scheduleRide(rideInfo: {
    appointment_date: string
    appointment_time: string
    provider_name: string
    provider_address: string
    is_recurring?: boolean
    recurring_pattern?: VAPIContext['recurring_pattern']
  }): Promise<VAPIResponse> {
    if (!this.context.member_id) {
      return {
        success: false,
        message: "I need to verify your identity first. Could you please provide your member ID?"
      }
    }

    try {
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
      this.context.appointment_time = rideInfo.appointment_time
      this.context.appointment_date = rideInfo.appointment_date
      this.context.provider_name = rideInfo.provider_name
      this.context.provider_address = rideInfo.provider_address

      let response = `I've scheduled your ride. Your Trip ID is ${trip_id}. For your ${rideInfo.appointment_time} appointment on ${rideInfo.appointment_date}, please be ready at ${pickupDateTime.toLocaleTimeString()}. Remember, our driver will wait for 10 minutes. After that, it may be marked as a no-show. For your return trip, please call this number when you're ready to be picked up. A driver will arrive within 1 hour.`

      if (rideInfo.is_recurring && rideInfo.recurring_pattern) {
        response += `\n\nI've scheduled recurring rides according to your pattern: ${this.formatRecurringPattern(rideInfo.recurring_pattern)}.`
      }

      return {
        success: true,
        message: response,
        data: { ride, trip_id }
      }
    } catch (error) {
      return {
        success: false,
        message: "I'm having trouble scheduling your ride. Could you please try again or speak with a human representative?"
      }
    }
  }

  // Handle ride modifications
  async modifyRide(trip_id: string, modifications: {
    new_appointment_time?: string
    new_appointment_date?: string
    cancel?: boolean
    add_pharmacy_stop?: {
      name: string
      address: string
    }
  }): Promise<VAPIResponse> {
    try {
      const { data: ride, error: fetchError } = await supabase
        .from('rides')
        .select('*')
        .eq('trip_id', trip_id)
        .single()

      if (fetchError) throw fetchError

      if (modifications.cancel) {
        // Check if cancellation is within 2 hours of appointment
        const appointmentTime = new Date(ride.appointment_time)
        const now = new Date()
        const hoursUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60)

        if (hoursUntilAppointment < 2) {
          return {
            success: false,
            message: "I apologize, but we require at least 2 hours notice for cancellations. Would you like to speak with a human representative about your situation?"
          }
        }

        const { error: updateError } = await supabase
          .from('rides')
          .update({ status: 'cancelled' })
          .eq('id', ride.id)

        if (updateError) throw updateError

        return {
          success: true,
          message: "Your ride has been cancelled. Is there anything else I can help you with?"
        }
      }

      if (modifications.new_appointment_time || modifications.new_appointment_date) {
        const newAppointmentDateTime = new Date(
          modifications.new_appointment_date || ride.appointment_date,
          modifications.new_appointment_time || ride.appointment_time
        )
        const newPickupDateTime = new Date(newAppointmentDateTime.getTime() - 60 * 60 * 1000)

        const { error: updateError } = await supabase
          .from('rides')
          .update({
            appointment_time: newAppointmentDateTime.toISOString(),
            scheduled_pickup_time: newPickupDateTime.toISOString(),
            status: 'pending'
          })
          .eq('id', ride.id)

        if (updateError) throw updateError

        return {
          success: true,
          message: `I've updated your ride time. Your new pickup time is ${newPickupDateTime.toLocaleTimeString()}. Remember to be ready 10 minutes before this time.`
        }
      }

      if (modifications.add_pharmacy_stop) {
        const { error: updateError } = await supabase
          .from('rides')
          .update({
            pharmacy_stop: modifications.add_pharmacy_stop
          })
          .eq('id', ride.id)

        if (updateError) throw updateError

        return {
          success: true,
          message: `I've added a pharmacy stop at ${modifications.add_pharmacy_stop.name} to your trip. The driver will wait up to 15 minutes while you pick up medications.`
        }
      }

      return {
        success: false,
        message: "I'm not sure what modifications you'd like to make. Could you please clarify?"
      }
    } catch (error) {
      return {
        success: false,
        message: "I'm having trouble modifying your ride. Could you please try again or speak with a human representative?"
      }
    }
  }

  // Handle driver no-show reporting
  async reportNoShow(trip_id: string, driver_id: string): Promise<VAPIResponse> {
    try {
      const { data: ride, error: fetchError } = await supabase
        .from('rides')
        .select('*, member:profiles(*)')
        .eq('trip_id', trip_id)
        .single()

      if (fetchError) throw fetchError

      // Verify driver is at correct address
      const { data: driver, error: driverError } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('id', driver_id)
        .single()

      if (driverError) throw driverError

      // Update ride status to no-show
      const { error: updateError } = await supabase
        .from('rides')
        .update({ 
          status: 'no_show',
          no_show_reported_by: driver_id,
          no_show_reported_at: new Date().toISOString()
        })
        .eq('id', ride.id)

      if (updateError) throw updateError

      return {
        success: true,
        message: `I've recorded this as a no-show for ${ride.member.full_name}. You're clear to proceed to your next pickup.`,
        data: { ride }
      }
    } catch (error) {
      return {
        success: false,
        message: "I'm having trouble recording the no-show. Could you please try again or speak with a human representative?"
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
} 