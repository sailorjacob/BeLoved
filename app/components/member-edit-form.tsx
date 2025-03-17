'use client'

import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFormHandling } from '@/hooks/useFormHandling'

interface Member {
  id: string
  full_name: string
  email: string
  phone: string
  user_role: 'super_admin' | 'admin' | 'driver' | 'member'
  status: 'active' | 'inactive'
  provider_id?: string
  home_address?: {
    address: string
    city: string
    state: string
    zip: string
  }
}

interface MemberEditFormProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
  onSuccess?: () => void
}

export function MemberEditForm({ isOpen, onClose, memberId, onSuccess }: MemberEditFormProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [providers, setProviders] = useState<{ id: string; name: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const memberForm = useFormHandling<Omit<Member, 'id'>>({
    initialValues: {
      full_name: '',
      email: '',
      phone: '',
      user_role: 'member',
      status: 'active',
      provider_id: '',
      home_address: {
        address: '',
        city: '',
        state: '',
        zip: '',
      }
    },
    validationRules: {
      full_name: (value) => !value ? 'Full name is required' : undefined,
      email: (value) => {
        if (!value) return 'Email is required'
        if (!/\S+@\S+\.\S+/.test(value)) return 'Email format is invalid'
        return undefined
      },
      phone: (value) => !value ? 'Phone number is required' : undefined,
      user_role: (value) => !value ? 'User role is required' : undefined,
      status: (value) => !value ? 'Status is required' : undefined,
    },
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true)
        setError(null)
        
        // Process home address
        const homeAddress = values.home_address && 
          (values.home_address.address || values.home_address.city || values.home_address.state || values.home_address.zip) 
          ? values.home_address 
          : null;
        
        // Update member in database
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: values.full_name,
            email: values.email,
            phone: values.phone,
            user_role: values.user_role,
            status: values.status,
            provider_id: values.provider_id || null,
            home_address: homeAddress,
            updated_at: new Date().toISOString()
          })
          .eq('id', memberId)
          
        if (error) throw error
        
        toast.success('Member profile updated successfully')
        onClose()
        
        // Refresh parent component if callback provided
        if (onSuccess) {
          onSuccess()
        }
      } catch (error: any) {
        console.error('Error updating member:', error)
        setError(`Failed to update member: ${error.message}`)
        toast.error(`Failed to update member: ${error.message}`)
      } finally {
        setIsSubmitting(false)
      }
    }
  })
  
  // Fetch member data
  useEffect(() => {
    const fetchMemberData = async () => {
      if (!isOpen || !memberId) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch member data
        const { data: member, error: memberError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', memberId)
          .single()
          
        if (memberError) throw memberError
        
        // Fetch providers (for dropdown)
        const { data: providersData, error: providersError } = await supabase
          .from('transportation_providers')
          .select('id, name')
          .order('name', { ascending: true })
          
        if (providersError) throw providersError
        
        setProviders(providersData || [])
        
        // Set form values
        memberForm.setValues({
          full_name: member.full_name,
          email: member.email,
          phone: member.phone,
          user_role: member.user_role,
          status: member.status || 'active',
          provider_id: member.provider_id || '',
          home_address: member.home_address || {
            address: '',
            city: '',
            state: '',
            zip: '',
          }
        })
      } catch (error: any) {
        console.error('Error fetching member data:', error)
        setError(`Failed to load member data: ${error.message}`)
        toast.error(`Failed to load member data: ${error.message}`)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchMemberData()
  }, [isOpen, memberId])
  
  // Helper functions for nested fields
  const updateAddressField = (field: string, value: string) => {
    const currentAddress = memberForm.values.home_address || {
      address: '',
      city: '',
      state: '',
      zip: '',
    }
    
    memberForm.handleChange('home_address', {
      ...currentAddress,
      [field]: value
    })
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Member Profile</DialogTitle>
          <DialogDescription>
            Update the member's information below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-4">
            {error}
            <Button 
              onClick={onClose}
              variant="outline" 
              className="mt-4 w-full"
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={(e) => {
            e.preventDefault()
            memberForm.handleSubmit(e)
          }} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={memberForm.values.full_name}
                    onChange={(e) => memberForm.handleChange('full_name', e.target.value)}
                    placeholder="Full Name"
                  />
                  {memberForm.errors.full_name && (
                    <p className="text-sm text-destructive">{memberForm.errors.full_name}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={memberForm.values.email}
                    onChange={(e) => memberForm.handleChange('email', e.target.value)}
                    placeholder="Email Address"
                  />
                  {memberForm.errors.email && (
                    <p className="text-sm text-destructive">{memberForm.errors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={memberForm.values.phone}
                    onChange={(e) => memberForm.handleChange('phone', e.target.value)}
                    placeholder="Phone Number"
                  />
                  {memberForm.errors.phone && (
                    <p className="text-sm text-destructive">{memberForm.errors.phone}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="provider">Transportation Provider</Label>
                  <Select
                    value={memberForm.values.provider_id}
                    onValueChange={(value) => memberForm.handleChange('provider_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="user_role">User Role</Label>
                  <Select
                    value={memberForm.values.user_role}
                    onValueChange={(value) => memberForm.handleChange('user_role', value as Member['user_role'])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="driver">Driver</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {memberForm.errors.user_role && (
                    <p className="text-sm text-destructive">{memberForm.errors.user_role}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={memberForm.values.status}
                    onValueChange={(value) => memberForm.handleChange('status', value as 'active' | 'inactive')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  {memberForm.errors.status && (
                    <p className="text-sm text-destructive">{memberForm.errors.status}</p>
                  )}
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-4">Home Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={memberForm.values.home_address?.address || ''}
                      onChange={(e) => updateAddressField('address', e.target.value)}
                      placeholder="Street Address"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={memberForm.values.home_address?.city || ''}
                      onChange={(e) => updateAddressField('city', e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={memberForm.values.home_address?.state || ''}
                        onChange={(e) => updateAddressField('state', e.target.value)}
                        placeholder="State"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input
                        id="zip"
                        value={memberForm.values.home_address?.zip || ''}
                        onChange={(e) => updateAddressField('zip', e.target.value)}
                        placeholder="ZIP Code"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
} 