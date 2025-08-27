import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Katiopa',
  description: 'Plateforme d\'apprentissage personnalisé',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen flex flex-col">
        <div className="flex-1 py-10">{children}</div>
      </body>
    </html>
  )
}