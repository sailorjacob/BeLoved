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
import { Button } from '@/components/ui/button'
import type { Database } from "@/lib/supabase"
import { toast } from 'sonner'

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

interface AdminMembersDirectoryProps {
  providerId?: string;
  onViewProfile?: (memberId: string) => void;
}

export function AdminMembersDirectory({ providerId, onViewProfile }: AdminMembersDirectoryProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  useEffect(() => {
    console.log("AdminMembersDirectory mounted, providerId:", providerId);
    fetchMembers()
  }, [providerId])

  const fetchMembers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setDebugInfo(null)

      console.log("Fetching members with providerId:", providerId);

      let query = supabase
        .from('profiles')
        .select('*')
        .eq('user_role', 'member');
      
      // Only filter by provider if providerId is provided
      if (providerId) {
        console.log("Adding provider filter:", providerId);
        query = query.eq('provider_id', providerId);
      }

      const { data, error, status } = await query;

      console.log("Supabase response status:", status);
      console.log("Supabase response error:", error);
      console.log("Supabase response data length:", data?.length);
      console.log("Supabase response first item:", data?.[0]);
      
      setDebugInfo(`Status: ${status}, Data count: ${data?.length || 0}`);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        console.log("No members found");
        setMembers([]);
        setError("No members found in your organization.");
        setIsLoading(false);
        return;
      }

      setMembers(data as Member[]);
    } catch (err: any) {
      console.error('Error fetching members:', err);
      setError(`Failed to load members: ${err.message || 'Unknown error'}`);
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredMembers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return members;

    return members.filter(member => 
      member.full_name?.toLowerCase().includes(query) ||
      member.member_id?.toLowerCase().includes(query) ||
      member.email?.toLowerCase().includes(query) ||
      member.phone?.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Member Directory</CardTitle>
            <CardDescription>
              View and manage all members in your organization
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
          <Button onClick={() => window.location.href = '/add-member'}>
            Add New Member
          </Button>
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
            {debugInfo && (
              <p className="text-xs mt-2">Debug info: {debugInfo}</p>
            )}
            <div className="mt-4">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => fetchMembers()}
              >
                Retry
              </Button>
            </div>
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
                    <TableHead>Status</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Actions</TableHead>
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
                          <div className="font-medium">{member.full_name}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.status === 'active' ? 'success' : 'destructive'}>
                            {member.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{member.email}</TableCell>
                        <TableCell className="text-muted-foreground">{member.phone}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewProfile && onViewProfile(member.id)}
                            >
                              Profile
                            </Button>
                          </div>
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
  )
} 