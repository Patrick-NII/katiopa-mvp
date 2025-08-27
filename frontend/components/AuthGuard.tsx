'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function AuthGuard({ children, fallback = null }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    
    if (!token) {
      setIsAuthenticated(false)
      router.replace('/login')
      return
    }

    setIsAuthenticated(true)
  }, [router])

  // Afficher le fallback pendant la vérification
  if (isAuthenticated === null) {
    return fallback
  }

  // Rediriger si non authentifié
  if (!isAuthenticated) {
    return null
  }

  // Afficher le contenu protégé si authentifié
  return <>{children}</>
} 