import "./globals.css"
import { Inter } from "next/font/google"
import { ClientLayout } from "@/app/components/client-layout"
import type { ReactNode } from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "BeLoved Transportation",
  description: "Schedule your rides with BeLoved Transportation",
  generator: 'v0.dev',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicons/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: [
      { url: '/favicons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { url: '/favicons/favicon-192x192.png', sizes: '192x192', type: 'image/png', rel: 'apple-touch-icon' },
      { url: '/favicons/favicon-512x512.png', sizes: '512x512', type: 'image/png', rel: 'apple-touch-icon' }
    ]
  },
  themeColor: '#d41212',
  appleWebApp: {
    title: 'BeLoved Transportation',
    statusBarStyle: 'default',
    capable: true
  }
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
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no"
        />
        <meta 
          name="keyboard-appearance" 
          content="light"
        />
        <meta
          name="apple-mobile-web-app-capable"
          content="yes"
        />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <link rel="mask-icon" href="/favicons/safari-pinned-tab.svg" color="#d41212" />
        <meta name="msapplication-TileColor" content="#d41212" />
      </head>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}