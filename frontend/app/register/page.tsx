'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, Calendar, Baby, Users, Crown, Gift, Check, AlertCircle, Info, Eye, EyeOff, Lock } from 'lucide-react'
import Link from 'next/link'
import { apiPost } from '../../lib/api'

interface FamilyMember {
  id: string
  firstName: string
  lastName: string
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN'
  userType: 'CHILD' | 'PARENT'
  dateOfBirth: string
  grade?: string
  password: string
  confirmPassword: string
}

interface AccountData {
  email: string
  subscriptionType: 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE'
  maxSessions: number
  familyMembers: FamilyMember[]
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<'account' | 'family' | 'passwords' | 'review' | 'success'>('account')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Données du compte
  const [accountData, setAccountData] = useState<AccountData>({
    email: '',
    subscriptionType: 'FREE',
    maxSessions: 2,
    familyMembers: []
  })

  // Données du formulaire actuel
  const [currentMember, setCurrentMember] = useState<Partial<FamilyMember>>({
    firstName: '',
    lastName: '',
    gender: 'UNKNOWN',
    userType: 'CHILD',
    dateOfBirth: '',
    grade: '',
    password: '',
    confirmPassword: ''
  })

  // État pour afficher/masquer les mots de passe
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({})

  const subscriptionPlans = [
    {
      id: 'FREE',
      name: 'Gratuit',
      price: '0€',
      maxSessions: 2,
      features: ['2 sessions utilisateur', 'Accès de base', 'Support communautaire'],
      icon: Gift,
      color: 'from-gray-400 to-gray-600'
    },
    {
      id: 'PRO',
      name: 'Pro',
      price: '9.99€/mois',
      maxSessions: 3,
      features: ['3 sessions utilisateur', 'Fonctionnalités avancées', 'Support prioritaire'],
      icon: Crown,
      color: 'from-purple-400 to-purple-600'
    },
    {
      id: 'PRO_PLUS',
      name: 'Pro Plus',
      price: '19.99€/mois',
      maxSessions: 4,
      features: ['4 sessions utilisateur', 'Toutes les fonctionnalités', 'Support dédié'],
      icon: Crown,
      color: 'from-blue-400 to-blue-600'
    }
  ]

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountData.email) {
      setError('Veuillez saisir une adresse email')
      return
    }
    setStep('family')
    setError('')
  }

  const handleAddFamilyMember = () => {
    if (!currentMember.firstName || !currentMember.lastName || !currentMember.dateOfBirth) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    const newMember: FamilyMember = {
      id: Date.now().toString(),
      firstName: currentMember.firstName!,
      lastName: currentMember.lastName!,
      gender: currentMember.gender!,
      userType: currentMember.userType!,
      dateOfBirth: currentMember.dateOfBirth!,
      grade: currentMember.grade,
      password: '',
      confirmPassword: ''
    }

    setAccountData(prev => ({
      ...prev,
      familyMembers: [...prev.familyMembers, newMember]
    }))

    // Réinitialiser le formulaire
    setCurrentMember({
      firstName: '',
      lastName: '',
      gender: 'UNKNOWN',
      userType: 'CHILD',
      dateOfBirth: '',
      grade: '',
      password: '',
      confirmPassword: ''
    })

    setError('')
  }

  const handleRemoveFamilyMember = (id: string) => {
    setAccountData(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.filter(member => member.id !== id)
    }))
  }

  const handleSubscriptionChange = (subscriptionType: 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE') => {
    const maxSessions = subscriptionType === 'FREE' ? 2 : subscriptionType === 'PRO' ? 3 : 4
    setAccountData(prev => ({
      ...prev,
      subscriptionType,
      maxSessions
    }))
  }

  const handlePasswordChange = (memberId: string, field: 'password' | 'confirmPassword', value: string) => {
    setAccountData(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.map(member => 
        member.id === memberId ? { ...member, [field]: value } : member
      )
    }))
  }

  const validatePasswords = () => {
    for (const member of accountData.familyMembers) {
      if (!member.password) {
        setError(`Veuillez définir un mot de passe pour ${member.firstName} ${member.lastName}`)
        return false
      }
      if (member.password.length < 6) {
        setError(`Le mot de passe de ${member.firstName} ${member.lastName} doit contenir au moins 6 caractères`)
        return false
      }
      if (member.password !== member.confirmPassword) {
        setError(`Les mots de passe de ${member.firstName} ${member.lastName} ne correspondent pas`)
        return false
      }
    }
    return true
  }

  const handlePasswordsSubmit = () => {
    if (!validatePasswords()) {
      return
    }
    setStep('review')
    setError('')
  }

  const handleFinalSubmit = async () => {
    if (accountData.familyMembers.length === 0) {
      setError('Veuillez ajouter au moins un membre de la famille')
      return
    }

    if (accountData.familyMembers.length > accountData.maxSessions) {
      setError(`Le plan ${accountData.subscriptionType} ne permet que ${accountData.maxSessions} sessions`)
      return
    }

    if (!validatePasswords()) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await apiPost('/auth/register', accountData)
      
      if (data.success) {
        setStep('success')
        // Stocker les informations de connexion
        localStorage.setItem('registrationData', JSON.stringify(data))
      } else {
        setError(data.error || 'Erreur lors de l\'inscription')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion au serveur')
    } finally {
      setLoading(false)
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

  const togglePasswordVisibility = (memberId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <span className="text-3xl font-bold text-white">K</span>
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Inscription KATIOPA</h1>
          <p className="text-gray-600">Créez votre compte familial pour l'apprentissage intelligent</p>
        </motion.div>

        {/* Étapes */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {['account', 'family', 'passwords', 'review', 'success'].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepName 
                    ? 'bg-blue-600 text-white' 
                    : step === 'success' || ['account', 'family', 'passwords', 'review'].indexOf(step) < index
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {step === 'success' || ['account', 'family', 'passwords', 'review'].indexOf(step) < index ? (
                    <Check size={16} />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step === 'success' || ['account', 'family', 'passwords', 'review'].indexOf(step) < index
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Étape 1: Informations du compte */}
          {step === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
                Choisissez votre plan d'abonnement
              </h2>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {subscriptionPlans.map((plan) => {
                  const Icon = plan.icon
                  return (
                    <motion.div
                      key={plan.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative cursor-pointer rounded-xl p-6 border-2 transition-all ${
                        accountData.subscriptionType === plan.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleSubscriptionChange(plan.id as any)}
                    >
                      {accountData.subscriptionType === plan.id && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check size={16} className="text-white" />
                        </div>
                      )}
                      
                      <div className={`w-12 h-12 bg-gradient-to-r ${plan.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                        <Icon size={24} className="text-white" />
                      </div>
                      
                      <h3 className="text-xl font-bold text-center text-gray-900 mb-2">{plan.name}</h3>
                      <p className="text-3xl font-bold text-center text-gray-900 mb-4">{plan.price}</p>
                      
                      <ul className="space-y-2 mb-4">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      
                      <div className="text-center">
                        <span className="text-lg font-semibold text-blue-600">
                          {plan.maxSessions} session{plan.maxSessions > 1 ? 's' : ''}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              <form onSubmit={handleAccountSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse email du compte
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      id="email"
                      type="email"
                      value={accountData.email}
                      onChange={(e) => setAccountData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="votre-email@exemple.com"
                      required
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Cette adresse servira à la gestion du compte et aux communications importantes
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                >
                  Continuer - Ajouter les membres de la famille
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* Étape 2: Membres de la famille */}
          {step === 'family' && (
            <motion.div
              key="family"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
                Ajoutez les membres de votre famille
              </h2>

              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-800">
                  <Info size={16} />
                  <span className="font-medium">Plan {accountData.subscriptionType}</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Vous pouvez ajouter jusqu'à {accountData.maxSessions} session{accountData.maxSessions > 1 ? 's' : ''} 
                  ({accountData.familyMembers.length}/{accountData.maxSessions} utilisée{accountData.familyMembers.length > 1 ? 's' : ''})
                </p>
              </div>

              {/* Formulaire d'ajout de membre */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter un membre</h3>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                    <input
                      type="text"
                      value={currentMember.firstName}
                      onChange={(e) => setCurrentMember(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Prénom"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                    <input
                      type="text"
                      value={currentMember.lastName}
                      onChange={(e) => setCurrentMember(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nom"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                    <select
                      value={currentMember.gender}
                      onChange={(e) => setCurrentMember(prev => ({ ...prev, gender: e.target.value as any }))}
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
                      value={currentMember.userType}
                      onChange={(e) => setCurrentMember(prev => ({ ...prev, userType: e.target.value as any }))}
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
                      value={currentMember.dateOfBirth}
                      onChange={(e) => setCurrentMember(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {currentMember.userType === 'CHILD' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Niveau scolaire (optionnel)</label>
                    <input
                      type="text"
                      value={currentMember.grade}
                      onChange={(e) => setCurrentMember(prev => ({ ...prev, grade: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: CP, CE1, CE2, CM1, CM2"
                    />
                  </div>
                )}

                <motion.button
                  type="button"
                  onClick={handleAddFamilyMember}
                  disabled={accountData.familyMembers.length >= accountData.maxSessions}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Ajouter ce membre
                </motion.button>
              </div>

              {/* Liste des membres ajoutés */}
              {accountData.familyMembers.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Membres de la famille</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {accountData.familyMembers.map((member) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {member.userType === 'CHILD' ? <Baby size={16} /> : <Users size={16} />}
                            <span className="font-medium">{member.firstName} {member.lastName}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveFamilyMember(member.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Genre: {getGenderLabel(member.gender)}</div>
                          <div>Type: {getUserTypeLabel(member.userType)}</div>
                          <div>Âge: {calculateAge(member.dateOfBirth)} ans</div>
                          {member.grade && <div>Niveau: {member.grade}</div>}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <motion.button
                  type="button"
                  onClick={() => setStep('account')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Retour
                </motion.button>
                
                <motion.button
                  type="button"
                  onClick={() => setStep('passwords')}
                  disabled={accountData.familyMembers.length === 0}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuer - Définir les mots de passe
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Étape 3: Définition des mots de passe */}
          {step === 'passwords' && (
            <motion.div
              key="passwords"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
                Définissez les mots de passe pour chaque membre
              </h2>

              <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Lock size={16} />
                  <span className="font-medium">Sécurité des mots de passe</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Chaque membre aura son propre mot de passe pour se connecter à sa session
                </p>
              </div>

              <div className="space-y-6">
                {accountData.familyMembers.map((member) => (
                  <div key={member.id} className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      {member.userType === 'CHILD' ? <Baby size={20} /> : <Users size={20} />}
                      {member.firstName} {member.lastName}
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
            <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mot de passe
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords[member.id] ? 'text' : 'password'}
                            value={member.password}
                            onChange={(e) => handlePasswordChange(member.id, 'password', e.target.value)}
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Mot de passe"
                            required
                          />
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(member.id)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords[member.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
            </div>
                      
            <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirmer le mot de passe
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords[member.id] ? 'text' : 'password'}
                            value={member.confirmPassword}
                            onChange={(e) => handlePasswordChange(member.id, 'confirmPassword', e.target.value)}
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Confirmer le mot de passe"
                            required
                          />
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(member.id)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords[member.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {member.password && member.confirmPassword && (
                            member.password === member.confirmPassword ? (
                              <Check size={14} className="text-green-500" />
                            ) : (
                              <AlertCircle size={14} className="text-red-500" />
                            )
                          )}
                          <span className={`text-xs ${
                            member.password && member.confirmPassword
                              ? member.password === member.confirmPassword ? 'text-green-600' : 'text-red-600'
                              : 'text-gray-500'
                          }`}>
                            {member.password && member.confirmPassword
                              ? member.password === member.confirmPassword ? 'Mots de passe identiques' : 'Mots de passe différents'
                              : 'Confirmez le mot de passe'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 mt-6">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="flex gap-4 mt-8">
                <motion.button
                  type="button"
                  onClick={() => setStep('family')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Retour
                </motion.button>
                
                <motion.button
                  type="button"
                  onClick={handlePasswordsSubmit}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                >
                  Continuer - Vérifier et confirmer
                </motion.button>
            </div>
            </motion.div>
          )}

          {/* Étape 4: Vérification et confirmation */}
          {step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
                Vérifiez vos informations
              </h2>

              <div className="space-y-6">
                {/* Informations du compte */}
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <Mail size={20} />
                    Informations du compte
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
            <div>
                      <span className="text-sm font-medium text-blue-700">Email:</span>
                      <p className="text-blue-900">{accountData.email}</p>
            </div>
            <div>
                      <span className="text-sm font-medium text-blue-700">Plan d'abonnement:</span>
                      <p className="text-blue-900">{accountData.subscriptionType}</p>
                    </div>
                  </div>
                </div>

                {/* Membres de la famille */}
                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                    <Users size={20} />
                    Membres de la famille ({accountData.familyMembers.length}/{accountData.maxSessions})
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {accountData.familyMembers.map((member) => (
                      <div key={member.id} className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          {member.userType === 'CHILD' ? <Baby size={16} /> : <Users size={16} />}
                          <span className="font-medium text-green-900">
                            {member.firstName} {member.lastName}
                          </span>
                        </div>
                        <div className="text-sm text-green-700 space-y-1">
                          <div>Genre: {getGenderLabel(member.gender)}</div>
                          <div>Type: {getUserTypeLabel(member.userType)}</div>
                          <div>Âge: {calculateAge(member.dateOfBirth)} ans</div>
                          {member.grade && <div>Niveau: {member.grade}</div>}
                          <div className="text-xs text-gray-600">Mot de passe défini ✓</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Informations importantes */}
                <div className="bg-yellow-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center gap-2">
                    <AlertCircle size={20} />
                    Informations importantes
                  </h3>
                  <ul className="text-sm text-yellow-800 space-y-2">
                    <li>• Chaque membre a son propre mot de passe personnalisé</li>
                    <li>• L'email {accountData.email} servira à la gestion du compte et aux communications</li>
                    <li>• Le paiement se fera par email et ID de compte</li>
                    <li>• La date d'inscription sera automatiquement définie à aujourd'hui</li>
                  </ul>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 mt-6">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="flex gap-4 mt-8">
                <motion.button
                  type="button"
                  onClick={() => setStep('passwords')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Retour
                </motion.button>
                
                <motion.button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Création du compte...
                    </div>
                  ) : (
                    'Créer mon compte KATIOPA'
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Étape 5: Succès */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Check size={40} className="text-white" />
              </motion.div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Félicitations ! 🎉
              </h2>
              
              <p className="text-lg text-gray-600 mb-6">
                Votre compte KATIOPA a été créé avec succès !
              </p>
              
              <div className="bg-green-50 rounded-lg p-6 mb-8 text-left">
                <h3 className="text-lg font-semibold text-green-900 mb-4">
                  Vos identifiants de connexion :
                </h3>
                <div className="space-y-3">
                  {/* Ici seront affichés les IDs de session et mots de passe générés */}
                  <p className="text-sm text-green-700">
                    Les identifiants de connexion ont été envoyés par email à {accountData.email}
                  </p>
            </div>
        </div>
              
              <motion.button
                onClick={() => router.push('/login')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-8 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
              >
                Aller à la page de connexion
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lien de connexion */}
        {step !== 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-gray-600">
              Déjà un compte ?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Se connecter
              </Link>
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}