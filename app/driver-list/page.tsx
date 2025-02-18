import { DriverList } from "../components/driver-list"
import { UserNav } from "../components/user-nav"
import Image from "next/image"

export default function DriverListPage() {
  return (
    <main className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="relative w-12 h-12">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bloved-uM125dOkkSEXgRuEs8A8fnIfjsczvI.png"
              alt="BeLoved Transportation Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold">Driver List</h1>
        </div>
        <UserNav />
      </div>
      <DriverList />
    </main>
  )
}

