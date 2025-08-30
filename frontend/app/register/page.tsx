'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Eye, EyeOff, Check, ArrowRight, ArrowLeft, Plus, X, Users, Crown, Gift } from 'lucide-react'
import Link from 'next/link'
import { authAPI } from '@/lib/api'
import { CubeAILogo } from '@/components/MulticolorText'
import { AnimatePresence } from 'framer-motion'

interface FamilyMember {
  firstName: string
  lastName: string
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN'
  userType: 'CHILD' | 'PARENT'
  dateOfBirth: string
  grade?: string
}

interface RegistrationData {
  email: string
  firstName: string
  lastName: string
  password: string
  confirmPassword: string
  subscriptionType: 'STARTER' | 'PRO' | 'PREMIUM'
  familyMembers: FamilyMember[]
  acceptTerms: boolean
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<'subscription' | 'account' | 'family' | 'success'>('subscription')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    subscriptionType: 'STARTER',
    familyMembers: [
      {
        firstName: '',
        lastName: '',
        gender: 'UNKNOWN',
        userType: 'PARENT',
        dateOfBirth: '',
        grade: ''
      }
    ],
    acceptTerms: false
  })

  const subscriptionPlans = [
    {
      id: 'STARTER',
      name: 'Starter',
      price: '0€',
      period: '/mois',
      description: 'Parfait pour commencer l\'aventure',
      features: [
        '1 session simultanée',
        '1 propriétaire (admin)',
        'Accès complet à la plateforme',
        'Programmation, IA, maths et lecture',
        'Jeux éducatifs et progression',
        'Évaluation et coaching IA basique',
        '3 mois gratuit puis 9,99€/mois'
      ],
      maxMembers: 1,
      popular: false,
      starter: true,
      cardClass: 'card-starter'
    },
    {
      id: 'PRO',
      name: 'Pro',
      price: '29,99€',
      period: '/mois',
      description: 'L\'expérience complète recommandée',
      features: [
        '2 sessions simultanées',
        '1 propriétaire + 1 membre',
        'Tous les exercices et contenus',
        'Communauté et défis familiaux',
        'Stats détaillées et rapports',
        'Certificats de progression',
        'IA coach personnalisé',
        'Support par email'
      ],
      maxMembers: 2,
      popular: true,
      cardClass: 'card-pro'
    },
    {
      id: 'PREMIUM',
      name: 'Premium',
      price: '69,99€',
      period: '/mois',
      description: 'La solution complète pour les familles',
      features: [
        '6 sessions simultanées',
        '1 propriétaire + jusqu\'à 5 membres',
        'IA coach Premium avancé',
        'Certificats officiels reconnus',
        'Exports PDF/Excel détaillés',
        'Multi-appareils synchronisés',
        'Support prioritaire 24/7',
        'Programme de parrainage',
        'Contenus exclusifs'
      ],
      maxMembers: 6,
      popular: false,
      complete: true,
      cardClass: 'card-premium'
    }
  ]

  const selectedPlan = subscriptionPlans.find(p => p.id === formData.subscriptionType)

  const handleInputChange = (field: keyof RegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleFamilyMemberChange = (index: number, field: keyof FamilyMember, value: any) => {
    setFormData(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.map((member, i) => 
        i === index ? { ...member, [field]: value } : member
      )
    }))
    setError('')
  }

  const addFamilyMember = () => {
    const currentMemberCount = formData.familyMembers.length
    const maxMembers = selectedPlan?.maxMembers || 1
    
    if (currentMemberCount >= maxMembers) {
      setError(`Vous ne pouvez ajouter que ${maxMembers} membre(s) maximum avec le plan ${selectedPlan?.name}`)
      return
    }

    setFormData(prev => ({
      ...prev,
      familyMembers: [...prev.familyMembers, {
        firstName: '',
        lastName: '',
        gender: 'UNKNOWN',
        userType: 'CHILD',
        dateOfBirth: '',
        grade: ''
      }]
    }))
    setError('')
  }

  const removeFamilyMember = (index: number) => {
    if (index === 0) {
      setError('Le propriétaire ne peut pas être supprimé')
      return
    }
    
    setFormData(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((_, i) => i !== index)
    }))
    setError('')
  }

  const validateStep1 = () => {
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.password || !formData.confirmPassword) {
      setError('Tous les champs sont obligatoires')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return false
    }
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return false
    }
    if (!formData.acceptTerms) {
      setError('Vous devez accepter les conditions d\'utilisation')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    const hasValidMembers = formData.familyMembers.every(member => 
      member.firstName && member.lastName && member.dateOfBirth
    )
    if (!hasValidMembers) {
      setError('Tous les membres doivent avoir un prénom, nom et date de naissance')
      return false
    }
    return true
  }

  const handleNext = () => {
    if (step === 'subscription') {
      setStep('account')
    } else if (step === 'account' && validateStep1()) {
      setStep('family')
    }
  }

  const handleBack = () => {
    if (step === 'account') setStep('subscription')
    else if (step === 'family') setStep('account')
  }

  const handleSubmit = async () => {
    if (!validateStep2()) return

    setLoading(true)
    setError('')

    try {
      // Préparer les données pour l'API
      const payload = {
        email: formData.email,
        subscriptionType: formData.subscriptionType === 'STARTER' ? 'FREE' : 
                         formData.subscriptionType === 'PRO' ? 'PRO' : 'PRO_PLUS',
        maxSessions: formData.subscriptionType === 'PREMIUM' ? 6 : 
                    formData.subscriptionType === 'PRO' ? 2 : 1,
        familyMembers: formData.familyMembers.map((member, index) => ({
          ...member,
          username: index === 0 ? `${member.firstName.toLowerCase()}_${Date.now()}` : 
                   `${member.firstName.toLowerCase()}_${Date.now()}_${index}`,
          password: index === 0 ? formData.password : `${member.firstName.toLowerCase()}123`
        })),
        parentPrompts: {
          objectives: '',
          needs: '',
          concerns: '',
          preferences: '',
          additionalInfo: ''
        },
        paymentInfo: {}
      }

      const response = await authAPI.register(payload)
      
      if (response.success) {
        setStep('success')
        localStorage.setItem('registrationData', JSON.stringify(response.data || response))
      } else {
        setError(response.error || 'Erreur lors de l\'inscription')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  const handleGoToLogin = () => {
    router.push('/login')
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
              <Link href="/login" className="font-body text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100">
                Connexion
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          {step === 'subscription' && (
            <motion.div
              key="subscription"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-screen py-20 bg-white"
            >
              <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <motion.div
                    initial={{ opacity: 0, y: 0 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="mb-6"
                  >
                    <h1 className="text-5xl font-bold text-gray-900 mb-4">
                      Choisissez votre plan
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                      Sélectionnez l'offre qui correspond le mieux à vos besoins et commencez l'aventure CubeAI
                    </p>
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                  {subscriptionPlans.map((plan, index) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8 }}
                      viewport={{ once: true }}
                      className={`relative rounded-2xl p-6 border-2 flex flex-col h-full cursor-pointer transition-all ${
                        formData.subscriptionType === plan.id
                          ? 'border-blue-500 bg-blue-50 shadow-xl'
                          : 'border-gray-200 hover:border-gray-300 bg-white shadow-lg'
                      } ${plan.cardClass}`}
                      onClick={() => handleInputChange('subscriptionType', plan.id)}
                    >
                      {plan.starter && (
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                          <Gift className="w-12 h-12 text-green-500" />
                        </div>
                      )}
                      {plan.popular && (
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                          <Crown className="w-12 h-12 text-blue-500" />
                        </div>
                      )}
                      {plan.complete && (
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                          <Crown className="w-12 h-12 text-purple-500" />
                        </div>
                      )}

                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{plan.name}</h3>
                        <div className="mb-2">
                          <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                          <span className="text-gray-600">{plan.period}</span>
                        </div>
                        <p className="text-gray-600 mb-2">{plan.description}</p>
                        <p className="text-gray-500 text-sm italic">
                          {plan.maxMembers === 1 ? '1 session' : plan.maxMembers === 2 ? '2 sessions' : '6 sessions'} • {plan.maxMembers === 1 ? '1 parent' : plan.maxMembers === 2 ? '1 parent + 1 enfant' : '1 parent + 5 enfants'}
                        </p>
                      </div>

                      <ul className="space-y-3 mb-6 flex-grow">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start space-x-3">
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-auto text-center">
                        <button
                          onClick={() => handleInputChange('subscriptionType', plan.id)}
                          className={`w-full font-button px-6 py-3 rounded-xl transition-all border ${
                            formData.subscriptionType === plan.id
                              ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                              : 'bg-white/20 text-gray-700 hover:bg-gray-100 border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {formData.subscriptionType === plan.id ? 'Sélectionné' : 'Choisir ce plan'}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="text-center mt-12">
                  <button
                    onClick={handleNext}
                    className="font-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 rounded-xl text-lg font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Continuer
                    <ArrowRight className="w-5 h-5 ml-2 inline" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-screen py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
            >
              <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      Créer votre compte 
                    </h1>
                    <p className="text-gray-600">
                      Enregistrez vos informations en tant que propriétaire de ce compte 
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Informations personnelles */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations personnelles</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prénom *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Votre prénom"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Votre nom"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="votre@email.com"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sécurité */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Sécurité</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mot de passe *
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirmer le mot de passe *
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 pt-4">
                        <input
                          type="checkbox"
                          id="acceptTerms"
                          checked={formData.acceptTerms}
                          onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="acceptTerms" className="text-sm text-gray-600">
                          J'accepte les{' '}
                          <a href="#" className="text-blue-600 hover:text-blue-800 underline">
                            conditions d'utilisation
                          </a>{' '}
                          et la{' '}
                          <a href="#" className="text-blue-600 hover:text-blue-800 underline">
                            politique de confidentialité
                          </a>
                        </label>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="mt-8 flex justify-between">
                    <button
                      onClick={handleBack}
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span>Retour</span>
                    </button>
                    
                    <button
                      onClick={handleNext}
                      className="font-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <span>Continuer</span>
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'family' && (
            <motion.div
              key="family"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-screen py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
            >
              <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      Membres de la famille
                    </h1>
                    <p className="text-gray-600">
                      {selectedPlan && `Plan ${selectedPlan.name} : ${formData.familyMembers.length}/${selectedPlan.maxMembers} membre(s)`}
                    </p>
                  </div>

                  <div className="space-y-6">
                    {formData.familyMembers.map((member, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {index === 0 ? 'Propriétaire (Admin)' : `Membre ${index}`}
                          </h3>
                          {index > 0 && (
                            <button
                              onClick={() => removeFamilyMember(index)}
                              className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Prénom *
                            </label>
                            <input
                              type="text"
                              value={member.firstName}
                              onChange={(e) => handleFamilyMemberChange(index, 'firstName', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Prénom"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Nom *
                            </label>
                            <input
                              type="text"
                              value={member.lastName}
                              onChange={(e) => handleFamilyMemberChange(index, 'lastName', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Nom"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Date de naissance *
                            </label>
                            <input
                              type="date"
                              value={member.dateOfBirth}
                              onChange={(e) => handleFamilyMemberChange(index, 'dateOfBirth', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Genre
                            </label>
                            <select
                              value={member.gender}
                              onChange={(e) => handleFamilyMemberChange(index, 'gender', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="UNKNOWN">Non spécifié</option>
                              <option value="MALE">Masculin</option>
                              <option value="FEMALE">Féminin</option>
                            </select>
                          </div>

                          {member.userType === 'CHILD' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Niveau scolaire
                              </label>
                              <input
                                type="text"
                                value={member.grade || ''}
                                onChange={(e) => handleFamilyMemberChange(index, 'grade', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="ex: CP, CE1, 6ème..."
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {selectedPlan && formData.familyMembers.length < selectedPlan.maxMembers && (
                      <button
                        onClick={addFamilyMember}
                        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Ajouter un membre</span>
                      </button>
                    )}
                  </div>

                  {error && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="mt-8 flex justify-between">
                    <button
                      onClick={handleBack}
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span>Retour</span>
                    </button>
                    
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="font-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Créer mon compte</span>
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="min-h-screen py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
            >
              <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Bienvenue chez CubeAI ! 🎉
                  </h1>
                  
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Votre compte a été créé avec succès. Un email de bienvenue avec vos identifiants a été envoyé à votre adresse.
                  </p>

                  <div className="bg-gray-50 rounded-xl p-5 text-left max-w-lg mx-auto mb-8">
                    {(() => {
                      const dataRaw = typeof window !== 'undefined' ? localStorage.getItem('registrationData') : null
                      const data = dataRaw ? JSON.parse(dataRaw) : null
                      const account = data?.account
                      const plan = account?.subscriptionType
                      const regId = data?.registrationId
                      return (
                        <div className="space-y-2 text-sm">
                          {regId && (
                            <div className="flex justify-between"><span className="text-gray-600">ID d'inscription</span><span className="font-semibold text-gray-900">{regId}</span></div>
                          )}
                          {account?.email && (
                            <div className="flex justify-between"><span className="text-gray-600">Email</span><span className="font-semibold text-gray-900">{account.email}</span></div>
                          )}
                          {plan && (
                            <div className="flex justify-between"><span className="text-gray-600">Offre</span><span className="font-semibold text-gray-900">{plan}</span></div>
                          )}
                          {Array.isArray(data?.sessions) && (
                            <div className="mt-2 text-gray-600">{data.sessions.length} membre(s) créé(s)</div>
                          )}
                          <div className="mt-3 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
                            Un email de bienvenue avec vos identifiants a été envoyé à votre adresse.
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                  
                  <button
                    onClick={handleGoToLogin}
                    className="font-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Aller à la connexion
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
