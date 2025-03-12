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

  const getPriorityBadgeVariant = (priority: SupportTicket['priority']): "default" | "secondary" | "destructive" | "outline" | "success" | "purple" => {
    const variants: Record<SupportTicket['priority'], "default" | "secondary" | "destructive" | "outline" | "success" | "purple"> = {
      low: 'secondary',
      medium: 'default',
      high: 'secondary',
      urgent: 'destructive'
    }
    return variants[priority]
  }

  const getStatusBadgeVariant = (status: SupportTicket['status']): "default" | "secondary" | "destructive" | "outline" | "success" | "purple" => {
    const variants: Record<SupportTicket['status'], "default" | "secondary" | "destructive" | "outline" | "success" | "purple"> = {
      open: 'secondary',
      in_progress: 'default',
      resolved: 'success',
      closed: 'outline'
    }
    return variants[status]
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
        <span className="ml-2">Loading support tickets...</span>
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

        {/* Open tickets tab */}
        <TabsContent value="open" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets
                    .filter((ticket) => ticket.status === 'open')
                    .map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell>{ticket.title}</TableCell>
                        <TableCell>{ticket.provider?.name || 'System'}</TableCell>
                        <TableCell>
                          <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                            {ticket.priority.toUpperCase()}
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

        {/* Similar filters for in_progress and resolved tabs */}
        <TabsContent value="in_progress" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets
                    .filter((ticket) => ticket.status === 'in_progress')
                    .map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell>{ticket.title}</TableCell>
                        <TableCell>{ticket.provider?.name || 'System'}</TableCell>
                        <TableCell>
                          <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                            {ticket.priority.toUpperCase()}
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

        <TabsContent value="resolved" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets
                    .filter((ticket) => ticket.status === 'resolved')
                    .map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell>{ticket.title}</TableCell>
                        <TableCell>{ticket.provider?.name || 'System'}</TableCell>
                        <TableCell>
                          <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                            {ticket.priority.toUpperCase()}
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
      </Tabs>

      {/* Ticket Detail Dialog */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTicket.title}</DialogTitle>
              <DialogDescription>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge variant={getPriorityBadgeVariant(selectedTicket.priority)}>
                    {selectedTicket.priority.toUpperCase()}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(selectedTicket.status)}>
                    {selectedTicket.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Created: {format(new Date(selectedTicket.created_at), 'PPp')}
                  </span>
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Description</h3>
                <p className="mt-2 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Comments</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <select
                      className="text-sm border rounded p-1"
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusChange(
                        selectedTicket.id, 
                        e.target.value as SupportTicket['status']
                      )}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 border rounded-lg">
                  {selectedTicket.comments && selectedTicket.comments.length > 0 ? (
                    <div className="divide-y">
                      {selectedTicket.comments.map((comment) => (
                        <div key={comment.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {comment.created_by_user?.full_name || 'User'}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(comment.created_at), 'PPp')}
                            </span>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      No comments yet
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Ticket Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Support Ticket</DialogTitle>
            <DialogDescription>
              Provide details about the issue that needs support.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Title
              </label>
              <Input
                id="title"
                value={newTicket.title}
                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                placeholder="Brief summary of the issue"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description
              </label>
              <Textarea
                id="description"
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                placeholder="Detailed explanation of the issue"
                rows={5}
              />
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium mb-1">
                Priority
              </label>
              <select
                id="priority"
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={newTicket.priority}
                onChange={(e) => 
                  setNewTicket({ 
                    ...newTicket, 
                    priority: e.target.value as SupportTicket['priority'] 
                  })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline" 
              onClick={() => {
                setIsCreateDialogOpen(false)
                setNewTicket({
                  title: '',
                  description: '',
                  priority: 'medium'
                })
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTicket}
              disabled={!newTicket.title || !newTicket.description}
            >
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 