'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import RadarChart from '../../../components/charts/RadarChart'
import { RadarDataProvider } from '../../../contexts/RadarDataContext'
import { useAgeAdaptation } from '../../../hooks/useAgeAdaptation'
import { authAPI } from '../../../lib/api'
import { Shield } from 'lucide-react'

export default function ExperiencesPage() {
  const [user, setUser] = useState<any>(null)
  const [userType, setUserType] = useState<'CHILD' | 'PARENT'>('CHILD')
  const [userAge, setUserAge] = useState<number>(8)

  const isChild = userType === 'CHILD'
  
  // Charger les données utilisateur
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await authAPI.verify()
        if (response.success && response.user) {
          setUser(response.user)
          setUserType((response.user as any).userType || 'CHILD')
          setUserAge((response.user as any).age || 8)
        }
      } catch (error) {
        console.error('Erreur chargement profil:', error)
      }
    }
    
    loadUserData()
  }, [])
  
  // Adaptation par âge
  const { 
    adaptText, 
    ui
  } = useAgeAdaptation({ age: userAge })
  
  // Charger l'âge de l'utilisateur si pas disponible dans les props
  useEffect(() => {
    if (!(user as any)?.age) {
      const loadUserAge = async () => {
        try {
          const response = await authAPI.verify()
          if (response.success && response.user && (response.user as any).age) {
            setUserAge((response.user as any).age)
          }
        } catch (error) {
          console.error('Erreur lors du chargement de l\'âge:', error)
        }
      }
      loadUserAge()
    }
  }, [user])


  return (
    <RadarDataProvider>
      <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
      <div className="h-full overflow-y-auto p-6 md:p-8 lg:p-12">
        <div className="space-y-16 max-w-6xl mx-auto">
          {/* En-tête adapté par âge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            
          </motion.div>

          {/* ÉLÉMENT PRINCIPAL : Bouclier des Compétences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full"
          >
            <RadarChart 
              isChild={isChild}
              userType={isChild ? "CHILD" : "PARENT"}
              className=""
            />
          </motion.div>
      
        </div>
      </div>
      </div>
    </RadarDataProvider>
  )
}

