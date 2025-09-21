import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { Toaster } from '@/components/Toaster'
import { AppNavigation } from '@/components/AppNavigation'
import { GraduationCap, Sparkles } from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fiche de Révision - IA',
  description: 'Transformez vos photos de cours en fiches de révision personnalisées avec l\'intelligence artificielle',
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="container mx-auto px-4 py-6 max-w-4xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-primary rounded-full p-3">
                  <GraduationCap className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Fiche de Révision
              </h1>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Transformez vos photos de cours en fiches de révision personnalisées avec l'intelligence artificielle
              </p>
            </div>

            {/* Navigation */}
            <AppNavigation />

            {/* Main Content */}
            <div className="space-y-6">
              {children}
            </div>

            {/* Footer */}
            <div className="text-center mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Propulsé par l'intelligence artificielle</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Générez des fiches de révision adaptées au système éducatif français
              </p>
            </div>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  )
}