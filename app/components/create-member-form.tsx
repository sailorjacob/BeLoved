"use client"

import { useState, ChangeEvent } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/ui/form-input"

interface Member {
  id: number
  name: string
  username: string
  password: string
  email: string
  phone: string
}

export function CreateMemberForm() {
  const [member, setMember] = useState<Member>({
    id: Date.now(),
    name: "",
    username: "",
    password: "",
    email: "",
    phone: "",
  })
  const [errors, setErrors] = useState<Partial<Member>>({})

  const validateForm = () => {
    const newErrors: Partial<Member> = {}
    
    if (!member.name) newErrors.name = "Name is required"
    if (!member.username) newErrors.username = "Username is required"
    if (!member.password) newErrors.password = "Password is required"
    if (!member.email) newErrors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(member.email)) newErrors.email = "Invalid email format"
    if (!member.phone) newErrors.phone = "Phone number is required"
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const members = JSON.parse(localStorage.getItem("members") || "[]")
    members.push(member)
    localStorage.setItem("members", JSON.stringify(members))
    console.log("New member added:", member)
    // Redirect to admin dashboard or show success message
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>, field: keyof Member) => {
    setMember({ ...member, [field]: e.target.value })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Member</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            id="name"
            label="Name"
            value={member.name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(e, "name")}
            error={errors.name}
            required
          />
          
          <FormInput
            id="username"
            label="Username"
            value={member.username}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(e, "username")}
            error={errors.username}
            required
          />
          
          <FormInput
            id="password"
            label="Password"
            type="password"
            value={member.password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(e, "password")}
            error={errors.password}
            required
          />
          
          <FormInput
            id="email"
            label="Email"
            type="email"
            value={member.email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(e, "email")}
            error={errors.email}
            required
          />
          
          <FormInput
            id="phone"
            label="Phone"
            type="tel"
            value={member.phone}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(e, "phone")}
            error={errors.phone}
            required
          />

          <Button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white">
            Create Member
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

