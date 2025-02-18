import "./globals.css"
import { Inter } from "next/font/google"
import { AuthProvider } from "./contexts/auth-context"
import type React from "react" // Added import for React

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "BeLoved Transportation",
  description: "Schedule your rides with BeLoved Transportation",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}



import './globals.css'