'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Input } from "@/components/ui/input"
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Member {
  id: string
  member_id?: string
  full_name: string
  email: string
  phone: string
  user_role: 'super_admin' | 'admin' | 'driver' | 'member'
  status: 'active' | 'inactive'
  provider_id?: string
  created_at: string
}

export function MembersDirectory() {
  const [members, setMembers] = useState<Member[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true })

      if (error) {
        throw error
      }

      setMembers(data || [])
    } catch (err) {
      console.error('Error fetching members:', err)
      setError('Failed to load members. Please try again.')
      // Load demo data for development
      setDemoData()
    } finally {
      setIsLoading(false)
    }
  }

  const setDemoData = () => {
    // Sample demo data
    const demoMembers: Member[] = Array(25).fill(null).map((_, index) => ({
      id: `${index + 1}`,
      member_id: `M${100000 + index}`,
      full_name: `Member ${index + 1}`,
      email: `member${index + 1}@example.com`,
      phone: `555-${String(1000 + index).slice(1)}`,
      user_role: index % 5 === 0 ? 'driver' : 'member',
      status: index % 10 === 0 ? 'inactive' : 'active',
      provider_id: index % 3 === 0 ? 'provider-1' : index % 3 === 1 ? 'provider-2' : undefined,
      created_at: new Date(Date.now() - (index * 1000 * 60 * 60 * 24)).toISOString()
    }))

    setMembers(demoMembers)
  }

  const filteredMembers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return members

    return members.filter(member => 
      member.full_name.toLowerCase().includes(query) ||
      member.member_id?.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)
    )
  }, [members, searchQuery])

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Members Directory</CardTitle>
            <CardDescription>
              View and search all members in the system
            </CardDescription>
            <div className="relative w-full mt-4 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500 mr-2"></div>
            <span>Loading members...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-4">
              {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'} found
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No members found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-mono">{member.member_id || '-'}</TableCell>
                        <TableCell className="font-bold">
                          <Link 
                            href={`/super-admin-dashboard/members/${member.id}`}
                            className="text-foreground hover:underline transition-colors"
                          >
                            {member.full_name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            member.user_role === 'driver' ? 'default' :
                            member.user_role === 'admin' ? 'destructive' :
                            member.user_role === 'super_admin' ? 'purple' : 'outline'
                          }
                          className={
                            member.user_role === 'driver' ? 'bg-blue-500 hover:bg-blue-600' : ''
                          }>
                            {member.user_role === 'driver' ? 'Driver' : 
                             member.user_role === 'admin' ? 'Admin' :
                             member.user_role === 'super_admin' ? 'Super Admin' : 'Member'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.status === 'active' ? 'success' : 'destructive'}>
                            {member.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{member.email}</TableCell>
                        <TableCell className="text-muted-foreground">{member.phone}</TableCell>
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
  )
} 