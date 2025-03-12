'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { ArrowLeft, MessageCircle, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface SupportTicket {
  id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  updated_at: string
  provider_id?: string
  provider?: {
    name: string
  }
  created_by: string
  created_by_user?: {
    full_name: string
    email: string
  }
  assigned_to?: string
  assigned_to_user?: {
    full_name: string
  }
  comments: TicketComment[]
}

interface TicketComment {
  id: string
  ticket_id: string
  content: string
  created_at: string
  created_by: string
  created_by_user?: {
    full_name: string
  }
}

interface TicketFormData {
  title: string
  description: string
  priority: SupportTicket['priority']
  provider_id?: string
}

export function AISupport() {
  const router = useRouter()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newTicket, setNewTicket] = useState<TicketFormData>({
    title: '',
    description: '',
    priority: 'medium'
  })
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          provider:transportation_providers(name),
          created_by_user:profiles!support_tickets_created_by_fkey(full_name, email),
          assigned_to_user:profiles!support_tickets_assigned_to_fkey(full_name),
          comments:ticket_comments(
            id,
            content,
            created_at,
            created_by,
            created_by_user:profiles!ticket_comments_created_by_fkey(full_name)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTickets(data)
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast.error('Failed to fetch support tickets')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTicket = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          title: newTicket.title,
          description: newTicket.description,
          priority: newTicket.priority,
          provider_id: newTicket.provider_id,
          status: 'open'
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Support ticket created successfully')
      setIsCreateDialogOpen(false)
      setNewTicket({
        title: '',
        description: '',
        priority: 'medium'
      })
      fetchTickets()
    } catch (error) {
      console.error('Error creating ticket:', error)
      toast.error('Failed to create support ticket')
    }
  }

  const handleAddComment = async () => {
    if (!selectedTicket || !newComment.trim()) return

    try {
      const { error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: selectedTicket.id,
          content: newComment
        })

      if (error) throw error

      toast.success('Comment added successfully')
      setNewComment('')
      fetchTickets()
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    }
  }

  const handleStatusChange = async (ticketId: string, newStatus: SupportTicket['status']) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: newStatus })
        .eq('id', ticketId)

      if (error) throw error

      toast.success('Ticket status updated successfully')
      fetchTickets()
    } catch (error) {
      console.error('Error updating ticket status:', error)
      toast.error('Failed to update ticket status')
    }
  }

  const getPriorityBadgeVariant = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'urgent': return 'destructive'
      case 'high': return 'default'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  const getStatusBadgeVariant = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open': return 'default'
      case 'in_progress': return 'secondary'
      case 'resolved': return 'success'
      case 'closed': return 'outline'
      default: return 'secondary'
    }
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/super-admin')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">AI Support</h1>
            <p className="text-muted-foreground">Manage support tickets and inquiries</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          Create New Ticket
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Tickets</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>{ticket.title}</TableCell>
                      <TableCell>{ticket.provider?.name || 'System'}</TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                          {ticket.priority.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(ticket.status)}>
                          {ticket.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(ticket.created_at), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Similar content for other tabs, filtered by status */}
      </Tabs>

      {/* Create Ticket Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>
              Create a new support ticket for tracking and resolution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Ticket Title"
              value={newTicket.title}
              onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
            />
            <Textarea
              placeholder="Describe the issue..."
              value={newTicket.description}
              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
            />
            {/* Add priority selection */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTicket}>Create Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket Details Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.title}</DialogTitle>
            <DialogDescription>
              Created by {selectedTicket?.created_by_user?.full_name} on{' '}
              {selectedTicket && format(new Date(selectedTicket.created_at), 'PPpp')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Badge variant={getPriorityBadgeVariant(selectedTicket?.priority || 'medium')}>
                {selectedTicket?.priority.toUpperCase()}
              </Badge>
              <Badge variant={getStatusBadgeVariant(selectedTicket?.status || 'open')}>
                {selectedTicket?.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <Card>
              <CardContent className="pt-6">
                <p>{selectedTicket?.description}</p>
              </CardContent>
            </Card>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Comments</h3>
              {selectedTicket?.comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{comment.created_by_user?.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(comment.created_at), 'PPpp')}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2">{comment.content}</p>
                  </CardContent>
                </Card>
              ))}
              <div className="flex space-x-2">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button onClick={handleAddComment}>Add Comment</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 