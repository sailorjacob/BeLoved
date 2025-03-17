'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { NavigationManager } from "@/app/contexts/auth-context"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { FormInput } from '@/components/ui/form-input'
import { useFormHandling } from '@/hooks/useFormHandling'
import { Switch } from "@/components/ui/switch"
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import Link from "next/link"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Filter, MapPin, ArrowUpDown, Info, ChevronDown, Copy, ExternalLink, UserPlus, Plus, Users, Pencil, Power, CheckCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

interface Provider {
  id: string
  name: string
  organization_code: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  status: 'active' | 'inactive'
}

interface Admin {
  id: string
  full_name: string
  email: string
  phone: string
  username: string
  provider_id?: string
  provider?: Provider
  organization_code?: string
  status: 'active' | 'inactive'
  member_id?: string
  user_role: 'admin' | 'super_admin'
}

interface Member {
  id: string
  full_name: string
  email: string
  phone: string
  username?: string
  user_role: 'member' | 'driver' | 'admin' | 'super_admin'
  status: 'active' | 'inactive'
  provider_id?: string
}

interface ProviderFormData {
  name: string
  organization_code: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
}

interface AdminFormData {
  full_name: string
  email: string
  phone: string
  username: string
  password: string
  provider_id?: string
}

interface ActivityLog {
  id: string
  provider_id: string
  provider_name: string
  action: 'created' | 'updated' | 'deleted' | 'status_changed' | 'admin_created' | 'driver_created' | 'user_promoted_to_admin' | 'user_promoted_to_driver'
  details: string
  created_at: string
  created_by: string
  created_by_id: string
}

interface StaffFormData {
  full_name: string
  email: string
  phone: string
  username: string
  password: string
  provider_id: string
  role: 'admin' | 'driver'
}

interface PromoteUserData {
  user_id: string
  provider_id: string
  role: 'admin' | 'driver'
}

const providerValidationRules = {
  name: (value: string) => {
    if (!value) return 'Provider name is required'
    if (value.length < 2) return 'Provider name must be at least 2 characters'
    return undefined
  },
  organization_code: (value: string) => {
    if (!value) return 'Organization code is required'
    if (value.length < 2) return 'Organization code must be at least 2 characters'
    return undefined
  },
  address: (value: string) => {
    if (!value) return 'Address is required'
    return undefined
  },
  city: (value: string) => {
    if (!value) return 'City is required'
    return undefined
  },
  state: (value: string) => {
    if (!value) return 'State is required'
    if (value.length !== 2) return 'Please use 2-letter state code'
    return undefined
  },
  zip: (value: string) => {
    if (!value) return 'ZIP code is required'
    if (!/^\d{5}(-\d{4})?$/.test(value)) return 'Invalid ZIP code format'
    return undefined
  },
  phone: (value: string) => {
    if (!value) return 'Phone number is required'
    if (!/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(value)) 
      return 'Invalid phone number format (e.g., 555-123-4567)'
    return undefined
  }
}

const adminValidationRules = {
  full_name: (value: string) => {
    if (!value) return 'Name is required'
    if (value.length < 2) return 'Name must be at least 2 characters'
    return undefined
  },
  email: (value: string) => {
    if (!value) return 'Email is required'
    if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format'
    return undefined
  },
  phone: (value: string) => {
    if (!value) return 'Phone number is required'
    if (!/^\+?[\d\s-]{10,}$/.test(value)) return 'Invalid phone number format'
    return undefined
  },
  username: (value: string) => {
    if (!value) return 'Username is required'
    if (value.length < 3) return 'Username must be at least 3 characters'
    return undefined
  },
  password: (value: string) => {
    if (!value) return 'Password is required'
    if (value.length < 6) return 'Password must be at least 6 characters'
    return undefined
  }
}

export function ProviderManagement() {
  const router = useRouter()
  const [providers, setProviders] = useState<Provider[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false)
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [isStatusUpdateDialogOpen, setIsStatusUpdateDialogOpen] = useState(false)
  const [providerToUpdate, setProviderToUpdate] = useState<Provider | null>(null)
  const [isUsingDemoData, setIsUsingDemoData] = useState(false)
  const fetchAttemptedRef = useRef(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isEditProviderDialogOpen, setIsEditProviderDialogOpen] = useState(false)
  const [providerToEdit, setProviderToEdit] = useState<Provider | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sorting, setSorting] = useState<{ column: string; direction: 'asc' | 'desc' }>({
    column: 'name',
    direction: 'asc'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [showActivityLog, setShowActivityLog] = useState(false)
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false)
  const [staffMode, setStaffMode] = useState<'create' | 'promote'>('create')
  const [staffRole, setStaffRole] = useState<'admin' | 'driver'>('admin')
  const [searchResults, setSearchResults] = useState<Member[]>([])
  const [selectedUser, setSelectedUser] = useState<Member | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchData()
    fetchActivityLogs()
  }, [])

  const fetchData = async () => {
    try {
      if (fetchAttemptedRef.current) return;
      fetchAttemptedRef.current = true;
      setIsLoading(true)
      setError(null)

      // Fetch providers
      const { data: providersData, error: providersError } = await supabase
        .from('transportation_providers')
        .select('*')
        .order('name')
      
      if (providersError) throw providersError
      
      // Map providers to proper format
      const mappedProviders = providersData.map(provider => ({
        id: provider.id,
        name: provider.name,
        organization_code: provider.organization_code,
        address: provider.address,
        city: provider.city,
        state: provider.state,
        zip: provider.zip,
        phone: provider.phone,
        status: provider.status
      }))
      
      setProviders(mappedProviders)
      
      // Fetch admins - Note: in a real app, you'd fetch admin users differently
      // This is just fetching all users with admin/super_admin roles from profiles table
      const { data: adminsData, error: adminsError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          phone,
          user_role,
          provider_id,
          status,
          member_id,
          organization_code
        `)
        .in('user_role', ['admin', 'super_admin'])
      
      if (adminsError) throw adminsError
      
      // Map admin profiles to the required format
      const mappedAdmins = adminsData.map(admin => {
        const provider = mappedProviders.find(p => p.id === admin.provider_id)
        
        return {
          id: admin.id,
          full_name: admin.full_name,
          email: admin.email,
          phone: admin.phone,
          username: admin.email.split('@')[0], // Just use the first part of email as username
          provider_id: admin.provider_id,
          provider: provider,
          organization_code: admin.organization_code || provider?.organization_code,
          status: admin.status || 'active',
          member_id: admin.member_id,
          user_role: admin.user_role
        }
      })
      
      setAdmins(mappedAdmins)
    } catch (error) {
      console.error('[ProviderManagement] Error fetching data:', error)
      toast.error('Failed to fetch data - using demo data instead')
      setError('Failed to fetch provider data. Using demo data instead.')
      // Load demo data as fallback
      setIsUsingDemoData(true)
      setDemoData()
    } finally {
      setIsLoading(false)
    }
  }

  const setDemoData = () => {
    // Set some sample demo data
    setProviders([
      {
        id: 'demo-1',
        name: 'Demo Provider 1',
        organization_code: 'DEMO1',
        address: '123 Main St',
        city: 'Anytown',
        state: 'IN',
        zip: '47401',
        phone: '555-123-4567',
        status: 'active'
      },
      {
        id: 'demo-2',
        name: 'Demo Provider 2',
        organization_code: 'DEMO2',
        address: '456 Oak Ave',
        city: 'Somewhere',
        state: 'IN',
        zip: '47403',
        phone: '555-234-5678',
        status: 'inactive'
      }
    ])

    setAdmins([
      {
        id: 'admin-1',
        full_name: 'Demo Admin 1',
        email: 'admin1@example.com',
        phone: '555-123-4567',
        username: 'admin1',
        provider_id: 'demo-1',
        organization_code: 'DEMO1',
        provider: {
          id: 'demo-1',
          name: 'Demo Provider 1',
          organization_code: 'DEMO1',
          address: '123 Main St',
          city: 'Anytown',
          state: 'IN',
          zip: '47401',
          phone: '555-123-4567',
          status: 'active'
        },
        status: 'active',
        member_id: 'A100001',
        user_role: 'admin'
      },
      {
        id: 'admin-2',
        full_name: 'Demo Admin 2',
        email: 'admin2@example.com',
        phone: '555-234-5678',
        username: 'admin2',
        provider_id: 'demo-2',
        organization_code: 'DEMO2',
        provider: {
          id: 'demo-2',
          name: 'Demo Provider 2',
          organization_code: 'DEMO2',
          address: '456 Oak Ave',
          city: 'Somewhere',
          state: 'IN',
          zip: '47403',
          phone: '555-234-5678',
          status: 'inactive'
        },
        status: 'active',
        member_id: 'A100002',
        user_role: 'admin'
      },
      {
        id: 'admin-3',
        full_name: 'Super Admin',
        email: 'superadmin@example.com',
        phone: '555-345-6789',
        username: 'superadmin',
        provider_id: undefined,
        organization_code: 'SYSTEM',
        status: 'active',
        member_id: 'SA100001',
        user_role: 'super_admin'
      }
    ])
  }

  const providerForm = useFormHandling<ProviderFormData>({
    initialValues: {
      name: '',
      organization_code: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      phone: ''
    },
    validationRules: providerValidationRules,
    onSubmit: async (values) => {
      try {
        console.log('[ProviderManagement] Attempting to create provider:', values)
        const { data, error } = await supabase
          .from('transportation_providers')
          .insert([{
            name: values.name,
            organization_code: values.organization_code,
            address: values.address,
            city: values.city,
            state: values.state,
            zip: values.zip,
            phone: values.phone,
            status: 'active'
          }])
          .select()

        if (error) {
          console.error('[ProviderManagement] Error creating provider:', error)
          throw error
        }

        console.log('[ProviderManagement] Provider created successfully:', data)
        toast.success('Transportation provider created successfully')
        setIsProviderDialogOpen(false)
        providerForm.resetForm()
        
        // Reset the fetch attempt flag so we can fetch again
        fetchAttemptedRef.current = false
        fetchData()
      } catch (error) {
        console.error('[ProviderManagement] Error creating provider:', error)
        toast.error('Failed to create provider')
      }
    }
  })

  const adminForm = useFormHandling<AdminFormData>({
    initialValues: {
      full_name: '',
      email: '',
      phone: '',
      username: '',
      password: '',
      provider_id: undefined
    },
    validationRules: adminValidationRules,
    onSubmit: async (values) => {
      try {
        // Use the selected provider's ID if available
        const providerIdToUse = selectedProvider?.id || values.provider_id;
        
        if (!providerIdToUse) {
          throw new Error('Please select a provider')
        }

        // Get the provider object to access its organization_code
        const provider = providers.find(p => p.id === providerIdToUse);
        if (!provider) {
          throw new Error('Provider not found')
        }

        console.log('[ProviderManagement] Creating admin for provider:', providerIdToUse);

        // Show processing state
        toast.loading('Creating admin account...')

        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              full_name: values.full_name,
              user_role: 'admin'
            }
          }
        })

        if (authError) {
          // If there's an authentication error, it might be a permission issue
          // However, we should still show an error to the user
          console.error('Auth error creating user:', authError)
          throw new Error(`Failed to create user account: ${authError.message}`)
        }

        if (!authData.user) throw new Error('No user returned from sign up')

        // 2. Create admin profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            full_name: values.full_name,
            email: values.email,
            phone: values.phone,
            username: values.username,
            user_role: 'admin',
            provider_id: providerIdToUse,
            organization_code: provider.organization_code,
            status: 'active'
          })

        if (profileError) throw profileError

        // Clear loading toast and show success
        toast.dismiss()
        toast.success('Admin account created successfully! A confirmation email has been sent.', {
          duration: 5000,
          description: `${values.full_name} can now confirm their email and log in.`
        })
        
        // Close dialog with a slight delay for better UX
        setTimeout(() => {
          setIsAdminDialogOpen(false)
          adminForm.resetForm()
          fetchData()
        }, 1000)
      } catch (error) {
        // Clear loading toast and show error
        toast.dismiss()
        console.error('Error creating admin:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to create admin account', {
          duration: 5000
        })
      }
    }
  })

  const handleStatusToggle = async (provider: Provider) => {
    setProviderToUpdate(provider)
    setIsStatusUpdateDialogOpen(true)
  }

  const handleConfirmStatusUpdate = async () => {
    if (!providerToUpdate) return

    try {
      const newStatus = providerToUpdate.status === 'active' ? 'inactive' : 'active'
      
      // Update provider status
      const { error: providerError } = await supabase
        .from('transportation_providers')
        .update({ status: newStatus })
        .eq('id', providerToUpdate.id)

      if (providerError) throw providerError

      // Update associated admin accounts status
      const { error: adminError } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('provider_id', providerToUpdate.id)
        .eq('user_role', 'admin')

      if (adminError) throw adminError

      // Log the activity
      await logActivity(
        providerToUpdate.id,
        providerToUpdate.name,
        'status_changed',
        `Provider status changed from ${providerToUpdate.status} to ${newStatus}`
      )

      toast.success(`Provider ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`)
      setIsStatusUpdateDialogOpen(false)
      setProviderToUpdate(null)
      fetchData()
      fetchActivityLogs() // Refresh activity logs
    } catch (error) {
      console.error('Error updating provider status:', error)
      toast.error('Failed to update provider status')
    }
  }

  const handleEditProvider = async (values: ProviderFormData) => {
    if (!providerToEdit) return

    try {
      console.log('[ProviderManagement] Attempting to update provider:', values)
      const { error } = await supabase
        .from('transportation_providers')
        .update({
          name: values.name,
          organization_code: values.organization_code,
          address: values.address,
          city: values.city,
          state: values.state,
          zip: values.zip,
          phone: values.phone
        })
        .eq('id', providerToEdit.id)

      if (error) {
        console.error('[ProviderManagement] Error updating provider:', error)
        throw error
      }

      // Log the activity
      await logActivity(
        providerToEdit.id,
        values.name,
        'updated',
        `Updated provider details: ${values.name} (${values.organization_code})`
      )

      toast.success('Transportation provider updated successfully')
      setIsEditProviderDialogOpen(false)
      // Reset the fetch attempt flag so we can fetch again
      fetchAttemptedRef.current = false
      fetchData()
      fetchActivityLogs() // Refresh activity logs
    } catch (error) {
      console.error('[ProviderManagement] Error updating provider:', error)
      toast.error('Failed to update provider')
    }
  }

  const handleDeleteProvider = async () => {
    if (!providerToEdit) return

    try {
      setIsDeleting(true)
      setDeleteError(null)

      // First verify the super admin password
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) throw new Error("Authentication error")
      
      // Verify the password with Supabase Auth
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: deletePassword
      })

      if (signInError) {
        setDeleteError("Incorrect password. Please try again.")
        return
      }

      // Check if this provider has any admins
      const providerAdmins = admins.filter(admin => 
        admin.provider_id === providerToEdit.id
      )
      
      if (providerAdmins.length > 0) {
        throw new Error("Cannot delete provider with active admins. Please reassign or delete the admin accounts first.")
      }

      // Delete the provider
      const { error: deleteError } = await supabase
        .from('transportation_providers')
        .delete()
        .eq('id', providerToEdit.id)

      if (deleteError) throw deleteError

      toast.success('Provider deleted successfully')
      setIsDeleteDialogOpen(false)
      setIsEditProviderDialogOpen(false)
      fetchAttemptedRef.current = false
      fetchData()
    } catch (error: any) {
      console.error('[ProviderManagement] Error deleting provider:', error)
      setDeleteError(error.message || 'Failed to delete provider')
      toast.error(error.message || 'Failed to delete provider')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtered and sorted providers
  const filteredProviders = useMemo(() => {
    return providers
      .filter(provider => {
        // Status filter
        if (statusFilter !== 'all' && provider.status !== statusFilter) {
          return false
        }
        
        // Search query filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          return (
            provider.name.toLowerCase().includes(query) ||
            provider.organization_code.toLowerCase().includes(query) ||
            provider.address.toLowerCase().includes(query) ||
            provider.city.toLowerCase().includes(query) ||
            provider.state.toLowerCase().includes(query) ||
            provider.zip.toLowerCase().includes(query)
          )
        }
        
        return true
      })
      .sort((a, b) => {
        // Handle sorting
        const { column, direction } = sorting
        
        if (column === 'adminCount') {
          const aAdmins = admins.filter(admin => admin.provider_id === a.id).length
          const bAdmins = admins.filter(admin => admin.provider_id === b.id).length
          
          return direction === 'asc'
            ? aAdmins - bAdmins
            : bAdmins - aAdmins
        }
        
        if (column === 'status') {
          return direction === 'asc'
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status)
        }
        
        // Default sorting for name, organization_code, address
        const aValue = a[column as keyof typeof a] || ''
        const bValue = b[column as keyof typeof b] || ''
        
        return direction === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue))
      })
  }, [providers, admins, statusFilter, searchQuery, sorting])
  
  // Pagination
  const paginatedProviders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredProviders.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredProviders, currentPage])
  
  const pageCount = Math.ceil(filteredProviders.length / itemsPerPage)
  
  // Toggle sort direction or set new sort column
  const handleSort = (column: string) => {
    setSorting(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, searchQuery])

  // Add this back after the filteredProviders useMemo
  const filteredAdmins = admins.filter(admin =>
    admin.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add this function to handle checkbox selections
  const toggleProviderSelection = (providerId: string) => {
    setSelectedProviders(prev => 
      prev.includes(providerId)
        ? prev.filter(id => id !== providerId)
        : [...prev, providerId]
    )
  }
  
  // Add this function to handle bulk selection
  const toggleAllProviders = () => {
    if (selectedProviders.length === paginatedProviders.length) {
      setSelectedProviders([])
    } else {
      setSelectedProviders(paginatedProviders.map(p => p.id))
    }
  }
  
  // Add this function to handle bulk status changes
  const bulkUpdateStatus = async (status: 'active' | 'inactive') => {
    if (selectedProviders.length === 0) return
    
    try {
      // Update each selected provider
      for (const providerId of selectedProviders) {
        await supabase
          .from('transportation_providers')
          .update({ status })
          .eq('id', providerId)
          
        // Also update associated admin accounts
        await supabase
          .from('profiles')
          .update({ status })
          .eq('provider_id', providerId)
          .eq('user_role', 'admin')
      }
      
      toast.success(`${selectedProviders.length} providers ${status === 'active' ? 'activated' : 'deactivated'}`)
      setSelectedProviders([])
      fetchData()
    } catch (error) {
      console.error(`[ProviderManagement] Error bulk updating status:`, error)
      toast.error('Failed to update providers')
    }
  }
  
  // Add this function to export selected providers
  const exportProviders = () => {
    if (selectedProviders.length === 0) return
    
    const selectedData = providers
      .filter(p => selectedProviders.includes(p.id))
      .map(p => ({
        name: p.name,
        organization_code: p.organization_code,
        address: p.address,
        city: p.city,
        state: p.state,
        zip: p.zip,
        phone: p.phone,
        status: p.status,
        admin_count: admins.filter(a => a.provider_id === p.id).length
      }))
    
    const csv = [
      // Header row
      Object.keys(selectedData[0]).join(','),
      // Data rows
      ...selectedData.map(item => Object.values(item).join(','))
    ].join('\n')
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'providers-export.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success(`${selectedProviders.length} providers exported to CSV`)
  }
  
  // Clear selections when filters or pagination changes
  useEffect(() => {
    setSelectedProviders([])
  }, [statusFilter, searchQuery, currentPage])

  // Add provider statistics calculation
  const providerStats = useMemo(() => {
    const activeCount = providers.filter(p => p.status === 'active').length
    const inactiveCount = providers.length - activeCount
    
    const providersByCityMap = providers.reduce((acc, provider) => {
      const city = provider.city
      if (!acc[city]) acc[city] = 0
      acc[city]++
      return acc
    }, {} as Record<string, number>)
    
    const providersByCity = Object.entries(providersByCityMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5) // Top 5 cities
    
    // Calculate admin distribution
    const providersWithAdmins = providers.map(provider => {
      const adminCount = admins.filter(admin => admin.provider_id === provider.id).length
      return {
        name: provider.name,
        adminCount
      }
    }).sort((a, b) => b.adminCount - a.adminCount).slice(0, 5) // Top 5 providers by admin count
    
    return {
      total: providers.length,
      active: activeCount,
      inactive: inactiveCount,
      activePercentage: providers.length > 0 ? (activeCount / providers.length) * 100 : 0,
      providersByCity,
      providersWithAdmins
    }
  }, [providers, admins])

  // Add function to fetch activity logs
  const fetchActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('provider_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
        
      if (error) throw error
      
      if (data) {
        setActivityLogs(data as ActivityLog[])
      }
    } catch (error) {
      console.error('[ProviderManagement] Error fetching activity logs:', error)
      toast.error('Failed to load activity logs')
    }
  }
  
  // Add function to log activity
  const logActivity = async (
    providerId: string,
    providerName: string,
    action: ActivityLog['action'],
    details: string | object
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return
      
      await supabase.from('provider_activity_logs').insert({
        provider_id: providerId,
        provider_name: providerName,
        action,
        details,
        created_by: user.email,
        created_by_id: user.id
      })
    } catch (error) {
      console.error('[ProviderManagement] Error logging activity:', error)
    }
  }

  const staffForm = useFormHandling<StaffFormData>({
    initialValues: {
      full_name: '',
      email: '',
      phone: '',
      username: '',
      password: '',
      provider_id: '',
      role: 'admin'
    },
    validationRules: {
      full_name: (value) => !value ? 'Full name is required' : undefined,
      email: (value) => {
        if (!value) return 'Email is required'
        if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format'
        return undefined
      },
      phone: (value) => {
        if (!value) return 'Phone number is required'
        if (!/^\+?[\d\s-]{10,}$/.test(value)) return 'Invalid phone format'
        return undefined
      },
      username: (value) => !value ? 'Username is required' : undefined,
      password: (value) => !value ? 'Password is required' : value.length < 6 ? 'Password must be at least 6 characters' : undefined,
      provider_id: (value) => !value ? 'Provider is required' : undefined,
      role: (value) => !value ? 'Role is required' : undefined
    },
    onSubmit: async (values) => {
      try {
        // Find the provider to get its organization code
        const provider = providers.find(p => p.id === values.provider_id)
        if (!provider) {
          throw new Error('Provider not found')
        }

        // Show loading toast
        toast.loading(`Creating ${values.role} account...`)

        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              full_name: values.full_name,
              user_role: values.role
            }
          }
        })

        if (authError) {
          // If there's an authentication error, it might be a permission issue
          // However, we should still show an error to the user
          console.error('Auth error creating user:', authError)
          throw new Error(`Failed to create user account: ${authError.message}`)
        }

        if (!authData.user) throw new Error('No user returned from sign up')

        // 2. Create profile record
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            full_name: values.full_name,
            email: values.email,
            phone: values.phone,
            username: values.username,
            user_role: values.role,
            provider_id: values.provider_id,
            organization_code: provider.organization_code,
            status: 'active'
          })

        if (profileError) throw profileError

        // 3. If creating a driver, add driver-specific data
        if (values.role === 'driver') {
          const { error: driverProfileError } = await supabase
            .from('driver_profiles')
            .insert({
              id: authData.user.id,
              status: 'active',
              completed_rides: 0,
              total_miles: 0
            })

          if (driverProfileError) throw driverProfileError
        }

        // 4. Log the activity
        await logActivity(values.provider_id, provider.name, 
          `${values.role}_created`, 
          { user: values.full_name, email: values.email }
        )

        // Clear loading toast and show success
        toast.dismiss()
        toast.success(`${values.role.charAt(0).toUpperCase() + values.role.slice(1)} account created successfully!`, {
          duration: 5000,
          description: `${values.full_name} can now confirm their email and log in.`
        })
        
        // Close dialog
        setTimeout(() => {
          setIsStaffDialogOpen(false)
          staffForm.resetForm()
          fetchData()
        }, 1000)
      } catch (error) {
        toast.dismiss()
        console.error(`Error creating ${values.role}:`, error)
        toast.error(error instanceof Error ? error.message : `Failed to create ${values.role} account`, {
          duration: 5000
        })
      }
    }
  })

  // Add the search and promote functionality
  const handleSearchUsers = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    
    // Clear previous timeout if it exists
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Set a new timeout to delay the search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
          .in('user_role', ['member', 'driver', 'admin'])  // Only search for users who can be promoted
          .order('full_name', { ascending: true })
          .limit(10)

        if (error) throw error
        setSearchResults(data || [])
      } catch (error) {
        console.error('Error searching users:', error)
        toast.error('Failed to search users')
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 500)  // 500ms delay to avoid too many requests
  }

  const handlePromoteUser = async () => {
    if (!selectedUser || !selectedProvider) {
      toast.error('Please select a user and provider')
      return
    }

    try {
      // Show loading toast
      toast.loading(`Updating user role...`)

      // Find the provider to get its organization code
      const provider = providers.find(p => p.id === selectedProvider.id)
      if (!provider) {
        throw new Error('Provider not found')
      }

      // Update the user's profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          user_role: staffRole,
          provider_id: selectedProvider.id,
          organization_code: provider.organization_code
        })
        .eq('id', selectedUser.id)

      if (updateError) throw updateError

      // If promoting to driver, create driver_profile if it doesn't exist
      if (staffRole === 'driver') {
        // First check if driver profile exists
        const { data: existingProfile } = await supabase
          .from('driver_profiles')
          .select('id')
          .eq('id', selectedUser.id)
          .single()

        if (!existingProfile) {
          const { error: driverProfileError } = await supabase
            .from('driver_profiles')
            .insert({
              id: selectedUser.id,
              status: 'active',
              completed_rides: 0,
              total_miles: 0
            })

          if (driverProfileError) throw driverProfileError
        }
      }

      // Update the auth metadata
      try {
        // First try the admin API for super admins
        const { error: authMetadataError } = await supabase.auth.admin.updateUserById(
          selectedUser.id,
          { user_metadata: { user_role: staffRole } }
        )
        
        if (authMetadataError) {
          console.log('Admin API not available, using fallback method')
          // This will be caught and we'll continue with the success flow
          throw authMetadataError
        }
      } catch (error) {
        // Log the error but don't fail the whole operation
        // The profile update still worked, which is the most important part
        console.log('Could not update auth metadata, but profile was updated successfully:', error)
      }

      // Log the activity
      await logActivity(
        selectedProvider.id,
        selectedProvider.name,
        `user_promoted_to_${staffRole}`,
        { 
          user: selectedUser.full_name, 
          email: selectedUser.email,
          previous_role: selectedUser.user_role
        }
      )

      // Clear loading toast and show success
      toast.dismiss()
      toast.success(`User successfully assigned as ${staffRole}`, {
        duration: 5000,
        description: `${selectedUser.full_name} is now a ${staffRole} for ${provider.name}.`
      })
      
      // Close dialog
      setTimeout(() => {
        setIsStaffDialogOpen(false)
        setSelectedUser(null)
        setSearchQuery('')
        setSearchResults([])
        fetchData()
      }, 1000)
    } catch (error) {
      toast.dismiss()
      console.error(`Error promoting user:`, error)
      toast.error(error instanceof Error ? error.message : `Failed to update user role`, {
        duration: 5000
      })
    }
  }

  const openStaffDialog = (provider: Provider, mode: 'create' | 'promote', role: 'admin' | 'driver') => {
    setSelectedProvider(provider)
    setStaffMode(mode)
    setStaffRole(role)
    
    if (mode === 'create') {
      staffForm.handleChange('provider_id', provider.id)
      staffForm.handleChange('role', role)
    } else {
      setSelectedUser(null)
      setSearchQuery('')
      setSearchResults([])
    }
    
    setIsStaffDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Demo data notice */}
      {isUsingDemoData && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <h3 className="text-md font-medium text-blue-800">Demo Mode</h3>
          <p className="text-sm text-blue-700 mt-1">
            Showing demo data. In production, this page will display and allow management of actual transportation providers.
          </p>
        </div>
      )}

      {/* Provider Statistics Dashboard */}
      {providers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Provider Statistics</CardTitle>
            <CardDescription>
              Overview of your transportation provider network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Provider Status Distribution */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Provider Status</h3>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Active', value: providerStats.active },
                          { name: 'Inactive', value: providerStats.inactive }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={60}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell key="active" fill="#10b981" />
                        <Cell key="inactive" fill="#6b7280" />
                      </Pie>
                      <RechartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <div>Total Providers: {providerStats.total}</div>
                  <div>Active: {providerStats.active}</div>
                </div>
              </div>
              
              {/* Top Cities */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Top Provider Locations</h3>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={providerStats.providersByCity}
                      margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    >
                      <RechartTooltip />
                      <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]}>
                        {providerStats.providersByCity.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#ef4444' : '#f87171'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-sm text-muted-foreground">
                  Cities with most providers
                </div>
              </div>
              
              {/* Providers with Most Admins */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Admin Distribution</h3>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={providerStats.providersWithAdmins}
                      margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                      layout="vertical"
                    >
                      <RechartTooltip />
                      <Bar dataKey="adminCount" fill="#8884d8" radius={[0, 4, 4, 0]}>
                        {providerStats.providersWithAdmins.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8884d8' : '#a78bfa'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-sm text-muted-foreground">
                  Providers with most admin accounts
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Providers Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transportation Providers</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Manage your transportation providers and their administrators
            </p>
          </div>
          <Button onClick={() => setIsProviderDialogOpen(true)}>
            Add New Provider
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
            <div className="flex gap-2 items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1">
                    <Filter className="h-3.5 w-3.5" />
                    <span>Status: {statusFilter === 'all' ? 'All' : statusFilter}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
                    Inactive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {selectedProviders.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1">
                      Bulk Actions ({selectedProviders.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => bulkUpdateStatus('active')}>
                      Activate Providers
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => bulkUpdateStatus('inactive')}>
                      Deactivate Providers
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportProviders}>
                      Export to CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <div className="text-sm text-muted-foreground">
                {filteredProviders.length} providers found
              </div>
            </div>
            
            <div className="relative w-full sm:w-auto max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search providers..."
                className="pl-8 h-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={paginatedProviders.length > 0 && selectedProviders.length === paginatedProviders.length}
                      onChange={toggleAllProviders}
                    />
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      Name
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      {sorting.column === 'name' && (
                        <span className="text-xs">{sorting.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('organization_code')}>
                    <div className="flex items-center gap-1">
                      Organization Code
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      {sorting.column === 'organization_code' && (
                        <span className="text-xs">{sorting.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">
                      Status
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      {sorting.column === 'status' && (
                        <span className="text-xs">{sorting.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('adminCount')}>
                    <div className="flex items-center gap-1">
                      Admin Count
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      {sorting.column === 'adminCount' && (
                        <span className="text-xs">{sorting.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProviders.length > 0 ? (
                  paginatedProviders.map((provider) => {
                    const providerAdmins = admins.filter(admin => 
                      admin.provider_id === provider.id
                    )
                    return (
                      <TableRow key={provider.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={selectedProviders.includes(provider.id)}
                            onChange={() => toggleProviderSelection(provider.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link 
                            href={`/provider/${provider.id}/details`}
                            className="text-foreground font-bold hover:underline transition-colors"
                          >
                            {provider.name}
                          </Link>
                        </TableCell>
                        <TableCell>{provider.organization_code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{`${provider.address}, ${provider.city}, ${provider.state} ${provider.zip}`}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant={provider.status === 'active' ? 'success' : 'secondary'}>
                                  {provider.status}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                {provider.status === 'active' 
                                  ? 'Provider is active and can access the system'
                                  : 'Provider is inactive and cannot access the system'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>{providerAdmins.length}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1"
                              >
                                Actions <ChevronDown className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px]">
                              <DropdownMenuItem onSelect={() => setSelectedProvider(provider)}>
                                <Link href={`/provider/${provider.id}/details`} className="flex items-center w-full">
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => {
                                setProviderToEdit(provider)
                                setIsEditProviderDialogOpen(true)
                              }}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Provider
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleStatusToggle(provider)}>
                                <Power className="mr-2 h-4 w-4" />
                                {provider.status === 'active' ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                              
                              {/* Add new menu divider and staff management options */}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <button 
                                  className="flex items-center w-full cursor-pointer" 
                                  onClick={() => openStaffDialog(provider, 'create', 'admin')}
                                >
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Add New Admin
                                </button>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <button 
                                  className="flex items-center w-full cursor-pointer" 
                                  onClick={() => openStaffDialog(provider, 'create', 'driver')}
                                >
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Add New Driver
                                </button>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <button 
                                  className="flex items-center w-full cursor-pointer" 
                                  onClick={() => openStaffDialog(provider, 'promote', 'admin')}
                                >
                                  <Users className="mr-2 h-4 w-4" />
                                  Promote to Admin
                                </button>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <button 
                                  className="flex items-center w-full cursor-pointer" 
                                  onClick={() => openStaffDialog(provider, 'promote', 'driver')}
                                >
                                  <Users className="mr-2 h-4 w-4" />
                                  Promote to Driver
                                </button>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <p className="text-muted-foreground">
                          {searchQuery || statusFilter !== 'all' 
                            ? 'No providers match your search criteria' 
                            : 'No providers found'}
                        </p>
                        {!searchQuery && statusFilter === 'all' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsProviderDialogOpen(true)}
                          >
                            Add Your First Provider
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {pageCount > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: pageCount }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      onClick={() => setCurrentPage(i + 1)}
                      isActive={currentPage === i + 1}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
                    className={currentPage === pageCount ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>

      {/* Admins Section with Enhanced Filtering */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Provider Admins</CardTitle>
              <CardDescription>
                View and manage administrator accounts for all providers
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-auto max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500 mr-2"></div>
              <span>Loading admins...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
              <p>{error}</p>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-4">
                {filteredAdmins.length} {filteredAdmins.length === 1 ? 'admin' : 'admins'} found
              </div>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Org Code</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdmins.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          No admins found matching your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAdmins.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell className="font-mono">{admin.member_id || '-'}</TableCell>
                          <TableCell className="font-bold">
                            <Link 
                              href={`/super-admin-dashboard/members/${admin.id}`}
                              className="text-foreground hover:underline transition-colors"
                            >
                              {admin.full_name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              admin.user_role === 'super_admin' ? 'purple' : 'outline'
                            }>
                              {admin.user_role === 'super_admin' ? 'Super Admin' : 'Admin'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={admin.status === 'active' ? 'success' : 'destructive'}>
                              {admin.status === 'active' ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{admin.email}</TableCell>
                          <TableCell className="text-muted-foreground">{admin.phone}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {admin.provider?.name || 'Not assigned'}
                          </TableCell>
                          <TableCell className="text-muted-foreground font-mono">
                            {admin.organization_code || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Status Update Confirmation Dialog */}
      <AlertDialog open={isStatusUpdateDialogOpen} onOpenChange={setIsStatusUpdateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Provider Status</AlertDialogTitle>
            <AlertDialogDescription>
              {providerToUpdate?.status === 'active' 
                ? 'This will deactivate the provider and all associated admin accounts. Are you sure?'
                : 'This will reactivate the provider and all associated admin accounts. Are you sure?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setIsStatusUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant={providerToUpdate?.status === 'active' ? 'destructive' : 'default'}
              onClick={handleConfirmStatusUpdate}
            >
              {providerToUpdate?.status === 'active' ? 'Deactivate' : 'Activate'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Provider Dialog */}
      <Dialog open={isProviderDialogOpen} onOpenChange={setIsProviderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Transportation Provider</DialogTitle>
            <DialogDescription>
              Enter the details for the new transportation provider.
            </DialogDescription>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              providerForm.handleSubmit(e)
            }} 
            className="space-y-4"
          >
            <FormInput
              label="Provider Name"
              name="name"
              value={providerForm.values.name}
              error={providerForm.errors.name}
              onChange={(e) => providerForm.handleChange('name', e.target.value)}
              required
            />
            <FormInput
              label="Organization Code"
              name="organization_code"
              value={providerForm.values.organization_code}
              error={providerForm.errors.organization_code}
              onChange={(e) => providerForm.handleChange('organization_code', e.target.value)}
              required
              placeholder="e.g., BLOOMINGTON1"
            />
            <FormInput
              label="Address"
              name="address"
              value={providerForm.values.address}
              error={providerForm.errors.address}
              onChange={(e) => providerForm.handleChange('address', e.target.value)}
              required
            />
            <FormInput
              label="City"
              name="city"
              value={providerForm.values.city}
              error={providerForm.errors.city}
              onChange={(e) => providerForm.handleChange('city', e.target.value)}
              required
            />
            <FormInput
              label="State"
              name="state"
              value={providerForm.values.state}
              error={providerForm.errors.state}
              onChange={(e) => providerForm.handleChange('state', e.target.value)}
              required
            />
            <FormInput
              label="ZIP Code"
              name="zip"
              value={providerForm.values.zip}
              error={providerForm.errors.zip}
              onChange={(e) => providerForm.handleChange('zip', e.target.value)}
              required
            />
            <FormInput
              label="Phone Number"
              name="phone"
              value={providerForm.values.phone}
              error={providerForm.errors.phone}
              onChange={(e) => providerForm.handleChange('phone', e.target.value)}
              required
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsProviderDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Provider</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Admin Dialog */}
      <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Admin</DialogTitle>
            <DialogDescription>
              Create an admin account for {selectedProvider?.name || 'a transportation provider'}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            // Set the provider_id from selectedProvider when form submits
            if (selectedProvider) {
              adminForm.handleChange('provider_id', selectedProvider.id)
            }
            adminForm.handleSubmit(e)
          }} className="space-y-4">
            {!selectedProvider && (
              <Select 
                onValueChange={(value) => adminForm.handleChange('provider_id', value)}
                value={adminForm.values.provider_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <FormInput
              label="Full Name"
              name="full_name"
              value={adminForm.values.full_name}
              error={adminForm.errors.full_name}
              onChange={(e) => adminForm.handleChange('full_name', e.target.value)}
              required
            />
            <FormInput
              label="Username"
              name="username"
              value={adminForm.values.username}
              error={adminForm.errors.username}
              onChange={(e) => adminForm.handleChange('username', e.target.value)}
              required
            />
            <FormInput
              label="Email"
              name="email"
              type="email"
              value={adminForm.values.email}
              error={adminForm.errors.email}
              onChange={(e) => adminForm.handleChange('email', e.target.value)}
              required
            />
            <FormInput
              label="Phone Number"
              name="phone"
              value={adminForm.values.phone}
              error={adminForm.errors.phone}
              onChange={(e) => adminForm.handleChange('phone', e.target.value)}
              required
            />
            <FormInput
              label="Password"
              name="password"
              type="password"
              value={adminForm.values.password}
              error={adminForm.errors.password}
              onChange={(e) => adminForm.handleChange('password', e.target.value)}
              required
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAdminDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Admin</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Provider Dialog */}
      <Dialog open={isEditProviderDialogOpen} onOpenChange={setIsEditProviderDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Transportation Provider</DialogTitle>
            <DialogDescription>
              Update the details for the selected provider.
            </DialogDescription>
          </DialogHeader>
          {providerToEdit && (
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                // Use the values directly from the form elements
                const formData: ProviderFormData = {
                  name: (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value,
                  organization_code: (e.currentTarget.elements.namedItem('organization_code') as HTMLInputElement).value,
                  address: (e.currentTarget.elements.namedItem('address') as HTMLInputElement).value,
                  city: (e.currentTarget.elements.namedItem('city') as HTMLInputElement).value,
                  state: (e.currentTarget.elements.namedItem('state') as HTMLInputElement).value,
                  zip: (e.currentTarget.elements.namedItem('zip') as HTMLInputElement).value,
                  phone: (e.currentTarget.elements.namedItem('phone') as HTMLInputElement).value
                }
                handleEditProvider(formData)
              }} 
              className="space-y-6"
            >
              <FormInput
                label="Provider Name"
                name="name"
                defaultValue={providerToEdit.name}
                required
              />
              <FormInput
                label="Organization Code"
                name="organization_code"
                defaultValue={providerToEdit.organization_code}
                required
                placeholder="e.g., BLOOMINGTON1"
              />
              <FormInput
                label="Address"
                name="address"
                defaultValue={providerToEdit.address}
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput
                  label="City"
                  name="city"
                  defaultValue={providerToEdit.city}
                  required
                />
                <FormInput
                  label="State"
                  name="state"
                  defaultValue={providerToEdit.state}
                  required
                />
                <FormInput
                  label="ZIP Code"
                  name="zip"
                  defaultValue={providerToEdit.zip}
                  required
                />
              </div>
              <FormInput
                label="Phone Number"
                name="phone"
                defaultValue={providerToEdit.phone}
                required
              />

              <div className="border-t pt-6 mt-6">
                <h3 className="text-base font-medium mb-3">Provider Status Management</h3>
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    variant={providerToEdit.status === 'active' ? 'success' : 'secondary'} 
                    className="text-xs px-2 py-0 h-5"
                  >
                    {providerToEdit.status}
                  </Badge>
                  <Button 
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStatusToggle(providerToEdit)}
                    className={`h-7 px-2 text-xs font-normal ${providerToEdit.status === 'active' ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}`}
                  >
                    {providerToEdit.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  {providerToEdit.status === 'active' 
                    ? 'Deactivating will prevent this provider and its admins from accessing the system.' 
                    : 'Activating will restore access for this provider and its admins.'}
                </p>
              </div>

              <DialogFooter className="flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between pt-6 border-t">
                <div className="flex space-x-2 items-center">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="h-7 px-2 text-xs font-normal text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditProviderDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Provider</Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Confirm Provider Deletion</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the provider and all associated data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="font-medium">
              Are you sure you want to delete {providerToEdit?.name}?
            </p>
            
            <div className="border rounded-md p-4 bg-muted/50">
              <p className="text-sm font-medium mb-2">Please enter your super admin password to confirm:</p>
              <FormInput
                type="password"
                label="Password"
                name="deletePassword"
                id="deletePassword"
                value={deletePassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeletePassword(e.target.value)}
                placeholder="Enter password to confirm"
                required
              />
              {deleteError && (
                <p className="text-sm text-destructive mt-2">{deleteError}</p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProvider}
              disabled={!deletePassword || isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Deleting...
                </>
              ) : (
                "Delete Provider"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add a floating button to show/hide activity log */}
      <div className="fixed bottom-6 right-6 z-10">
        <Button
          onClick={() => setShowActivityLog(prev => !prev)}
          className="rounded-full w-14 h-14 shadow-lg"
          variant={showActivityLog ? "secondary" : "default"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </Button>
      </div>
      
      {/* Activity Log Dialog */}
      <Dialog open={showActivityLog} onOpenChange={setShowActivityLog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Provider Activity Log</DialogTitle>
            <DialogDescription>
              Recent changes to providers and their statuses
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {activityLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No activity logs found
              </div>
            ) : (
              <div className="space-y-4">
                {activityLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-3 space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{log.provider_name}</span>
                      <Badge variant={
                        log.action === 'created' ? 'success' :
                        log.action === 'updated' ? 'default' :
                        log.action === 'deleted' ? 'destructive' :
                        log.action === 'status_changed' ? 'secondary' :
                        log.action === 'admin_created' ? 'outline' :
                        log.action === 'driver_created' ? 'success' :
                        log.action === 'user_promoted_to_admin' ? 'success' :
                        'outline'
                      }>
                        {log.action.toUpperCase().replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.details}</p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>By: {log.created_by}</span>
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => fetchActivityLogs()}>Refresh</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Staff Management Dialog */}
      <Dialog open={isStaffDialogOpen} onOpenChange={setIsStaffDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {staffMode === 'create' 
                ? `Add New ${staffRole.charAt(0).toUpperCase() + staffRole.slice(1)}` 
                : `Promote User to ${staffRole.charAt(0).toUpperCase() + staffRole.slice(1)}`}
            </DialogTitle>
            <DialogDescription>
              {staffMode === 'create' 
                ? `Create a new ${staffRole} account for ${selectedProvider?.name || 'the selected provider'}.`
                : `Assign an existing user as a ${staffRole} for ${selectedProvider?.name || 'the selected provider'}.`}
            </DialogDescription>
          </DialogHeader>

          {staffMode === 'create' ? (
            <form onSubmit={(e) => {
              e.preventDefault()
              staffForm.handleSubmit(e)
            }} className="space-y-4">
              <FormInput
                label="Full Name"
                name="full_name"
                value={staffForm.values.full_name}
                error={staffForm.errors.full_name}
                onChange={(e) => staffForm.handleChange('full_name', e.target.value)}
                required
              />
              <FormInput
                label="Username"
                name="username"
                value={staffForm.values.username}
                error={staffForm.errors.username}
                onChange={(e) => staffForm.handleChange('username', e.target.value)}
                required
              />
              <FormInput
                label="Email"
                name="email"
                type="email"
                value={staffForm.values.email}
                error={staffForm.errors.email}
                onChange={(e) => staffForm.handleChange('email', e.target.value)}
                required
              />
              <FormInput
                label="Phone Number"
                name="phone"
                value={staffForm.values.phone}
                error={staffForm.errors.phone}
                onChange={(e) => staffForm.handleChange('phone', e.target.value)}
                required
              />
              <FormInput
                label="Password"
                name="password"
                type="password"
                value={staffForm.values.password}
                error={staffForm.errors.password}
                onChange={(e) => staffForm.handleChange('password', e.target.value)}
                required
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsStaffDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create {staffRole.charAt(0).toUpperCase() + staffRole.slice(1)}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Search for User</label>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      handleSearchUsers(e.target.value)
                    }}
                  />
                </div>
                {isSearching && (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    <span className="ml-2 text-sm text-gray-500">Searching...</span>
                  </div>
                )}
              </div>

              <div className="max-h-[300px] overflow-y-auto border rounded-md">
                {searchResults.length > 0 ? (
                  <div className="divide-y">
                    {searchResults.map((user) => (
                      <div 
                        key={user.id} 
                        className={`p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                          selectedUser?.id === user.id ? 'bg-gray-100' : ''
                        }`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="flex items-center mt-1">
                            <Badge variant="outline" className="text-xs mr-2">
                              {user.user_role}
                            </Badge>
                            <Badge 
                              variant={user.status === 'active' ? 'success' : 'destructive'}
                              className="text-xs"
                            >
                              {user.status}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          {selectedUser?.id === user.id && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery.length >= 3 ? (
                  <div className="p-4 text-center">
                    <p className="text-gray-500">No users found</p>
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-gray-500">Type at least 3 characters to search</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsStaffDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handlePromoteUser}
                  disabled={!selectedUser}
                >
                  Promote to {staffRole.charAt(0).toUpperCase() + staffRole.slice(1)}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 