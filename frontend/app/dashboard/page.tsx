'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI } from '@/lib/api'
import SidebarNavigation from '@/components/SidebarNavigation'
import CubeAIExperiencesTab from '@/components/CubeAIExperiencesTab'
import DashboardTab from '@/components/DashboardTab'
import StatsTab from '@/components/StatsTab'
import SettingsTab from '@/components/SettingsTab'
import { AvatarProvider } from '@/contexts/AvatarContext'
import { AuthProvider } from '@/contexts/AuthContext'

interface User {
  id: string
  sessionId: string
  firstName: string
  lastName: string
  userType: string
  subscriptionType: string
  email?: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState('experiences')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await authAPI.verify()
        if (userData.success && userData.user) {
          setUser(userData.user)
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Erreur de vérification:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'experiences':
        return (
          <CubeAIExperiencesTab 
            userType={user.userType as 'CHILD' | 'PARENT'}
            userSubscriptionType={user.subscriptionType}
            firstName={user.firstName}
            lastName={user.lastName}
          />
        )
      case 'dashboard':
        return <div className="p-6">Dashboard en cours de développement</div>
      case 'stats':
        return <StatsTab userType={user.userType as 'CHILD' | 'PARENT' | 'TEACHER' | 'ADMIN'} />
      case 'settings':
        return <SettingsTab userType={user.userType as 'CHILD' | 'PARENT' | 'TEACHER' | 'ADMIN'} />
      default:
        return (
          <CubeAIExperiencesTab 
            userType={user.userType as 'CHILD' | 'PARENT'}
            userSubscriptionType={user.subscriptionType}
            firstName={user.firstName}
            lastName={user.lastName}
          />
        )
    }
  }

  return (
    <AuthProvider>
      <AvatarProvider>
        <div className="min-h-screen bg-gray-50">
          {/* En-tête utilisateur avec avatar */}
          <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Bienvenue, {user.firstName} !
                  </h1>
                  <p className="text-gray-600">
                    {user.userType === 'CHILD' ? 'Enfant' : 
                     user.userType === 'PARENT' ? 'Parent' : 
                     user.userType === 'TEACHER' ? 'Enseignant' : 'Administrateur'} • {user.subscriptionType}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  ID: {user.sessionId}
                </span>
                <button
                  onClick={async () => {
                    try {
                      await authAPI.logout()
                      router.push('/login')
                    } catch (error) {
                      console.error('Erreur de déconnexion:', error)
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>

          <div className="flex">
            {/* Navigation latérale */}
            <SidebarNavigation 
              activeTab={activeTab as any}
              onTabChange={setActiveTab}
              userType={user.userType as any}
              userSubscriptionType={user.subscriptionType}
            />

            {/* Contenu principal */}
            <main className="flex-1 p-6">
              {renderActiveTab()}
            </main>
          </div>
        </div>
      </AvatarProvider>
    </AuthProvider>
  )
} 
