import './globals.css'
import React from 'react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <main className="min-h-screen flex flex-col">
          <div className="flex-1 container-narrow py-10">{children}</div>
          <footer className="py-6 text-center text-sm text-gray-500">Katiopa MVP</footer>
        </main>
      </body>
    </html>
  )
}