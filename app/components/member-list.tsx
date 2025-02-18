"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Member {
  id: number
  name: string
  username: string
  password: string
  email: string
  phone: string
}

export function MemberList() {
  const [members, setMembers] = useState<Member[]>([])
  const [editingMember, setEditingMember] = useState<Member | null>(null)

  useEffect(() => {
    const storedMembers = JSON.parse(localStorage.getItem("members") || "[]")
    setMembers(storedMembers)
  }, [])

  const handleEdit = (member: Member) => {
    setEditingMember(member)
  }

  const handleSave = () => {
    if (editingMember) {
      const updatedMembers = members.map((m) => (m.id === editingMember.id ? editingMember : m))
      setMembers(updatedMembers)
      localStorage.setItem("members", JSON.stringify(updatedMembers))
      setEditingMember(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Member List</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.name}</TableCell>
                <TableCell>{member.username}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{member.phone}</TableCell>
                <TableCell>
                  <Button onClick={() => handleEdit(member)}>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {editingMember && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Edit Member</h3>
            <div className="space-y-2">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={editingMember.username}
                  onChange={(e) => setEditingMember({ ...editingMember, username: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  value={editingMember.email}
                  onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editingMember.phone}
                  onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-4">
              <Button onClick={() => setEditingMember(null)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

