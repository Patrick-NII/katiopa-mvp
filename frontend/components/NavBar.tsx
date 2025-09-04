'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Sun, Moon, Monitor } from 'lucide-react'
import { authAPI } from '@/lib/api'
import { CubeAILogo } from '@/components/MulticolorText'
import { useTheme } from '@/contexts/ThemeContext'

interface NavbarProps {
  className?: string
}

export default function Navbar({ className = '' }: NavbarProps) {
  const [navUser, setNavUser] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  
  // État connexion pour la nav
  useEffect(() => {
    let mounted = true
    authAPI.verify().then(res => {
      if (mounted && res?.success) setNavUser(res.user)
    }).catch(() => {
      // Erreur silencieuse - utilisateur non connecté
      if (mounted) setNavUser(null)
    })
    
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cubeai:auth') {
        authAPI.verify().then(res => {
          if (mounted) setNavUser(res?.success ? res.user : null)
        }).catch(() => { 
          if (mounted) setNavUser(null) 
        })
      }
    }
    window.addEventListener('storage', onStorage)
    return () => { mounted = false; window.removeEventListener('storage', onStorage) }
  }, [])

  useEffect(() => {
    try { localStorage.setItem('cubeai:auth', 'check:' + Date.now()); } catch {}
  }, [])

  const handleLogout = async () => {
    try {
      await authAPI.logout()
      localStorage.setItem('cubeai:auth', 'logged_out:' + Date.now())
      setNavUser(null)
      router.push('/login')
    } catch {}
  }

  return (
    <nav className={`bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="font-title text-white text-2xl">C</span>
            </div>
            <CubeAILogo className="text-2xl md:text-4xl" />
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Bouton de mode nuit */}
            <button
              onClick={() => {
                if (theme === 'light') {
                  setTheme('dark')
                } else if (theme === 'dark') {
                  setTheme('auto')
                } else {
                  setTheme('light')
                }
              }}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              title={`Thème actuel: ${theme === 'light' ? 'Clair' : theme === 'dark' ? 'Sombre' : 'Auto'}`}
            >
              {theme === 'light' && <Sun className="w-5 h-5" />}
              {theme === 'dark' && <Moon className="w-5 h-5" />}
              {theme === 'auto' && <Monitor className="w-5 h-5" />}
            </button>

            {navUser ? (
              // Utilisateur connecté
              <>
                <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/70 dark:bg-gray-800/70 border border-green-200 dark:border-green-700 text-sm font-medium text-green-700 dark:text-green-300">
                  <span className="font-mono text-xs text-gray-900 dark:text-gray-100">{navUser.sessionId}</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                </div>
                <Link 
                  href="/dashboard" 
                  className="font-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 md:px-5 py-2 rounded-lg text-xs md:text-sm font-medium"
                >
                  Espace personnel
                </Link>
                <button
                  onClick={handleLogout}
                  title="Se déconnecter"
                  aria-label="Se déconnecter"
                  className="p-2 rounded-lg text-gray-700 hover:text-red-600 transition transform hover:rotate-12 hover:scale-110"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </>
            ) : (
              // Utilisateur non connecté
              <>
                <Link 
                  href="/" 
                  className="font-body text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Accueil
                </Link>
                {pathname === '/login' ? (
                  // Sur la page login, afficher "S'inscrire"
                  <Link 
                    href="/register" 
                    className="font-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 md:px-6 py-2 rounded-lg text-xs md:text-sm font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    S'inscrire
                  </Link>
                ) : pathname === '/register' ? (
                  // Sur la page register, afficher "Se connecter"
                  <Link 
                    href="/login" 
                    className="font-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 md:px-6 py-2 rounded-lg text-xs md:text-sm font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Se connecter
                  </Link>
                ) : (
                  // Sur les autres pages, afficher les deux
                  <>
                    <Link 
                      href="/login" 
                      className="font-body text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Connexion
                    </Link>
                    <Link 
                      href="/register" 
                      className="font-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 md:px-6 py-2 rounded-lg text-xs md:text-sm font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Commencer gratuitement
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}