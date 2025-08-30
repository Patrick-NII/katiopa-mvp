'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Baby, 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  Info, 
  AlertCircle,
  Check,
  X
} from 'lucide-react'
import { CubeAILogo } from '@/components/MulticolorText'
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

export default function FamilyMembersPage() {
  const [userPlan, setUserPlan] = useState<UserPlan>({
    subscriptionType: 'STARTER',
    maxSessions: 2,
    usedSessions: 0,
    familyMembers: []
  })
  
  const [newMember, setNewMember] = useState<Partial<FamilyMember>>({
    firstName: '',
    lastName: '',
    username: '',
    gender: 'UNKNOWN',
    userType: 'CHILD',
    dateOfBirth: '',
    grade: '',
    isActive: true
  })
  
  const [showAddForm, setShowAddForm] = useState(false)
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

  const handleAddMember = async () => {
    if (!newMember.firstName || !newMember.lastName || !newMember.username) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (userPlan.usedSessions >= userPlan.maxSessions) {
      setError(`Limite atteinte : ${userPlan.maxSessions} session${userPlan.maxSessions > 1 ? 's' : ''} maximum pour le plan ${userPlan.subscriptionType}`)
      return
    }

    setLoading(true)
    setError('')

    try {
      const memberToAdd: FamilyMember = {
        id: Date.now().toString(),
        firstName: newMember.firstName!,
        lastName: newMember.lastName!,
        username: newMember.username!,
        gender: newMember.gender!,
        userType: newMember.userType!,
        dateOfBirth: newMember.dateOfBirth!,
        grade: newMember.grade,
        isActive: true
      }

      const updatedPlan = {
        ...userPlan,
        familyMembers: [...userPlan.familyMembers, memberToAdd],
        usedSessions: userPlan.usedSessions + 1
      }

      setUserPlan(updatedPlan)
      
      // Sauvegarder dans localStorage ou API
      localStorage.setItem('userData', JSON.stringify(updatedPlan))
      
      setSuccess('Membre ajouté avec succès !')
      setNewMember({
        firstName: '',
        lastName: '',
        username: '',
        gender: 'UNKNOWN',
        userType: 'CHILD',
        dateOfBirth: '',
        grade: '',
        isActive: true
      })
      setShowAddForm(false)
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Erreur lors de l\'ajout du membre')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
      setLoading(true)
      setError('')

      try {
        const updatedPlan = {
          ...userPlan,
          familyMembers: userPlan.familyMembers.filter(m => m.id !== memberId),
          usedSessions: userPlan.usedSessions - 1
        }

        setUserPlan(updatedPlan)
        localStorage.setItem('userData', JSON.stringify(updatedPlan))
        setSuccess('Membre supprimé avec succès !')
        
        setTimeout(() => setSuccess(''), 3000)
      } catch (err) {
        setError('Erreur lors de la suppression')
      } finally {
        setLoading(false)
      }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/90 border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="font-title text-white text-2xl">C</span>
              </div>
              <CubeAILogo className="text-4xl" />
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="font-body text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100">
                Tableau de bord
              </Link>
              <Link href="/login" className="font-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105">
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des membres de famille</h1>
          <p className="text-gray-600">Ajoutez et gérez les membres de votre famille selon votre plan d'abonnement</p>
        </div>

        {/* Informations du plan */}
        <div className="mb-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Info size={20} className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Plan {userPlan.subscriptionType}</h2>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">{getPlanInfo()}</p>
              <p className="text-lg font-semibold text-blue-600">
                {userPlan.usedSessions}/{userPlan.maxSessions} session{userPlan.maxSessions > 1 ? 's' : ''} utilisée{userPlan.usedSessions > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          {/* Barre de progression */}
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(userPlan.usedSessions / userPlan.maxSessions) * 100}%` }}
            />
          </div>
        </div>

        {/* Messages d'erreur et de succès */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
          >
            <AlertCircle size={16} />
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700"
          >
            <Check size={16} />
            {success}
          </motion.div>
        )}

        {/* Bouton d'ajout */}
        {userPlan.usedSessions < userPlan.maxSessions && (
          <div className="mb-8">
            <motion.button
              onClick={() => setShowAddForm(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              <Plus size={20} />
              Ajouter un membre
            </motion.button>
          </div>
        )}

        {/* Formulaire d'ajout */}
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Ajouter un nouveau membre</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                <input
                  type="text"
                  value={newMember.firstName}
                  onChange={(e) => setNewMember(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Prénom"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                <input
                  type="text"
                  value={newMember.lastName}
                  onChange={(e) => setNewMember(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nom"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Identifiant de connexion unique *</label>
              <input
                type="text"
                value={newMember.username}
                onChange={(e) => setNewMember(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Identifiant unique (ex: lucas2024, emma_pro)"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Cet identifiant sera utilisé pour se connecter à la session
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                <select
                  value={newMember.gender}
                  onChange={(e) => setNewMember(prev => ({ ...prev, gender: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="UNKNOWN">Non spécifié</option>
                  <option value="MALE">Garçon</option>
                  <option value="FEMALE">Fille</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={newMember.userType}
                  onChange={(e) => setNewMember(prev => ({ ...prev, userType: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="CHILD">Enfant</option>
                  <option value="PARENT">Parent</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date de naissance</label>
                <input
                  type="date"
                  value={newMember.dateOfBirth}
                  onChange={(e) => setNewMember(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Niveau scolaire (optionnel)</label>
              <input
                type="text"
                value={newMember.grade}
                onChange={(e) => setNewMember(prev => ({ ...prev, grade: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: CP, CE1, CE2, CM1, CM2"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleAddMember}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Ajout en cours...' : 'Ajouter ce membre'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Liste des membres */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Membres de la famille</h3>
          
          {userPlan.familyMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun membre ajouté pour le moment</p>
              {userPlan.usedSessions < userPlan.maxSessions && (
                <p className="text-sm text-gray-400 mt-2">
                  Vous pouvez ajouter jusqu'à {userPlan.maxSessions - userPlan.usedSessions} membre{userPlan.maxSessions - userPlan.usedSessions > 1 ? 's' : ''} supplémentaire{userPlan.maxSessions - userPlan.usedSessions > 1 ? 's' : ''}
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
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Supprimer ce membre"
                    >
                      <Trash2 size={16} />
                    </button>
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
      </div>
    </div>
  )
}
