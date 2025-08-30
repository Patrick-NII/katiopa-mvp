'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Plus, 
  Trash2, 
  Info, 
  AlertCircle,
  Check,
  Baby,
  User
} from 'lucide-react'
import Link from 'next/link'

interface FamilyMember {
  id: string
  firstName: string
  lastName: string
  username: string
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN'
  userType: 'CHILD' | 'PARENT'
  dateOfBirth: string
  grade?: string
  isActive: boolean
}

interface UserPlan {
  subscriptionType: 'STARTER' | 'PRO' | 'PREMIUM'
  maxSessions: number
  usedSessions: number
  familyMembers: FamilyMember[]
}

export default function FamilyMembersTab() {
  const [userPlan, setUserPlan] = useState<UserPlan>({
    subscriptionType: 'STARTER',
    maxSessions: 2,
    usedSessions: 0,
    familyMembers: []
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Charger les données utilisateur au montage
  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      // Récupérer les données depuis localStorage ou API
      const userData = localStorage.getItem('userData')
      if (userData) {
        const parsed = JSON.parse(userData)
        setUserPlan({
          subscriptionType: parsed.subscriptionType || 'STARTER',
          maxSessions: parsed.subscriptionType === 'PREMIUM' ? 6 : 2,
          usedSessions: parsed.familyMembers?.length || 0,
          familyMembers: parsed.familyMembers || []
        })
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err)
    }
  }

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'MALE': return 'Garçon'
      case 'FEMALE': return 'Fille'
      default: return 'Non spécifié'
    }
  }

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case 'CHILD': return 'Enfant'
      case 'PARENT': return 'Parent'
      default: return 'Utilisateur'
    }
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  const getPlanInfo = () => {
    switch (userPlan.subscriptionType) {
      case 'PREMIUM':
        return '6 sessions simultanées • 1 parent + jusqu\'à 5 enfants'
      default:
        return '2 sessions simultanées • 1 parent + 1 enfant'
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Membres de famille</h2>
          <p className="text-gray-600">Gérez les membres de votre famille selon votre plan d'abonnement</p>
        </div>
        {userPlan.usedSessions < userPlan.maxSessions && (
          <Link 
            href="/dashboard/family-members"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Plus size={16} />
            Ajouter un membre
          </Link>
        )}
      </div>

      {/* Informations du plan */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Info size={20} className="text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Plan {userPlan.subscriptionType}</h3>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">{getPlanInfo()}</p>
            <p className="text-lg font-semibold text-blue-600">
              {userPlan.usedSessions}/{userPlan.maxSessions} session{userPlan.maxSessions > 1 ? 's' : ''} utilisée{userPlan.usedSessions > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        {/* Barre de progression */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(userPlan.usedSessions / userPlan.maxSessions) * 100}%` }}
          />
        </div>
      </div>

      {/* Messages d'erreur et de succès */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
        >
          <AlertCircle size={16} />
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700"
        >
          <Check size={16} />
          {success}
        </motion.div>
      )}

      {/* Liste des membres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Membres de la famille</h3>
          {userPlan.usedSessions < userPlan.maxSessions && (
            <span className="text-sm text-gray-500">
              {userPlan.maxSessions - userPlan.usedSessions} place{userPlan.maxSessions - userPlan.usedSessions > 1 ? 's' : ''} disponible{userPlan.maxSessions - userPlan.usedSessions > 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        {userPlan.familyMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Aucun membre ajouté pour le moment</p>
            {userPlan.usedSessions < userPlan.maxSessions ? (
              <Link 
                href="/dashboard/family-members"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
              >
                <Plus size={16} />
                Ajouter votre premier membre
              </Link>
            ) : (
              <p className="text-sm text-gray-400">
                Limite atteinte pour votre plan {userPlan.subscriptionType}
              </p>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userPlan.familyMembers.map((member) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {member.userType === 'CHILD' ? <Baby size={16} /> : <User size={16} />}
                    <span className="font-medium">{member.firstName} {member.lastName}</span>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Genre: {getGenderLabel(member.gender)}</div>
                  <div>Type: {getUserTypeLabel(member.userType)}</div>
                  {member.dateOfBirth && (
                    <div>Âge: {calculateAge(member.dateOfBirth)} ans</div>
                  )}
                  {member.grade && <div>Niveau: {member.grade}</div>}
                  <div className="font-medium text-blue-600">ID: {member.username}</div>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    member.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {member.isActive ? 'Actif' : 'Inactif'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Actions rapides */}
      {userPlan.usedSessions < userPlan.maxSessions && (
        <div className="bg-blue-50 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-blue-900 mb-2">Actions rapides</h4>
          <p className="text-blue-700 mb-4">
            Vous pouvez encore ajouter {userPlan.maxSessions - userPlan.usedSessions} membre{userPlan.maxSessions - userPlan.usedSessions > 1 ? 's' : ''} à votre famille.
          </p>
          <Link 
            href="/dashboard/family-members"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
          >
            <Plus size={16} />
            Gérer les membres
          </Link>
        </div>
      )}
    </div>
  )
}
