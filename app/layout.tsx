import "./globals.css"
import { Inter } from "next/font/google"
import { ClientLayout } from "@/app/components/client-layout"
import type { ReactNode } from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "BeLoved Transportation",
  description: "Schedule your rides with BeLoved Transportation",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}