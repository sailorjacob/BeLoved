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
  // Development-only CSP meta tag with broader permissions
  const devCsp = process.env.NODE_ENV === 'development' ? (
    <meta
      httpEquiv="Content-Security-Policy"
      content="default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' https: data: blob:; font-src 'self' https: data:; connect-src 'self' https: wss:;"
    />
  ) : null;

  return (
    <html lang="en">
      <head>
        {devCsp}
      </head>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}