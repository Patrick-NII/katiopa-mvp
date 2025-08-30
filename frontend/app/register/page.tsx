'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, Calendar, Baby, Users, Crown, Gift, Check, AlertCircle, Info, Eye, EyeOff, Lock, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { authAPI } from '@/lib/api'
import { CubeAILogo } from '@/components/MulticolorText'
import AnimatedIcon from '@/components/AnimatedIcons'

interface FamilyMember {
  id: string
  firstName: string
  lastName: string
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN'
  userType: 'CHILD' | 'PARENT'
  dateOfBirth: string
  grade?: string
  username: string
  password: string
  confirmPassword: string
  ageBracket?: string
}

interface ParentPrompts {
  objectives: string
  needs: string
  concerns: string
  preferences: string
  additionalInfo: string
}

interface PaymentInfo {
  cardNumber: string
  cardHolderName: string
  expiryMonth: string
  expiryYear: string
  cvv: string
  billingAddress: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  acceptTerms: boolean
  acceptMarketing: boolean
}

interface AccountData {
  email: string
  subscriptionType: 'STARTER' | 'PRO' | 'PREMIUM'
  maxSessions: number
  familyMembers: FamilyMember[]
  parentPrompts: ParentPrompts
  paymentInfo: PaymentInfo
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<'account' | 'family' | 'passwords' | 'prompts' | 'payment' | 'review' | 'success'>('account')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdSessions, setCreatedSessions] = useState<Array<{firstName:string; lastName:string; sessionId:string; userType:string;}>>([])
  
  // Données du compte
  const [accountData, setAccountData] = useState<AccountData>({
    email: '',
    subscriptionType: 'STARTER',
    maxSessions: 2,
    familyMembers: [],
    parentPrompts: {
      objectives: '',
      needs: '',
      concerns: '',
      preferences: '',
      additionalInfo: ''
    },
    paymentInfo: {
      cardNumber: '',
      cardHolderName: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      billingAddress: {
        street: '',
        city: '',
        postalCode: '',
        country: 'France'
      },
      acceptTerms: false,
      acceptMarketing: false
    }
  })

  // Données du formulaire actuel
  const [currentMember, setCurrentMember] = useState<Partial<FamilyMember>>({
    firstName: '',
    lastName: '',
    gender: 'UNKNOWN',
    userType: 'CHILD',
    dateOfBirth: '',
    grade: '',
    username: '',
    password: '',
    confirmPassword: '',
    ageBracket: undefined
  })

  // État pour afficher/masquer les mots de passe
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({})

  const subscriptionPlans = [
    {
      id: 'STARTER',
      name: "Starter",
      price: "0€",
      period: "/mois",
      maxSessions: 2,
      features: [
        "2 sessions simultanées",
        "1 parent + 1 enfant",
        "Accès complet à la plateforme",
        "Programmation, IA, maths et lecture",
        "Jeux éducatifs et progression",
        "Évaluation et coaching IA basique",
        "3 mois gratuit puis 9,99€/mois"
      ],
      icon: Gift,
      cardClass: 'card-starter',
      starter: true,
      description: "Parfait pour commencer l'aventure"
    },
    {
      id: 'PRO',
      name: 'Pro',
      price: '29,99€',
      period: '/mois',
      maxSessions: 2,
      features: [
        '2 sessions simultanées',
        '1 parent + 1 enfant',
        'Tous les exercices et contenus',
        'Communauté et défis familiaux',
        'Stats détaillées et rapports',
        'Certificats de progression',
        'IA coach personnalisé',
        'Support par email'
      ],
      icon: Crown,
      cardClass: 'card-pro',
      popular: true,
      description: "L'expérience complète recommandée"
    },
    {
      id: 'PREMIUM',
      name: 'Premium',
      price: '69,99€',
      period: '/mois',
      maxSessions: 6,
      features: [
        '6 sessions simultanées',
        '1 parent + jusqu\'à 5 enfants',
        'IA coach Premium avancé',
        'Certificats officiels reconnus',
        'Exports PDF/Excel détaillés',
        'Multi-appareils synchronisés',
        'Support prioritaire 24/7',
        'Programme de parrainage',
        'Contenus exclusifs'
      ],
      icon: Crown,
      cardClass: 'card-premium',
      complete: true,
      description: "La solution complète pour les familles"
    }
  ]

  // Prompts préconstruits pour guider les parents
  const predefinedPrompts = {
    objectives: [
      "Mon enfant a des difficultés en mathématiques et j'aimerais qu'il progresse",
      "Je veux que mon enfant développe sa créativité et son imagination",
      "Mon enfant est passionné par la technologie, je veux l'encourager",
      "Je souhaite que mon enfant améliore sa lecture et sa compréhension",
      "Mon enfant a besoin de renforcer sa confiance en soi",
      "Je veux que mon enfant découvre de nouveaux domaines d'apprentissage"
    ],
    needs: [
      "Mon enfant a besoin d'un accompagnement personnalisé",
      "Je cherche des exercices adaptés à son niveau",
      "Mon enfant a besoin de plus de temps pour comprendre",
      "Je veux des activités qui stimulent sa curiosité",
      "Mon enfant a besoin de structure et de routine",
      "Je cherche des outils pour suivre ses progrès"
    ],
    concerns: [
      "Mon enfant se décourage facilement face aux difficultés",
      "Je m'inquiète du temps passé devant les écrans",
      "Mon enfant a du mal à se concentrer",
      "Je crains qu'il ne prenne pas plaisir à apprendre",
      "Mon enfant compare ses résultats aux autres",
      "Je m'inquiète de son niveau par rapport aux autres enfants"
    ],
    preferences: [
      "Mon enfant préfère les activités ludiques et interactives",
      "Il aime les défis et les récompenses",
      "Mon enfant préfère apprendre à son rythme",
      "Il aime les histoires et les personnages",
      "Mon enfant préfère les activités courtes et variées",
      "Il aime collaborer avec d'autres enfants"
    ]
  }

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
    if (!currentMember.firstName || !currentMember.lastName || !currentMember.dateOfBirth || !currentMember.username) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    // Vérifier que l'username est unique dans la famille
    const isUsernameUnique = !accountData.familyMembers.some(member => 
      member.username.toLowerCase() === currentMember.username?.toLowerCase()
    )
    
    if (!isUsernameUnique) {
      setError('Cet identifiant de connexion est déjà utilisé par un autre membre de la famille')
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
      username: currentMember.username || `${currentMember.firstName?.toLowerCase()}${currentMember.lastName?.toLowerCase()}`,
      password: '',
      confirmPassword: '',
      ageBracket: getAgeBracket(calculateAge(currentMember.dateOfBirth!))
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
      username: '',
      password: '',
      confirmPassword: '',
      ageBracket: undefined
    })

    setError('')
  }

  const handleRemoveFamilyMember = (id: string) => {
    setAccountData(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.filter(member => member.id !== id)
    }))
  }

  const handleSubscriptionChange = (subscriptionType: 'STARTER' | 'PRO' | 'PREMIUM') => {
    const maxSessions = subscriptionType === 'PREMIUM' ? 6 : 2
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
    setStep('prompts')
    setError('')
  }

  const handlePromptsSubmit = () => {
    setStep('payment')
    setError('')
  }

  const handlePaymentSubmit = () => {
    if (!accountData.paymentInfo.acceptTerms) {
      setError('Vous devez accepter les conditions générales pour continuer')
      return
    }
    setStep('review')
    setError('')
  }

  const handleFinalSubmit = async () => {
    if (accountData.familyMembers.length === 0) {
      const planInfo = accountData.subscriptionType === 'PREMIUM' 
        ? '1 parent + jusqu\'à 5 enfants'
        : '1 parent + 1 enfant'
      setError(`Veuillez ajouter au moins un membre de la famille (${planInfo})`)
      return
    }

    if (accountData.familyMembers.length > accountData.maxSessions) {
      const planInfo = accountData.subscriptionType === 'PREMIUM' 
        ? '6 sessions simultanées (1 parent + jusqu\'à 5 enfants)'
        : '2 sessions simultanées (1 parent + 1 enfant)'
      setError(`Le plan ${accountData.subscriptionType} ne permet que ${planInfo}`)
      return
    }

    if (!validatePasswords()) {
      return
    }

    setLoading(true)
    setError('')

    try {
      // Mapping des types d'abonnement frontend -> backend
      const toBackendSubscriptionType = (t: 'STARTER' | 'PRO' | 'PREMIUM'): 'FREE' | 'PRO' | 'PRO_PLUS' => {
        if (t === 'STARTER') return 'FREE'
        if (t === 'PRO') return 'PRO'
        return 'PRO_PLUS'
      }

      const payload = {
        email: accountData.email,
        subscriptionType: toBackendSubscriptionType(accountData.subscriptionType as any),
        maxSessions: accountData.maxSessions,
        familyMembers: accountData.familyMembers.map(m => ({
          firstName: m.firstName,
          lastName: m.lastName,
          gender: m.gender,
          userType: m.userType,
          dateOfBirth: m.dateOfBirth,
          grade: m.grade,
          username: m.username,
          password: m.password,
          confirmPassword: m.confirmPassword,
        })),
        parentPrompts: accountData.parentPrompts,
        paymentInfo: {
          cardNumber: accountData.paymentInfo.cardNumber,
          cardHolderName: accountData.paymentInfo.cardHolderName,
          expiryMonth: accountData.paymentInfo.expiryMonth,
          expiryYear: accountData.paymentInfo.expiryYear,
          cvv: accountData.paymentInfo.cvv,
          billingAddress: accountData.paymentInfo.billingAddress,
          acceptTerms: accountData.paymentInfo.acceptTerms,
          acceptMarketing: accountData.paymentInfo.acceptMarketing
        }
      }

      const data = await authAPI.register(payload) as any
      
      if (data.success) {
        if (Array.isArray(data.sessions)) {
          setCreatedSessions(data.sessions)
        }
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

  const getAgeBracket = (age: number): string => {
    if (age >= 5 && age <= 7) return '5-7'
    if (age >= 8 && age <= 11) return '8-11'
    if (age >= 12 && age <= 15) return '12-15'
    return '5-7' // Valeur par défaut
  }

  const togglePasswordVisibility = (memberId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
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
              <Link href="/" className="font-body text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100 flex items-center gap-2">
                <AnimatedIcon type="home" className="w-5 h-5" />
                Accueil
              </Link>
              <Link href="/login" className="font-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium">
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          
          <p className="text-lg text-gray-600 text-center max-w-2xl">
            Créez votre compte et donnez à votre enfant accès au cubeAI
          </p>
        </motion.div>

        {/* Étapes */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {['account', 'family', 'passwords', 'prompts', 'payment', 'review', 'success'].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepName 
                    ? 'bg-blue-600 text-white' 
                    : step === 'success' || ['account', 'family', 'passwords', 'prompts', 'payment', 'review'].indexOf(step) < index
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {step === 'success' || ['account', 'family', 'passwords', 'prompts', 'payment', 'review'].indexOf(step) < index ? (
                    <Check size={16} />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 6 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step === 'success' || ['account', 'family', 'passwords', 'prompts', 'payment', 'review'].indexOf(step) < index
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
              <h2 className="text-xl text-center text-gray-800 mb-6">
                Choisissez votre plan d'abonnement
              </h2>

              <div className="grid md:grid-cols-3 gap-6 mb-8 items-stretch">
                {subscriptionPlans.map((plan) => {
                  const Icon = plan.icon
                  return (
                    <motion.div
                      key={plan.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all flex flex-col h-full ${
                        accountData.subscriptionType === plan.id
                          ? 'scale-105'
                          : 'hover:scale-105'
                      } ${plan.cardClass}`}
                      onClick={() => handleSubscriptionChange(plan.id as any)}
                    >
                      {accountData.subscriptionType === plan.id && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center">
                          <Check size={16} className="text-gray-800" />
                        </div>
                      )}
                      
                      {plan.starter && (
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                          <AnimatedIcon type="gift" />
                        </div>
                      )}
                      
                      {plan.popular && (
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                          <AnimatedIcon type="star" />
                        </div>
                      )}
                      
                      {plan.complete && (
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                          <AnimatedIcon type="crown" />
                        </div>
                      )}
                      
                      <div className="text-center mb-6">
                        <h3 className="text-xl text-white mb-3">{plan.name}</h3>
                        <div className="mb-2">
                          <span className={`text-lg text-white ${plan.name === 'Starter' ? 'text-green-100' : ''}`}>
                            {plan.price}
                          </span>
                          <span className="font-body text-white/80">{plan.period}</span>
                        </div>
                        <p className="font-body text-white/90 mb-2">
                          {plan.maxSessions === 2 ? '2 sessions' : '6 sessions'} • {plan.maxSessions === 2 ? '1 parent + 1 enfant' : '1 parent + 5 enfants'}
                        </p>
                        <p className="font-body text-white/80 text-sm italic">{plan.description}</p>
                      </div>
                      
                      <ul className="space-y-3 mb-6 flex-grow">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start space-x-3">
                            <svg className="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="font-body text-white/90 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="text-center mt-auto">
                        <span className="text-lg font-semibold text-white/90">
                          {plan.maxSessions === 2 ? '2 sessions' : '6 sessions'}
                        </span>
                        <p className="text-sm text-white/80 mt-1">
                          {plan.maxSessions === 2 ? '1 parent + 1 enfant' : '1 parent + 5 enfants'}
                        </p>
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
                  {accountData.subscriptionType === 'PREMIUM' ? '6 sessions simultanées' : '2 sessions simultanées'} • {' '}
                  {accountData.subscriptionType === 'PREMIUM' ? '1 parent + jusqu\'à 5 enfants' : '1 parent + 1 enfant'}
                </p>
                <p className="text-xs text-blue-600 mt-1">
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

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Identifiant de connexion unique
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={currentMember.username}
                      onChange={(e) => setCurrentMember(prev => ({ ...prev, username: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Identifiant unique (ex: lucas2024, emma_pro)"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const suggestedUsername = `${currentMember.firstName?.toLowerCase()}${currentMember.lastName?.toLowerCase()}${Math.floor(Math.random() * 100)}`
                        setCurrentMember(prev => ({ ...prev, username: suggestedUsername }))
                      }}
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Générer un identifiant suggéré"
                    >
                      🎲
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Cet identifiant sera utilisé pour se connecter à la session de {currentMember.firstName || 'cet enfant'}
                  </p>
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

                {accountData.familyMembers.length >= accountData.maxSessions ? (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700 text-center">
                      Limite atteinte : {accountData.maxSessions} session{accountData.maxSessions > 1 ? 's' : ''} maximum pour le plan {accountData.subscriptionType}
                    </p>
                  </div>
                ) : (
                <motion.button
                  type="button"
                  onClick={handleAddFamilyMember}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all"
                >
                  Ajouter ce membre
                </motion.button>
                )}
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
                          <div className="font-medium text-blue-600">ID: {member.username}</div>
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
                  className="px-6 py-3 bg-white border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all font-medium shadow-sm"
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
                  className="px-6 py-3 bg-white border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all font-medium shadow-sm"
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

          {/* Étape 4: Prompts des parents */}
          {step === 'prompts' && (
            <motion.div
              key="prompts"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
                Partagez vos objectifs et besoins
              </h2>

              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-800">
                  <Info size={16} />
                  <span className="font-medium">Aide à la personnalisation</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Ces informations nous aideront à personnaliser l'expérience d'apprentissage de votre enfant. 
                  Cette étape est facultative mais recommandée pour un meilleur accompagnement.
                </p>
              </div>

              <div className="space-y-6">
                {/* Objectifs */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    Quels sont vos objectifs principaux pour votre enfant ?
                  </label>
                  <div className="grid md:grid-cols-2 gap-3 mb-4">
                    {predefinedPrompts.objectives.map((prompt, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setAccountData(prev => ({
                          ...prev,
                          parentPrompts: {
                            ...prev.parentPrompts,
                            objectives: prev.parentPrompts.objectives ? 
                              prev.parentPrompts.objectives + ' ' + prompt : 
                              prompt
                          }
                        }))}
                        className="p-3 text-left bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all text-sm"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={accountData.parentPrompts.objectives}
                    onChange={(e) => setAccountData(prev => ({
                      ...prev,
                      parentPrompts: { ...prev.parentPrompts, objectives: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Décrivez vos objectifs pour l'apprentissage de votre enfant..."
                    rows={3}
                  />
                </div>

                {/* Besoins */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    Quels sont les besoins spécifiques de votre enfant ?
                  </label>
                  <div className="grid md:grid-cols-2 gap-3 mb-4">
                    {predefinedPrompts.needs.map((prompt, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setAccountData(prev => ({
                          ...prev,
                          parentPrompts: {
                            ...prev.parentPrompts,
                            needs: prev.parentPrompts.needs ? 
                              prev.parentPrompts.needs + ' ' + prompt : 
                              prompt
                          }
                        }))}
                        className="p-3 text-left bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all text-sm"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={accountData.parentPrompts.needs}
                    onChange={(e) => setAccountData(prev => ({
                      ...prev,
                      parentPrompts: { ...prev.parentPrompts, needs: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Décrivez les besoins spécifiques de votre enfant..."
                    rows={3}
                  />
                </div>

                {/* Préoccupations */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    Quelles sont vos principales préoccupations ?
                  </label>
                  <div className="grid md:grid-cols-2 gap-3 mb-4">
                    {predefinedPrompts.concerns.map((prompt, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setAccountData(prev => ({
                          ...prev,
                          parentPrompts: {
                            ...prev.parentPrompts,
                            concerns: prev.parentPrompts.concerns ? 
                              prev.parentPrompts.concerns + ' ' + prompt : 
                              prompt
                          }
                        }))}
                        className="p-3 text-left bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all text-sm"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={accountData.parentPrompts.concerns}
                    onChange={(e) => setAccountData(prev => ({
                      ...prev,
                      parentPrompts: { ...prev.parentPrompts, concerns: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Partagez vos préoccupations concernant l'apprentissage..."
                    rows={3}
                  />
                </div>

                {/* Préférences */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    Quelles sont les préférences d'apprentissage de votre enfant ?
                  </label>
                  <div className="grid md:grid-cols-2 gap-3 mb-4">
                    {predefinedPrompts.preferences.map((prompt, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setAccountData(prev => ({
                          ...prev,
                          parentPrompts: {
                            ...prev.parentPrompts,
                            preferences: prev.parentPrompts.preferences ? 
                              prev.parentPrompts.preferences + ' ' + prompt : 
                              prompt
                          }
                        }))}
                        className="p-3 text-left bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all text-sm"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={accountData.parentPrompts.preferences}
                    onChange={(e) => setAccountData(prev => ({
                      ...prev,
                      parentPrompts: { ...prev.parentPrompts, preferences: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Décrivez les préférences d'apprentissage de votre enfant..."
                    rows={3}
                  />
                </div>

                {/* Informations supplémentaires */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    Informations supplémentaires (optionnel)
                  </label>
                  <textarea
                    value={accountData.parentPrompts.additionalInfo}
                    onChange={(e) => setAccountData(prev => ({
                      ...prev,
                      parentPrompts: { ...prev.parentPrompts, additionalInfo: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Toute autre information que vous souhaitez partager pour personnaliser l'expérience..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <motion.button
                  type="button"
                  onClick={() => setStep('passwords')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-white border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all font-medium shadow-sm"
                >
                  Retour
                </motion.button>
                
                <motion.button
                  type="button"
                  onClick={handlePromptsSubmit}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                >
                  Continuer - Vérifier et confirmer
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Étape 5: Informations de paiement */}
          {step === 'payment' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
                Informations de paiement
              </h2>

              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-800">
                  <Info size={16} />
                  <span className="font-medium">Plan {accountData.subscriptionType}</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  {accountData.subscriptionType === 'STARTER' ? (
                    <>
                      <strong>Offre gratuite de 3 mois</strong> - Aucun prélèvement immédiat. 
                      Le premier prélèvement de 9,99€ sera programmé le premier jour après la fin de l'offre gratuite.
                    </>
                  ) : accountData.subscriptionType === 'PRO' ? (
                    <>
                      <strong>29,99€/mois</strong> - Premier prélèvement le jour d'inscription, puis tous les 4 semaines.
                    </>
                  ) : (
                    <>
                      <strong>69,99€/mois</strong> - Premier prélèvement le jour d'inscription, puis tous les 4 semaines.
                    </>
                  )}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Les prélèvements sont programmés au meilleur moment de la journée pour votre confort. 
                  {accountData.subscriptionType === 'STARTER' ? ' Aucun prélèvement pendant les 3 premiers mois.' : ' Premier prélèvement immédiat, puis tous les 4 semaines.'}
                </p>
                {accountData.subscriptionType === 'STARTER' && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-xs text-yellow-800">
                      <strong>Note importante :</strong> Même pour l'offre gratuite, nous avons besoin de vos informations de paiement pour programmer le premier prélèvement après la période gratuite.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Informations de la carte */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de la carte bancaire</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de carte</label>
                      <input
                        type="text"
                        value={accountData.paymentInfo.cardNumber}
                        onChange={(e) => setAccountData(prev => ({
                          ...prev,
                          paymentInfo: { ...prev.paymentInfo, cardNumber: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom du titulaire</label>
                      <input
                        type="text"
                        value={accountData.paymentInfo.cardHolderName}
                        onChange={(e) => setAccountData(prev => ({
                          ...prev,
                          paymentInfo: { ...prev.paymentInfo, cardHolderName: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Jean Dupont"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mois d'expiration</label>
                      <select
                        value={accountData.paymentInfo.expiryMonth}
                        onChange={(e) => setAccountData(prev => ({
                          ...prev,
                          paymentInfo: { ...prev.paymentInfo, expiryMonth: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Mois</option>
                        {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                          <option key={month} value={month.toString().padStart(2, '0')}>
                            {month.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Année d'expiration</label>
                      <select
                        value={accountData.paymentInfo.expiryYear}
                        onChange={(e) => setAccountData(prev => ({
                          ...prev,
                          paymentInfo: { ...prev.paymentInfo, expiryYear: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Année</option>
                        {Array.from({length: 10}, (_, i) => new Date().getFullYear() + i).map(year => (
                          <option key={year} value={year.toString()}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Code de sécurité</label>
                      <input
                        type="text"
                        value={accountData.paymentInfo.cvv}
                        onChange={(e) => setAccountData(prev => ({
                          ...prev,
                          paymentInfo: { ...prev.paymentInfo, cvv: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="123"
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>

                {/* Adresse de facturation */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Adresse de facturation</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                      <input
                        type="text"
                        value={accountData.paymentInfo.billingAddress.street}
                        onChange={(e) => setAccountData(prev => ({
                          ...prev,
                          paymentInfo: { 
                            ...prev.paymentInfo, 
                            billingAddress: { ...prev.paymentInfo.billingAddress, street: e.target.value }
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="123 Rue de la Paix"
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                        <input
                          type="text"
                          value={accountData.paymentInfo.billingAddress.city}
                          onChange={(e) => setAccountData(prev => ({
                            ...prev,
                            paymentInfo: { 
                              ...prev.paymentInfo, 
                              billingAddress: { ...prev.paymentInfo.billingAddress, city: e.target.value }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Paris"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Code postal</label>
                        <input
                          type="text"
                          value={accountData.paymentInfo.billingAddress.postalCode}
                          onChange={(e) => setAccountData(prev => ({
                            ...prev,
                            paymentInfo: { 
                              ...prev.paymentInfo, 
                              billingAddress: { ...prev.paymentInfo.billingAddress, postalCode: e.target.value }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="75001"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pays</label>
                        <select
                          value={accountData.paymentInfo.billingAddress.country}
                          onChange={(e) => setAccountData(prev => ({
                            ...prev,
                            paymentInfo: { 
                              ...prev.paymentInfo, 
                              billingAddress: { ...prev.paymentInfo.billingAddress, country: e.target.value }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="France">France</option>
                          <option value="Belgique">Belgique</option>
                          <option value="Suisse">Suisse</option>
                          <option value="Canada">Canada</option>
                          <option value="Autre">Autre</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conditions et consentements */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      checked={accountData.paymentInfo.acceptTerms}
                      onChange={(e) => setAccountData(prev => ({
                        ...prev,
                        paymentInfo: { ...prev.paymentInfo, acceptTerms: e.target.checked }
                      }))}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                      J'accepte les <a href="#" className="text-blue-600 hover:text-blue-700 underline">conditions générales</a> et la{' '}
                      <a href="#" className="text-blue-600 hover:text-blue-700 underline">politique de confidentialité</a>
                    </label>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="acceptMarketing"
                      checked={accountData.paymentInfo.acceptMarketing}
                      onChange={(e) => setAccountData(prev => ({
                        ...prev,
                        paymentInfo: { ...prev.paymentInfo, acceptMarketing: e.target.checked }
                      }))}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="acceptMarketing" className="text-sm text-gray-700">
                      J'accepte de recevoir des communications marketing et des offres spéciales (optionnel)
                    </label>
                  </div>
                </div>

                {/* Informations de sécurité */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <Check size={16} />
                    <span className="font-medium">Paiement sécurisé</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Vos informations de paiement sont chiffrées et sécurisées. Nous utilisons les standards de sécurité les plus élevés.
                  </p>
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
                  onClick={() => setStep('prompts')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-white border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all font-medium shadow-sm"
                >
                  Retour
                </motion.button>
                
                <motion.button
                  type="button"
                  onClick={handlePaymentSubmit}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                >
                  Continuer - Vérifier et confirmer
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Étape 6: Vérification et confirmation */}
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
                          <div className="font-medium text-blue-600">ID de connexion: {member.username}</div>
                          <div className="text-xs text-gray-600">Mot de passe défini ✓</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Informations de paiement */}
                <div className="bg-orange-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
                    <CreditCard size={20} />
                    Informations de paiement
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-orange-700">Plan:</span>
                      <p className="text-orange-900 text-sm">{accountData.subscriptionType}</p>
                    </div>
                    {accountData.subscriptionType === 'STARTER' ? (
                      <div className="bg-green-100 p-3 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>Offre gratuite de 3 mois</strong> - Aucun prélèvement immédiat. 
                          Le premier prélèvement de 9,99€ sera programmé le premier jour après la fin de l'offre gratuite.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>{accountData.subscriptionType === 'PRO' ? '29,99€' : '69,99€'}/mois</strong> - 
                          Premier prélèvement le jour d'inscription, puis tous les 4 semaines.
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-orange-700">Titulaire de la carte:</span>
                      <p className="text-orange-900 text-sm">{accountData.paymentInfo.cardHolderName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-orange-700">Adresse de facturation:</span>
                      <p className="text-orange-900 text-sm">
                        {accountData.paymentInfo.billingAddress.street}, {accountData.paymentInfo.billingAddress.postalCode} {accountData.paymentInfo.billingAddress.city}, {accountData.paymentInfo.billingAddress.country}
                      </p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Confirmation par email:</strong> Vous recevrez un email de confirmation avec les détails de programmation des prélèvements.
                        {accountData.subscriptionType === 'STARTER' ? ' Aucun prélèvement pendant les 3 premiers mois.' : ' Premier prélèvement immédiat.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Prompts des parents */}
                {(accountData.parentPrompts.objectives || accountData.parentPrompts.needs || accountData.parentPrompts.concerns || accountData.parentPrompts.preferences || accountData.parentPrompts.additionalInfo) && (
                  <div className="bg-purple-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                      <Info size={20} />
                      Vos objectifs et préférences
                    </h3>
                    <div className="space-y-3">
                      {accountData.parentPrompts.objectives && (
                        <div>
                          <span className="text-sm font-medium text-purple-700">Objectifs:</span>
                          <p className="text-purple-900 text-sm">{accountData.parentPrompts.objectives}</p>
                        </div>
                      )}
                      {accountData.parentPrompts.needs && (
                        <div>
                          <span className="text-sm font-medium text-purple-700">Besoins:</span>
                          <p className="text-purple-900 text-sm">{accountData.parentPrompts.needs}</p>
                        </div>
                      )}
                      {accountData.parentPrompts.concerns && (
                        <div>
                          <span className="text-sm font-medium text-purple-700">Préoccupations:</span>
                          <p className="text-purple-900 text-sm">{accountData.parentPrompts.concerns}</p>
                        </div>
                      )}
                      {accountData.parentPrompts.preferences && (
                        <div>
                          <span className="text-sm font-medium text-purple-700">Préférences:</span>
                          <p className="text-purple-900 text-sm">{accountData.parentPrompts.preferences}</p>
                        </div>
                      )}
                      {accountData.parentPrompts.additionalInfo && (
                        <div>
                          <span className="text-sm font-medium text-purple-700">Informations supplémentaires:</span>
                          <p className="text-purple-900 text-sm">{accountData.parentPrompts.additionalInfo}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                  className="px-6 py-3 bg-white border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all font-medium shadow-sm"
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
                <div className="space-y-4">
                  {(createdSessions.length > 0 ? createdSessions : accountData.familyMembers).map((m: any) => (
                    <div key={(m.id || m.sessionId)} className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        {(m.userType === 'CHILD') ? <Baby size={16} /> : <Users size={16} />}
                        <span className="font-medium text-green-900">
                          {m.firstName} {m.lastName}
                        </span>
                      </div>
                      <div className="text-sm text-green-700 space-y-1">
                        <div><strong>Identifiant:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{m.sessionId || m.username}</code></div>
                        <div><strong>Mot de passe:</strong> <code className="bg-gray-100 px-2 py-1 rounded">••••••••</code></div>
                        <div className="text-xs text-gray-600">
                          {(m.userType === 'CHILD') ? 'Utilisez ces identifiants pour connecter votre enfant' : 'Utilisez ces identifiants pour vous connecter'}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <strong>Important:</strong> Notez bien ces identifiants ! Ils ont également été envoyés par email à {accountData.email}
                    </p>
                  </div>
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
    </div>
  )
}
