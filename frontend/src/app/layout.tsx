import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { Toaster } from '@/components/Toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Générateur de Fiches de Révision',
  description: 'Transformez vos photos de cours en fiches de révision personnalisées avec l\'IA',
  keywords: ['révision', 'éducation', 'IA', 'France', 'fiches'],
  authors: [{ name: 'Revision Sheet Generator' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#3b82f6',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <div className="mobile-safe-area min-h-screen bg-background">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  )
}