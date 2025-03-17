'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreVertical, Pencil, Trash2, Loader2 } from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type MemberNote = {
  id: string
  member_id: string
  author_id: string
  content: string
  provider_id?: string
  created_at: string
  updated_at: string
  author?: {
    full_name: string
    email: string
  }
}

interface MemberNotesProps {
  memberId: string
  providerId?: string
}

export function MemberNotes({ memberId, providerId }: MemberNotesProps) {
  const [notes, setNotes] = useState<MemberNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false)
  const [isEditNoteOpen, setIsEditNoteOpen] = useState(false)
  const [isDeleteNoteOpen, setIsDeleteNoteOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<MemberNote | null>(null)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [currentUser, setCurrentUser] = useState<{ id: string; full_name: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchNotes()
    fetchCurrentUser()
  }, [memberId])

  const fetchCurrentUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        toast.error('You must be logged in to view notes')
        return
      }
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', session.user.id)
        .single()
        
      if (error) throw error
      
      setCurrentUser(profile)
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const fetchNotes = async () => {
    try {
      setIsLoading(true)
      
      const { data, error } = await supabase
        .from('member_notes')
        .select(`
          *,
          author:profiles!member_notes_author_id_fkey(full_name, email)
        `)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        
      if (error) throw error
      
      setNotes(data || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
      toast.error('Failed to load notes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) {
      toast.error('Note content cannot be empty')
      return
    }
    
    if (!currentUser) {
      toast.error('You must be logged in to add notes')
      return
    }
    
    try {
      setIsSubmitting(true)
      
      const { data, error } = await supabase
        .from('member_notes')
        .insert({
          member_id: memberId,
          author_id: currentUser.id,
          content: newNoteContent.trim(),
          provider_id: providerId
        })
        .select()
        
      if (error) throw error
      
      toast.success('Note added successfully')
      setNewNoteContent('')
      setIsAddNoteOpen(false)
      fetchNotes()
    } catch (error: any) {
      console.error('Error adding note:', error)
      toast.error(`Failed to add note: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateNote = async () => {
    if (!selectedNote) return
    
    if (!newNoteContent.trim()) {
      toast.error('Note content cannot be empty')
      return
    }
    
    try {
      setIsSubmitting(true)
      
      const { error } = await supabase
        .from('member_notes')
        .update({
          content: newNoteContent.trim()
        })
        .eq('id', selectedNote.id)
        
      if (error) throw error
      
      toast.success('Note updated successfully')
      setNewNoteContent('')
      setSelectedNote(null)
      setIsEditNoteOpen(false)
      fetchNotes()
    } catch (error: any) {
      console.error('Error updating note:', error)
      toast.error(`Failed to update note: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteNote = async () => {
    if (!selectedNote) return
    
    try {
      setIsSubmitting(true)
      
      const { error } = await supabase
        .from('member_notes')
        .delete()
        .eq('id', selectedNote.id)
        
      if (error) throw error
      
      toast.success('Note deleted successfully')
      setSelectedNote(null)
      setIsDeleteNoteOpen(false)
      fetchNotes()
    } catch (error: any) {
      console.error('Error deleting note:', error)
      toast.error(`Failed to delete note: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditNoteDialog = (note: MemberNote) => {
    setSelectedNote(note)
    setNewNoteContent(note.content)
    setIsEditNoteOpen(true)
  }

  const openDeleteNoteDialog = (note: MemberNote) => {
    setSelectedNote(note)
    setIsDeleteNoteOpen(true)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a')
    } catch (error) {
      return dateString
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Member Notes</CardTitle>
            <CardDescription>
              Administrative notes about this member
            </CardDescription>
          </div>
          <Button onClick={() => {
            setNewNoteContent('')
            setIsAddNoteOpen(true)
          }}>
            Add Note
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No notes available for this member.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <Card key={note.id} className="bg-muted/30">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center mb-2">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback>{note.author?.full_name ? getInitials(note.author.full_name) : '??'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{note.author?.full_name || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(note.created_at)}
                            {note.created_at !== note.updated_at && ' (edited)'}
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditNoteDialog(note)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openDeleteNoteDialog(note)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="mt-3 whitespace-pre-wrap">{note.content}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Note Dialog */}
      <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>
              Add a new note about this member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea 
              placeholder="Enter your note here..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddNoteOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddNote}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Note'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={isEditNoteOpen} onOpenChange={setIsEditNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>
              Update this note.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea 
              placeholder="Enter your note here..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditNoteOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateNote}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Note'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Note Alert Dialog */}
      <AlertDialog open={isDeleteNoteOpen} onOpenChange={setIsDeleteNoteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNote}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 