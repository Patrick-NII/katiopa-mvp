import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Import des polices Google Fonts pour la charte typographique CubeAI
import { Sniglet, Fredoka, Roboto } from 'next/font/google'
import ClientRouteWrapper from '@/components/ClientRouteWrapper'

// Configuration de Sniglet ExtraBold 800 pour les gros titres
const sniglet = Sniglet({
  subsets: ['latin'],
  weight: '800',
  variable: '--font-sniglet',
  display: 'swap',
})

// Configuration de Fredoka pour les usages principaux (poids variés)
const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
})

// Configuration de Roboto 400 pour le texte courant
const roboto = Roboto({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bubblegum',
  display: 'swap',
})

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CubeAI',
  description: 'Plateforme d\'apprentissage personnalisé',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} ${sniglet.variable} ${fredoka.variable} ${roboto.variable}`}>
        <ClientRouteWrapper>
          {children}
        </ClientRouteWrapper>
      </body>
    </html>
  )
}
