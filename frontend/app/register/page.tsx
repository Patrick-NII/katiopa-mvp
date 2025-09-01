'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mail, Lock, Eye, EyeOff, Check, ArrowRight, ArrowLeft, Plus, X, Users, Gift, Star, Sparkles,
  CreditCard, ShieldCheck, Edit3, WalletMinimal, Tags, Apple, Landmark, CircleCheck, Info
} from 'lucide-react'
import Link from 'next/link'
import { authAPI } from '@/lib/api'
import { CubeAILogo } from '@/components/MulticolorText'
import Image from 'next/image'

/* ----------------------------- Types & helpers ---------------------------- */

interface FamilyMember {
  firstName: string
  lastName: string
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN'
  userType: 'CHILD' | 'PARENT'
  dateOfBirth: string
  grade?: string
  username?: string            // identifiant de session
  sessionPassword?: string     // mot de passe de session
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

  promoCode?: string
  selectedPaymentMethod?: 'card' | 'applepay' | 'paypal' | 'sepa'
  paymentMethodId?: string        // id tokenisé PSP (Stripe/PayPal/SEPA)
  payCard?: {
    name: string
    number: string
    expMonth: string
    expYear: string
    cvc: string
  }
  paySEPA?: {
    name: string
    iban: string
  }
  payPaypal?: {
    email: string
  }
  parentPrompts?: {
    objectives?: string
    preferences?: string
    concerns?: string
  }
}

const PLAN_PRICES: Record<RegistrationData['subscriptionType'], number> = {
  STARTER: 0,
  PRO: 29.99,
  PREMIUM: 69.99
}

function formatPrice(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€'
}

function generateUsername(base: string, taken: Set<string>) {
  const seed = base.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'user'
  let candidate = seed
  let i = 1
  while (taken.has(candidate)) {
    candidate = `${seed}${i++}`
  }
  return candidate
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*'
  let out = ''
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

/* -------------------------------- Component ------------------------------- */

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<'subscription' | 'account' | 'family' | 'payment' | 'success'>('subscription')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [emailHelper, setEmailHelper] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [promoStatus, setPromoStatus] = useState<'applied' | 'invalid' | null>(null)
  const [promoDiscountPct, setPromoDiscountPct] = useState<number>(0)
  const [navUser, setNavUser] = useState<any>(null)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [usernameHelper, setUsernameHelper] = useState('')
  const [childUsernameStatus, setChildUsernameStatus] = useState<Record<number, { status: 'idle' | 'checking' | 'available' | 'taken', helper: string }>>({})
  const [showChildPassword, setShowChildPassword] = useState<Record<number, boolean>>({})
  
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
        grade: '',
        username: '',            // ID parent stocké ici
        sessionPassword: ''      // (non utilisé pour le parent)
      }
    ],
    acceptTerms: false,
    promoCode: '',
    selectedPaymentMethod: 'card',
    parentPrompts: {
      objectives: '',
      preferences: '',
      concerns: ''
    }
  })

  /* --------------------------------- PLANS --------------------------------- */
  const subscriptionPlans = [
    {
      id: 'STARTER',
      name: 'Starter',
      price: '0€',
      period: '/mois',
      description: 'Démarrez gratuitement et découvrez CubeAI en douceur.',
      features: [
        '1 session simultanée',
        '1 propriétaire (admin)',
        'Accès complet à la plateforme',
        'Programmation, IA, maths et lecture',
        'Jeux éducatifs et progression',
        'Évaluation et coaching IA basique',
        '3 mois gratuit puis 9,99€/mois'
      ],
      maxMembers: 2,
      popular: false,
      starter: true,
      cardClass: 'card-starter',
      icon: Gift,
      color: 'from-green-500 to-emerald-600',
      selected: {
        container: 'border-emerald-900 bg-gradient-to-br from-emerald-800 to-teal-900',
        ring: 'ring-emerald-400/50',
        buttonBorder: 'border-emerald-800',
        glow: 'shadow-[0_10px_40px_rgba(16,185,129,0.45)]'
      },
      cta: 'Commencer gratuitement'
    },
    {
      id: 'PRO',
      name: 'Pro',
      price: '29,99€',
      period: '/mois',
      description: 'Progressez chaque semaine avec des rapports et un coach IA.',
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
      cardClass: 'card-pro',
      icon: Star,
      color: 'from-blue-500 to-indigo-600',
      selected: {
        container: 'border-indigo-900 bg-gradient-to-br from-indigo-800 to-blue-900',
        ring: 'ring-indigo-400/50',
        buttonBorder: 'border-indigo-800',
        glow: 'shadow-[0_10px_40px_rgba(79,70,229,0.45)]'
      },
      cta: 'Choisir Pro'
    },
    {
      id: 'PREMIUM',
      name: 'Premium',
      price: '69,99€',
      period: '/mois',
      description: 'La solution familiale la plus complète, sans compromis.',
      features: [
        '6 sessions simultanées',
        "1 propriétaire + jusqu'à 5 membres",
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
      cardClass: 'card-premium',
      icon: Sparkles,
      color: 'from-purple-500 to-pink-600',
      selected: {
        container: 'border-fuchsia-900 bg-gradient-to-br from-purple-900 to-fuchsia-900',
        ring: 'ring-fuchsia-400/50',
        buttonBorder: 'border-fuchsia-800',
        glow: 'shadow-[0_10px_40px_rgba(217,70,239,0.45)]'
      },
      cta: 'Passer en Premium'
    }
  ] as const

  const selectedPlan = subscriptionPlans.find(p => p.id === formData.subscriptionType)!

  // État connexion pour la nav (en ligne + avatar + déconnexion)
  useEffect(() => {
    let mounted = true
    authAPI.verify().then(res => {
      if (mounted && res?.success) setNavUser(res.user)
    }).catch(() => {})
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cubeai:auth') {
        authAPI.verify().then(res => {
          if (mounted) setNavUser(res?.success ? res.user : null)
        }).catch(() => { if (mounted) setNavUser(null) })
      }
    }
    window.addEventListener('storage', onStorage)
    return () => { mounted = false; window.removeEventListener('storage', onStorage) }
  }, [])

  /* -------------------------- Handlers & Validations ------------------------ */

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

  // Fonction pour formater la date en français jj/mm/aaaa
  const formatDateToFrench = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Fonction pour convertir le format français vers ISO
  const formatFrenchToISO = (frenchDate: string) => {
    if (!frenchDate || !frenchDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) return frenchDate
    const [day, month, year] = frenchDate.split('/')
    return `${year}-${month}-${day}`
  }

  // Fonction pour valider et formater la saisie de date
  const handleDateInput = (index: number, value: string) => {
    // Supprimer tous les caractères non numériques sauf /
    let cleaned = value.replace(/[^\d\/]/g, '')
    
    // Limiter à 10 caractères (jj/mm/aaaa)
    if (cleaned.length > 10) cleaned = cleaned.slice(0, 10)
    
    // Ajouter automatiquement les /
    if (cleaned.length === 2 && !cleaned.includes('/')) {
      cleaned = cleaned + '/'
    }
    if (cleaned.length === 5 && cleaned.split('/').length === 2) {
      cleaned = cleaned + '/'
    }
    
    handleFamilyMemberChange(index, 'dateOfBirth', cleaned)
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
      familyMembers: [
        ...prev.familyMembers,
        {
        firstName: '',
        lastName: '',
        gender: 'UNKNOWN',
        userType: 'CHILD',
        dateOfBirth: '',
          grade: '',
          username: '',
          sessionPassword: ''
        }
      ]
    }))
    setError('')
  }

  const removeFamilyMember = (index: number) => {
    if (index === 0) return // on ne touche pas au parent ici
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
    if (!formData.familyMembers[0].username) {
      setError('Veuillez choisir un identifiant de connexion pour le parent')
      return false
    }
    if (usernameStatus === 'taken') {
      setError("Cet identifiant de connexion est déjà utilisé")
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
    // On ne valide que les enfants (index > 0)
    const children = formData.familyMembers.slice(1)
    const hasValidMembers = children.every(member =>
      member.firstName && member.lastName && member.dateOfBirth && member.username && member.sessionPassword
    )
    if (!hasValidMembers && children.length > 0) {
      setError('Chaque membre doit avoir prénom, nom, date de naissance, identifiant et mot de passe de session')
      return false
    }
    // Unicité des identifiants dans la famille
    const usernames = formData.familyMembers.map(m => (m.username || '').toLowerCase()).filter(Boolean)
    const hasDupUsername = usernames.some((u, i) => usernames.indexOf(u) !== i)
    if (hasDupUsername) {
      setError('Chaque identifiant de session doit être unique dans la famille')
      return false
    }
    // Vérifier disponibilités côté serveur (enfants)
    const takenChild = Object.entries(childUsernameStatus).some(([, v]) => v?.status === 'taken')
    if (takenChild) {
      setError('Un ou plusieurs identifiants sont déjà pris. Merci d\'en choisir d\'autres.')
      return false
    }
    // Unicité des mots de passe (différent du parent et entre enfants)
    const parentPwd = formData.password
    const childPwds = children.map(c => c.sessionPassword || '')
    if (childPwds.includes(parentPwd)) {
      setError('Le mot de passe d\'un enfant ne peut pas être identique à celui du parent')
      return false
    }
    const childPwdDup = childPwds.some((p, i) => p && childPwds.indexOf(p) !== i)
    if (childPwdDup) {
      setError('Les mots de passe des enfants doivent être tous différents')
      return false
    }
    return true
  }

  const validateStepPayment = () => {
    if (!formData.selectedPaymentMethod) {
      setError('Veuillez sélectionner une méthode de paiement')
      return false
    }
    if (formData.selectedPaymentMethod !== 'applepay' && selectedPlan.id !== 'STARTER' && !formData.paymentMethodId) {
      setError('Veuillez renseigner vos informations de paiement')
      return false
    }
    return true
  }

  /* --------------------------- Prix, promo, résumé -------------------------- */

  const basePrice = useMemo(() => PLAN_PRICES[formData.subscriptionType], [formData.subscriptionType])
  const discountedPrice = useMemo(() => {
    if (!promoDiscountPct) return basePrice
    const after = Math.max(0, basePrice * (1 - promoDiscountPct / 100))
    return Number(after.toFixed(2))
  }, [basePrice, promoDiscountPct])

  const applyPromo = () => {
    const code = (formData.promoCode || '').trim().toUpperCase()
    if (!code) { setPromoStatus(null); setPromoDiscountPct(0); return }
    if (code === 'CUBE20') {
      setPromoStatus('applied'); setPromoDiscountPct(20)
    } else if (code === 'BIENVENUE10') {
      setPromoStatus('applied'); setPromoDiscountPct(10)
    } else {
      setPromoStatus('invalid'); setPromoDiscountPct(0)
    }
  }

  /* ------------------------------- Navigation ------------------------------- */

  const handleNext = () => {
    if (step === 'subscription') {
      const email = (formData.email || '').trim()
      if (!email) {
        setError('Veuillez saisir votre email')
        return
      }
      // Validation basique
      const basicOk = /.+@.+\..+/.test(email)
      if (!basicOk) {
        setError("Veuillez saisir un email valide")
        return
      }
      // Vérification immédiate côté serveur pour éviter un échec tardif
      setLoading(true)
      authAPI.checkEmail(email)
        .then(res => {
          if (res && res.available) {
      setStep('account')
            setError('')
          } else {
            setError('Un compte avec cet email existe déjà. Veuillez vous connecter ou utiliser un autre email.')
          }
        })
        .catch(() => setError("Impossible de vérifier l'email pour le moment"))
        .finally(() => setLoading(false))
    } else if (step === 'account' && validateStep1()) {
      setStep('family')
    } else if (step === 'family' && validateStep2()) {
      setStep('payment')
    }
  }

  const handleBack = () => {
    if (step === 'account') setStep('subscription')
    else if (step === 'family') setStep('account')
    else if (step === 'payment') {
      // Nettoyage infos sensibles
      setFormData(prev => ({ ...prev, paymentMethodId: undefined }))
      setStep('family')
    }
  }

  /* ------------------------------- Submit API ------------------------------- */

  // Fonction pour générer un paymentMethodId simulé
  const generatePaymentMethodId = () => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 10000)
    return `pm_${formData.selectedPaymentMethod}_${timestamp}_${random}`
  }

  const handleSubmit = async () => {
    if (step !== 'payment') return
    if (!validateStepPayment()) return

    setLoading(true)
    setError('')

    try {
      const payload = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        subscriptionType:
          formData.subscriptionType === 'STARTER' ? 'FREE' :
                         formData.subscriptionType === 'PRO' ? 'PRO' : 'PRO_PLUS',
        familyMembers: formData.familyMembers.map((member, index) => ({
          firstName: member.firstName,
          lastName: member.lastName,
          gender: member.gender,
          userType: member.userType,
          // Convertit jj/mm/aaaa -> yyyy-mm-dd pour compatibilité backend
          dateOfBirth: formatFrenchToISO(member.dateOfBirth),
          grade: member.grade,
          username: member.username || `${member.firstName.toLowerCase()}_${Date.now()}`,
          sessionPassword: index === 0 ? formData.password : member.sessionPassword
        })),
        parentPrompts: {
          objectives: formData.parentPrompts?.objectives || '',
          preferences: formData.parentPrompts?.preferences || '',
          concerns: formData.parentPrompts?.concerns || ''
        },
        selectedPaymentMethod: formData.selectedPaymentMethod,
        payCard: formData.payCard,
        paySEPA: formData.paySEPA,
        payPaypal: formData.payPaypal,
        promoCode: formData.promoCode,
        acceptTerms: true
      }

      const response = await authAPI.register(payload)
      
      if (response.success) {
        setStep('success')
        if (typeof window !== 'undefined') {
        localStorage.setItem('registrationData', JSON.stringify(response.data || response))
        }
      } else {
        setError(response.error || 'Erreur lors de l\'inscription')
      }
    } catch (err: any) {
      if (err?.code === 'EMAIL_ALREADY_EXISTS' || err?.status === 409) {
        setError('Un compte avec cet email existe déjà. Veuillez vous connecter ou utiliser un autre email.')
        setStep('subscription')
      } else {
      setError(err.message || 'Erreur de connexion au serveur')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoToLogin = () => {
    router.push('/login')
  }

  // Vérification email en temps réel (debounce)
  useEffect(() => {
    const email = (formData.email || '').trim()
    if (!email) {
      setEmailStatus('idle')
      setEmailHelper('')
      return
    }
    const basicOk = /.+@.+\..+/.test(email)
    if (!basicOk) {
      setEmailStatus('invalid')
      setEmailHelper('Format email invalide')
      return
    }
    setEmailStatus('checking')
    setEmailHelper('Vérification de la disponibilité...')
    const t = setTimeout(async () => {
      try {
        const res = await authAPI.checkEmail(email)
        if (res.available) {
          setEmailStatus('available')
          setEmailHelper('Email disponible')
        } else {
          setEmailStatus('taken')
          setEmailHelper('Un compte existe déjà avec cet email')
        }
      } catch (e) {
        setEmailStatus('idle')
        setEmailHelper('')
      }
    }, 400)
    return () => clearTimeout(t)
  }, [formData.email])

  // Vérification identifiant parent en temps réel (debounce)
  useEffect(() => {
    const uname = (formData.familyMembers?.[0]?.username || '').trim()
    if (!uname) { setUsernameStatus('idle'); setUsernameHelper(''); return }
    setUsernameStatus('checking'); setUsernameHelper('Vérification de la disponibilité...')
    const t = setTimeout(async () => {
      try {
        const res = await authAPI.checkSession(uname)
        if (res.available) { setUsernameStatus('available'); setUsernameHelper('Identifiant disponible') }
        else { setUsernameStatus('taken'); setUsernameHelper('Identifiant déjà pris') }
      } catch { setUsernameStatus('idle'); setUsernameHelper('') }
    }, 400)
    return () => clearTimeout(t)
  }, [formData.familyMembers?.[0]?.username])

  // Vérification identifiants enfants en temps réel (debounce groupé)
  useEffect(() => {
    const entries = formData.familyMembers
      .map((m, i) => ({ i, u: (m.username || '').trim() }))
      .filter(x => x.i > 0 && x.u)

    if (entries.length === 0) {
      setChildUsernameStatus({})
      return
    }

    // Pré-état: checking
    setChildUsernameStatus(prev => {
      const next = { ...prev }
      for (const { i } of entries) next[i] = { status: 'checking', helper: 'Vérification de la disponibilité...' }
      return next
    })

    const t = setTimeout(async () => {
      const results: Record<number, { status: 'idle' | 'checking' | 'available' | 'taken', helper: string }> = {}
      for (const { i, u } of entries) {
        try {
          const res = await authAPI.checkSession(u)
          results[i] = res.available
            ? { status: 'available', helper: 'Identifiant disponible' }
            : { status: 'taken', helper: 'Identifiant déjà pris' }
        } catch {
          results[i] = { status: 'idle', helper: '' }
        }
      }
      setChildUsernameStatus(prev => ({ ...prev, ...results }))
    }, 400)

    return () => clearTimeout(t)
  }, [JSON.stringify(formData.familyMembers.map((m, i) => (i > 0 ? (m.username || '') : '')))])

/* --------------------------- UI util: Sidebar ----------------------------- */
const SummarySidebar = () => {
  const stepsOrder: Array<typeof step> = ['subscription', 'account', 'family', 'payment', 'success']
  const currentIndex = Math.max(0, stepsOrder.indexOf(step))
  const progress = Math.min(100, (currentIndex / 3) * 100)

  return (
    <div className="xl:col-span-1 flex">
      {/* Carte = flex-col + h-full pour s’étirer comme la gauche */}
      <div className="bg-white/90 backdrop-blur rounded-2xl border border-gray-200 shadow-xl p-6 w-full self-stretch h-full flex flex-col min-h-[700px]">
        {/* Contenu = flex-col pour pouvoir coller le footer en bas */}
        <div className="w-full flex flex-col h-full">
          {/* Stepper (contraste renforcé) */}
          <div className="mb-8">
            <h5 className="text-[11px] font-semibold uppercase tracking-wide text-gray-700 mb-2">
              
            </h5>
            <div className="flex items-center gap-6">
              {(['subscription','account','family','payment'] as const).map((k, idx) => {
                const isDone = idx < currentIndex
                const isCurrent = idx === currentIndex
                return (
                  <div key={k} className="flex items-center gap-6">
                    <div
                      className={[
                        'w-7 h-7 rounded-full grid place-items-center text-[11px] font-bold border',
                        isDone
                          ? 'bg-emerald-500 text-emerald-100 border-emerald-600'
                          : isCurrent
                          ? 'bg-blue-500 text-blue-100 border-blue-600'
                          : 'bg-white-800 text-white-100 border-white-600',
                      ].join(' ')}
                    >
                      {isDone ? '✓' : idx + 1}
                    </div>
                    {idx < 3 && <div className="w-6 h-1 rounded bg-gray-300" />}
                  </div>
                )
              })}
            </div>
            <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Récap (textes plus foncés) */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-gray-900">Récapitulatif</h4>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="space-y-3 text-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Offre</span>
              <span className="font-semibold">{selectedPlan.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Membres</span>
              <span className="font-semibold">
                {formData.familyMembers.length}/{selectedPlan.maxMembers}
              </span>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Sous-total</span>
                <span className="font-semibold">{formatPrice(basePrice)}</span>
              </div>
              {promoDiscountPct > 0 && (
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Promo ({promoDiscountPct}%)</span>
                  <span>-{formatPrice(Number((basePrice - discountedPrice).toFixed(2)))}</span>
                </div>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-700">Total / mois</span>
                <span className="text-xl font-bold text-gray-900">{formatPrice(discountedPrice)}</span>
              </div>
            </div>

            {/* Code promo */}
            <div className="pt-4">
              <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                <Tags className="w-4 h-4 mr-2 text-purple-700" />
                Code promo
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.promoCode}
                  onChange={(e) => handleInputChange('promoCode', e.target.value)}
                  placeholder="CUBE20, BIENVENUE10..."
                  className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-gray-900 placeholder:text-gray-500"
                />
                <button
                  onClick={applyPromo}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition"
                >
                  Appliquer
                </button>
              </div>
              {promoStatus === 'applied' && (
                <p className="text-emerald-700 text-sm mt-2">Réduction appliquée ✅</p>
              )}
              {promoStatus === 'invalid' && (
                <p className="text-rose-600 text-sm mt-2">Code promo invalide ❌</p>
              )}
            </div>

            {/* --- SPACER pour pousser le footer tout en bas --- */}
            <div className="flex-1" />
          </div>

          {/* FOOTER collé en bas + contraste renforcé */}
          <div className="mt-auto pt-6">
            <p className="text-[12px] leading-relaxed text-gray-700 flex items-start">
              <Info className="w-4 h-4 mr-2 mt-0.5 text-gray-700" />
              <span>
                Paiements sécurisés & 3D Secure via notre prestataire
                (carte requise même pour Starter pour l’empreinte).
              </span>
            </p>
            <p className="text-[12px] leading-relaxed text-gray-700 mt-2 text-center">
              Sans engagement — résiliable en 1 clic. Vos progrès et profils sont conservés.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
  /* --------------------------------- Render -------------------------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/20 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6">
          <div className="flex justify-between items-center h-14 lg:h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="font-title text-white text-2xl">C</span>
              </div>
              <CubeAILogo className="text-3xl lg:text-4xl" />
            </div>
            <div className="flex items-center space-x-3 lg:space-x-4">
              {navUser ? (
                <>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/70 border border-green-200 text-sm font-medium text-green-700">
                    <span className="font-mono text-xs text-green-800">{navUser.sessionId}</span>
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                  </div>
                  <a href="/dashboard" className="font-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-5 py-2 rounded-lg text-sm font-medium">Espace personnel</a>
                  <button
                    onClick={async () => { try { await authAPI.logout(); localStorage.setItem('cubeai:auth', 'logged_out:' + Date.now()); setNavUser(null); router.push('/login'); } catch {} }}
                    title="Se déconnecter"
                    aria-label="Se déconnecter"
                    className="px-2 py-2 rounded-lg text-xl transition transform hover:rotate-12 hover:scale-110"
                  >
                    🚪
                  </button>
                </>
              ) : (
                <>
                  <Link href="/" className="font-body text-gray-600 hover:text-gray-900 px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100 !text-gray-600 hover:!text-gray-900">
                    Accueil
                  </Link>
                  <Link href="/login" className="font-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-5 lg:px-6 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                    Se connecter
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          {/* ------------------------- SUBSCRIPTION STEP ------------------------ */}
          {step === 'subscription' && (
            <motion.div
              key="subscription"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="min-h-[calc(100vh-4.5rem)] py-10 lg:py-12 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"
            >
              <div className="w-full px-4 sm:px-6 lg:px-6">
                <div className="text-center mb-10 lg:mb-12">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-6"
                  >
                    <h1 className="text-4xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text !text-gray-700 mb-3">
                      Choisissez votre plan
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                      Sélectionnez l’offre qui vous convient et lancez l’aventure CubeAI dès aujourd’hui.
                    </p>
                  </motion.div>
                  

                </div>

                {/* Affichage des erreurs */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-xl"
                  >
                    <p className="text-red-600 text-sm">{error}</p>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch max-w-7xl mx-auto">
                  {subscriptionPlans.map((plan, index) => {
                    const IconComponent = plan.icon
                    const isSelected = formData.subscriptionType === plan.id
                    return (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.07 }}
                        className={`relative rounded-3xl p-6 lg:p-7 border-2 flex flex-col h-full cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 ${
                          isSelected
                            ? `${plan.selected.container} ${plan.selected.glow} text-white -translate-y-1 ring-4 ${plan.selected.ring} ring-offset-0`
                            : 'border-gray-200 hover:border-gray-300 bg-white shadow-xl hover:shadow-2xl'
                        } ${plan.cardClass}`}
                        onClick={() => handleInputChange('subscriptionType', plan.id)}
                      >
                        {plan.popular && (
                          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 lg:px-4 py-1 rounded-full text-xs lg:text-sm font-semibold shadow-md">
                              Recommandé
                            </div>
                          </div>
                        )}

                        <div className="text-center mb-6">
                          <div className={`w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-r ${plan.color} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                            <IconComponent className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
                          </div>

                          <h3 className={`text-xl lg:text-2xl font-bold mb-2 ${isSelected ? 'text-white' : 'text-gray-100'}`}>
                            {plan.name}
                          </h3>

                          <div className="mb-2">
                            <span className={`text-3xl lg:text-4xl font-bold ${isSelected ? 'text-white' : 'text-gray-100'}`}>
                              {plan.price}
                            </span>
                            <span className={`text-base lg:text-lg ml-2 ${isSelected ? 'text-white/80' : 'text-gray-100'}`}>
                              {plan.period}
                            </span>
                          </div>

                          <p className={`${isSelected ? 'text-white/90' : 'text-gray-100'} mb-3 lg:mb-4 text-base lg:text-lg`}>
                            {plan.description}
                          </p>

                          {/* pill sessions — transparent si non sélectionné */}
                          <div className={`${isSelected ? 'bg-white/15 ring-1 ring-white/20' : 'bg-transparent'} rounded-xl p-2.5 lg:p-3`}>
                            <p className={`font-semibold text-sm lg:text-base ${isSelected ? 'text-white drop-shadow-sm' : 'text-gray-100'}`}>
                              {plan.maxMembers === 2 ? '2 sessions' : plan.maxMembers === 6 ? '6 sessions' : '1 session'} • {plan.maxMembers === 2 ? '1 parent + 1 enfant' : plan.maxMembers === 6 ? '1 parent + 5 enfants' : '1 parent'}
                            </p>
                          </div>
                        </div>

                        <ul className="space-y-3 lg:space-y-4 mb-6 lg:mb-8 flex-grow">
                          {plan.features.map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-start space-x-3">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected ? 'bg-white/20' : 'bg-green-100'}`}>
                                <Check className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-green-600'}`} />
                              </div>
                              <span className={`${isSelected ? 'text-white' : 'text-gray-100'} text-sm lg:text-base`}>
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {/* Bouton visible uniquement quand sélectionné */}
                        <div className="mt-auto">
                          {isSelected && (
                          <button
                            onClick={() => handleInputChange('subscriptionType', plan.id)}
                              className={`w-full font-semibold px-5 lg:px-6 py-3.5 lg:py-4 rounded-2xl transition-all duration-300 border-2 bg-gradient-to-r ${plan.color} text-white ${plan.selected.buttonBorder} shadow-xl ring-2 ${plan.selected.ring}`}
                            >
                              ✓ Sélectionné
                          </button>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                <div className="mt-10 lg:mt-12">
                  <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 max-w-4xl mx-auto">
                    {/* Champ Email à gauche */}
                    <div className="lg:w-1/2">
                      <label className="block text-sm font-semibold text-gray-100 mb-3 text-left">
                        
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-100 w-5 h-5" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full pl-12 pr-4 py-4 border-b-2 border-gray-300 focus:border-b-blue-500 transition-all bg-transparent"
                          placeholder="Email de contact  *"
                        />
                        {emailStatus !== 'idle' && (
                          <div className="mt-2">
                            <p className={
                              emailStatus === 'available' ? 'text-emerald-600 text-sm' :
                              emailStatus === 'checking' ? 'text-gray-600 text-sm' :
                              'text-red-600 text-sm'
                            }>
                              {emailHelper}
                            </p>
                            {emailStatus === 'taken' && (
                              <div className="mt-2">
                                <button
                                  type="button"
                                  onClick={() => router.push('/login')}
                                  className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                                >
                                  Se connecter →
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bouton Continuer à droite */}
                    <div className="lg:w-1/2 text-center">
                  <motion.button
                    onClick={handleNext}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 lg:px-16 py-3.5 lg:py-4 rounded-2xl text-lg lg:text-xl font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl"
                  >
                    Continuer
                  </motion.button>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-600 text-center">
                    3 mois offerts sur Starter. Mettez à niveau quand vous voulez — vos progrès sont conservés.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* --------------------------- ACCOUNT STEP (bleu) -------------------- */}
          {step === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-[calc(100vh-4.5rem)] py-10 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"
            >
              <div className="w-full px-4 sm:px-6 lg:px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-stretch">
                  {/* Col gauche (2/3) */}
                  <div className="xl:col-span-2">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 backdrop-blur rounded-3xl shadow-xl p-8 lg:p-10 min-h-[700px] h-full flex flex-col">
                      <div className="text-center mb-8">
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Créez votre espace famille</h1>
                        <p className="text-lg text-gray-600">Enregistrez vos informations en tant que propriétaire du compte</p>
                    </div>

                      <div className="space-y-8">
                        {/* Prénom et Nom côte à côte */}
                        <div>
                          <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                            <User className="w-5 h-5 lg:w-6 lg:h-6 mr-3 text-blue-600" />
                          Informations personnelles
                        </h3>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2"></label>
                          <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                              type="text"
                              value={formData.firstName}
                              onChange={(e) => handleInputChange('firstName', e.target.value)}
                                  className="w-full pl-12 pr-4 py-4 border-b-2 border-gray-300 focus:border-b-blue-500 transition-all bg-transparent"
                                  placeholder="Prénom *"
                            />
                          </div>
                        </div>

                        <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2"></label>
                          <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                              type="text"
                              value={formData.lastName}
                              onChange={(e) => handleInputChange('lastName', e.target.value)}
                                  className="w-full pl-12 pr-4 py-4 border-b-2 border-gray-300 focus:border-b-blue-500 transition-all bg-transparent"
                                  placeholder="Nom *"
                            />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Date de naissance et Type */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              <span className="text-gray-400"></span>
                          </label>
                            <input
                              type="text"
                              value={formData.familyMembers[0].dateOfBirth}
                              onChange={(e) => handleDateInput(0, e.target.value)}
                              className="w-full px-4 py-4 border-b-2 border-gray-300 focus:border-b-blue-500 transition-all bg-transparent"
                              placeholder="Date de naissance jj/mm/aaaa *"
                              maxLength={10}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2"></label>
                            <select
                              value={formData.familyMembers[0].gender}
                              onChange={(e) => handleFamilyMemberChange(0, 'gender', e.target.value)}
                              className="w-full px-4 py-4 border-b-2 border-gray-300 focus:border-b-blue-500 transition-all bg-transparent"
                            >
                              
                              <option value="MALE">M.</option>
                              <option value="FEMALE">Mme</option>
                            </select>
                        </div>
                      </div>

                        {/* Mots de passe */}
                        <div>
                          <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                            <Lock className="w-5 h-5 lg:w-6 lg:h-6 mr-3 text-blue-600" />
                          Sécurité
                        </h3>
                        
                          {/* Identifiant parent */}
                        <div className="mb-8">
                          <label className="block text-sm font-semibold text-gray-700 mb-2"></label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={formData.familyMembers[0].username || ''}
                              onChange={(e) =>
                                setFormData(prev => {
                                  const fm = [...prev.familyMembers]
                                  fm[0] = { ...fm[0], username: e.target.value }
                                  return { ...prev, familyMembers: fm }
                                })
                              }
                              className="w-full px-4 py-4 border-b-2 border-gray-300 focus:border-b-blue-500 transition-all bg-transparent"
                              placeholder="Identifiant de connexion ex: Patrick-007 *"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const suggestion = (formData.firstName || 'parent') + '-' + String(Math.floor(Math.random() * 900) + 100)
                                setFormData(prev => {
                                  const fm = [...prev.familyMembers]
                                  fm[0] = { ...fm[0], username: suggestion }
                                  return { ...prev, familyMembers: fm }
                                })
                              }}
                              className="px-4 py-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 text-sm !font-semibold"
                            >
                              Générer
                            </button>
                          </div>
                          {usernameStatus !== 'idle' && (
                            <p className={
                              usernameStatus === 'available' ? 'text-emerald-600 text-sm mt-2' :
                              usernameStatus === 'checking' ? 'text-gray-600 text-sm mt-2' :
                              'text-red-600 text-sm mt-2'
                            }>
                              {usernameHelper}
                            </p>
                          )}
                        </div>
                        

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2"></label>
                          <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                  type={showPassword ? 'text' : 'password'}
                              value={formData.password}
                              onChange={(e) => handleInputChange('password', e.target.value)}
                                  className="w-full pl-12 pr-12 py-4 border-b-2 border-gray-300 focus:border-b-blue-500 transition-all bg-transparent"
                                  placeholder="Mot de passe *"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2"></label>
                          <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                  type={showConfirmPassword ? 'text' : 'password'}
                              value={formData.confirmPassword}
                              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                  className="w-full pl-12 pr-12 py-4 border-b-2 border-gray-300 focus:border-b-blue-500 transition-all bg-transparent"
                                  placeholder="Confirmer le mot de passe *"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                              </div>
                            </div>
                          </div>
                          </div>
                        </div>

                      {/* Coaching IA */}
                      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                            <Edit3 className="w-5 h-5 mr-3 text-blue-600" />
                            Coaching IA (optionnel)
                          </h3>
                          <p className="text-sm text-gray-600 mt-2">Aidez-nous à personnaliser les parcours selon vos objectifs et préférences.</p>
                        </div>
                        <div className="lg:col-span-2 space-y-4">
                          <textarea
                            value={formData.parentPrompts?.objectives || ''}
                            onChange={(e) => handleInputChange('parentPrompts', { ...formData.parentPrompts, objectives: e.target.value })}
                            placeholder="Objectifs (ex. découvrir la programmation, renforcer les maths)"
                            className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-b-blue-500 transition-all bg-transparent h-32 resize-none"
                          />
                      </div>
                    </div>

                    {error && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-red-600 text-sm">{error}</p>
                      </motion.div>
                    )}

                      {/* Barre d’action */}
                      <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <button onClick={handleBack} className="flex items-center space-x-3 text-gray-600 hover:text-gray-900 px-6 py-3 rounded-xl !font-semibold transition-all hover:bg-gray-100">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Retour</span>
                        </button>

                        <div className="flex items-center justify-between w-full">
                          {/* Texte aligné à gauche */}
                          <label className="flex items-center flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={formData.acceptTerms}
                              onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2 shrink-0"
                            />
                            <span className="text-sm text-gray-700 leading-snug">
                              J’accepte les{" "}
                              <a className="text-blue-600 underline">conditions d’utilisation</a> et la{" "}
                              <a className="text-blue-600 underline">politique de confidentialité</a>
                            </span>
                          </label>

                          {/* Bouton à droite */}
                      <motion.button
                        onClick={handleNext}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            disabled={!formData.acceptTerms}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3.5 rounded-xl !font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-60 shrink-0"
                          >
                            <span className="!text-white !font-semibold">Continuer</span>
                      </motion.button>
                        </div>
                    </div>
                  </motion.div>
                  </div>

                  {/* Sidebar */}
                  <SummarySidebar />
                </div>
              </div>
            </motion.div>
          )}

          {/* ---------------------------- FAMILY STEP (violet) ------------------ */}
          {step === 'family' && (
            <motion.div
              key="family"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-[calc(100vh-4.5rem)] py-10 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"
            >
              <div className="w-full px-4 sm:px-6 lg:px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-stretch">
                  {/* Col gauche (2/3) */}
                  <div className="xl:col-span-2">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 backdrop-blur rounded-3xl shadow-xl p-8 lg:p-10 min-h-[700px] h-full flex flex-col">
                      <div className="text-center mb-8">
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Membres de la famille</h1>
                        <p className="text-lg text-gray-600">
                          Plan {selectedPlan.name} : {formData.familyMembers.length}/{selectedPlan.maxMembers} membre(s)
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Vous pourrez ajouter des membres plus tard depuis votre espace Famille.</p>
                    </div>

                    <div className="space-y-8">
                        {formData.familyMembers.map((member, index) => {
                          if (index === 0) return null
                          return (
                            <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }} className="rounded-2xl p-8 bg-white/90 backdrop-blur shadow-md">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-semibold text-gray-900 flex items-center">
                                  <Users className="w-6 h-6 mr-3 text-purple-600" />
                                  {`Membre ${index}`}
                            </h3>
                                <button onClick={() => removeFamilyMember(index)} className="text-rose-600 hover:text-rose-800 p-3 rounded-xl hover:bg-rose-50 transition-all">
                                <X className="w-6 h-6" />
                                </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-3"></label>
                              <input
                                type="text"
                                value={member.firstName}
                                onChange={(e) => handleFamilyMemberChange(index, 'firstName', e.target.value)}
                                    className="w-full px-4 py-4 border-b-2 border-gray-300 focus:border-b-purple-500 transition-all bg-transparent"
                                    placeholder="Prénom *"
                              />
                            </div>

                            <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-3"></label>
                              <input
                                type="text"
                                value={member.lastName}
                                onChange={(e) => handleFamilyMemberChange(index, 'lastName', e.target.value)}
                                    className="w-full px-4 py-4 border-b-2 border-gray-300 focus:border-b-purple-500 transition-all bg-transparent"
                                    placeholder="Nom *"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    <span className="text-gray-400"></span>
                              </label>
                              <input
                                    type="text"
                                value={member.dateOfBirth}
                                    onChange={(e) => handleDateInput(index, e.target.value)}
                                    className="w-full px-4 py-4 border-b-2 border-gray-300 focus:border-b-purple-500 transition-all bg-transparent"
                                    placeholder="Date de naissance jj/mm/aaaa *"
                                    maxLength={10}
                              />
                            </div>

                            <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-3"></label>
                              <select
                                value={member.gender}
                                onChange={(e) => handleFamilyMemberChange(index, 'gender', e.target.value)}
                                    className="w-full px-4 py-4 border-b-2 border-gray-300 focus:border-b-purple-500 transition-all bg-transparent"
                              >
                                    <option value="MALE">Garçon</option>
                                    <option value="FEMALE">Fille</option>
                              </select>
                            </div>

                              <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-3"></label>
                                  <div className="flex gap-2">
                                <input
                                  type="text"
                                      value={member.username || ''}
                                      onChange={(e) => handleFamilyMemberChange(index, 'username', e.target.value)}
                                      className="w-full px-4 py-4 border-b-2 border-gray-300 focus:border-b-purple-500 transition-all bg-transparent"
                                      placeholder="ID de session ex: lea3 *"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const taken = new Set(formData.familyMembers.map(m => m.username || '').filter(Boolean))
                                        const suggestion = generateUsername(member.firstName || 'enfant', taken)
                                        handleFamilyMemberChange(index, 'username', suggestion)
                                      }}
                                      className="px-4 py-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 text-sm !font-semibold"
                                    >
                                      Générer
                                    </button>
                              </div>
                                  {childUsernameStatus[index] && (
                                    <p className={
                                      childUsernameStatus[index].status === 'available' ? 'text-emerald-600 text-sm mt-2' :
                                      childUsernameStatus[index].status === 'checking' ? 'text-gray-600 text-sm mt-2' :
                                      'text-red-600 text-sm mt-2'
                                    }>
                                      {childUsernameStatus[index].helper}
                                    </p>
                                  )}
                                </div>

                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-3"></label>
                                  <div className="flex gap-2">
                                    <div className="relative w-full">
                                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                      <input
                                      type={showChildPassword[index] ? 'text' : 'password'}
                                      value={member.sessionPassword || ''}
                                      onChange={(e) => handleFamilyMemberChange(index, 'sessionPassword', e.target.value)}
                                      className="w-full pl-12 pr-12 py-4 border-b-2 border-gray-300 focus:border-b-purple-500 transition-all bg-transparent"
                                      placeholder="Mot de passe de session *"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setShowChildPassword(prev => ({ ...prev, [index]: !prev[index] }))}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                      >
                                        {showChildPassword[index] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleFamilyMemberChange(index, 'sessionPassword', generatePassword())}
                                      className="px-4 py-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 text-sm !font-semibold"
                                    >
                                      Générer
                                    </button>
                                  </div>
                                </div>
                          </div>
                        </motion.div>
                          )
                        })}

                      {selectedPlan && formData.familyMembers.length < selectedPlan.maxMembers && (
                        <motion.button
                          onClick={addFamilyMember}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                            className="w-full py-8 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-all flex items-center justify-center space-x-3 text-lg !font-semibold"
                        >
                          <Plus className="w-6 h-6" />
                          <span>Ajouter un membre</span>
                        </motion.button>
                      )}
                    </div>

                    {error && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-red-600 text-sm">{error}</p>
                      </motion.div>
                    )}

                      <div className="mt-8 flex justify-between items-center">
                        <button onClick={handleBack} className="flex items-center space-x-3 text-gray-600 hover:text-gray-900 px-6 py-3 rounded-xl !font-semibold transition-all hover:bg-gray-100">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Retour</span>
                        </button>
                      
                      <motion.button
                          onClick={handleNext}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3.5 rounded-xl !font-semibold transition-all shadow-lg hover:shadow-xl"
                        >
                          <span className="!text-white !font-semibold">Continuer</span>
                          <ArrowRight className="w-5 h-5 ml-2 inline" />
                      </motion.button>
                    </div>
                  </motion.div>
                  </div>

                  {/* Sidebar */}
                  <SummarySidebar />
                </div>
              </div>
            </motion.div>
          )}

          {/* --------------------------- PAYMENT STEP --------------------------- */}
          {step === 'payment' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-[calc(100vh-4.5rem)] py-10 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"
            >
              <div className="w-full px-4 sm:px-6 lg:px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-stretch">
                  {/* Col gauche (2/3) */}
                  <div className="xl:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                      className="bg-white/80 backdrop-blur rounded-3xl shadow-xl p-8 lg:p-10 min-h-[700px] flex flex-col h-full"
                    >
                      <div className="text-center mb-8">
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Paiement & vérification</h1>
                        <p className="text-lg text-gray-600">
                          Entrez vos informations de paiement sécurisées.
                        </p>
                      </div>

                      <div className="space-y-6 flex-grow">
                        {/* Carte “Informations de paiement” — style épuré */}
                        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                          <div className="flex items-center mb-5">
                            <span className="font-semibold text-gray-900"></span>
                          </div>

                          {/* Sélecteur de méthode — logos alignés sur une ligne */}
                          <div className="flex gap-8 mb-6">
                            {([
                              { id: 'card', label: '', logo: '/payments/visa-mastercard.png' },
                              { id: 'applepay', label: ' ', logo: '/payments/applepay.png' },
                              { id: 'sepa', label: '', logo: '/payments/sepa.png' },
                              { id: 'paypal', label: '', logo: '/payments/paypal.png' }
                            ] as const).map(m => {
                              const active = formData.selectedPaymentMethod === m.id
                      return (
                                <button
                                  key={m.id}
                                  onClick={() => handleInputChange('selectedPaymentMethod', m.id)}
                                  className={`flex items-center justify-center gap-2 py-4 px-6 rounded-xl transition
                                    ${active ? 'bg-blue-50 border-2 border-blue-500 shadow-md' : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'}`}
                                  aria-pressed={active}
                                >
                                  <Image src={m.logo} alt="" width={80} height={80} className="h-15 w-auto" />
                                </button>
                              )
                            })}
                          </div>

                          {/* Champs conditionnels — layout optimisé */}
                          {formData.selectedPaymentMethod === 'card' && (
                            <div className="space-y-4">
                              {/* Titulaire et Numéro sur la même ligne */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2"></label>
                                  <input
                                    type="text"
                                    value={formData.payCard?.name || ''}
                                    onChange={(e) => handleInputChange('payCard', { ...(formData.payCard || {}), name: e.target.value })}
                                    className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-b-blue-500 transition-all bg-transparent"
                                    placeholder="Titulaire *"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2"></label>
                                  <input
                                    inputMode="numeric"
                                    placeholder="Numéro de carte *"
                                    value={formData.payCard?.number || ''}
                                    onChange={(e) =>
                                      handleInputChange('payCard', {
                                        ...(formData.payCard || {}),
                                        number: e.target.value.replace(/[^\d]/g, '')
                                      })
                                    }
                                    className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-b-blue-500 transition-all bg-transparent"
                                  />
                                </div>
                              </div>
                              
                              {/* Date d'expiration et CVC sur la même ligne */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2"></label>
                                  <input
                                    inputMode="numeric"
                                    maxLength={5}
                                    placeholder="Date d'expiration *"
                                    value={formData.payCard?.expMonth && formData.payCard?.expYear ? `${formData.payCard.expMonth}/${formData.payCard.expYear}` : ''}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/[^\d]/g, '');
                                      if (value.length <= 4) {
                                        const month = value.substring(0, 2);
                                        const year = value.substring(2, 4);
                                        handleInputChange('payCard', { 
                                          ...(formData.payCard || {}), 
                                          expMonth: month,
                                          expYear: year
                                        });
                                      }
                                    }}
                                    className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-b-blue-500 transition-all bg-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2"></label>
                                  <input
                                    inputMode="numeric"
                                    maxLength={4}
                                    value={formData.payCard?.cvc || ''}
                                    onChange={(e) =>
                                      handleInputChange('payCard', { ...(formData.payCard || {}), cvc: e.target.value.replace(/[^\d]/g, '') })
                                    }
                                    className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-b-blue-500 transition-all bg-transparent"
                                    placeholder="CVC *"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {formData.selectedPaymentMethod === 'sepa' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Titulaire *</label>
                                <input
                                  type="text"
                                  value={formData.paySEPA?.name || ''}
                                  onChange={(e) => handleInputChange('paySEPA', { ...(formData.paySEPA || {}), name: e.target.value })}
                                  className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-b-blue-500 transition-all bg-transparent"
                                  placeholder="Nom du titulaire"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">IBAN *</label>
                                <input
                                  type="text"
                                  value={formData.paySEPA?.iban || ''}
                                  onChange={(e) => handleInputChange('paySEPA', { ...(formData.paySEPA || {}), iban: e.target.value.toUpperCase() })}
                                  className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-b-blue-500 transition-all bg-transparent"
                                  placeholder="FR76 3000 6000 0112 3456 7890 189"
                                />
                              </div>
                            </div>
                          )}

                          {formData.selectedPaymentMethod === 'paypal' && (
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email PayPal *</label>
                                <input
                                  type="email"
                                  value={formData.payPaypal?.email || ''}
                                  onChange={(e) => handleInputChange('payPaypal', { ...(formData.payPaypal || {}), email: e.target.value })}
                                  className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-b-blue-500 transition-all bg-transparent"
                                  placeholder="votre-email@paypal.com"
                                />
                              </div>
                            </div>
                          )}

                          {formData.selectedPaymentMethod === 'applepay' && (
                            <div className="rounded-xl bg-gray-50 border border-dashed border-gray-300 p-6 text-sm text-gray-600">
                              Apple Pay sera présenté par votre navigateur / appareil compatible au moment de la validation.
                            </div>
                          )}
                          </div>

                        {/* Vérification */}
                        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                          <div className="flex items-center mb-4">
                            <CircleCheck className="w-5 h-5 mr-2 text-emerald-600" />
                            <span className="font-semibold text-gray-900">Vérification des informations</span>
                        </div>
                          <ul className="space-y-3 text-sm text-gray-700">
                            <li>• Compte parent : <strong>{formData.firstName} {formData.lastName}</strong> — {formData.email}</li>
                            <li>• ID parent : <strong>{formData.familyMembers[0].username || '—'}</strong></li>
                            <li>• Plan : <strong>{selectedPlan.name}</strong> — {formatPrice(discountedPrice)}/mois</li>
                            <li>• Membres enfants : {Math.max(0, formData.familyMembers.length - 1)}/{selectedPlan.maxMembers - 1}</li>
                            <li>• Code promo : {formData.promoCode ? <span className="text-emerald-700 font-semibold">{formData.promoCode}</span> : '—'}</li>
                          </ul>

                          <div className="flex gap-3 mt-4">
                            <button onClick={() => setStep('account')} className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm !font-semibold">
                              Modifier compte
                            </button>
                            <button onClick={() => setStep('family')} className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm !font-semibold">
                              Modifier membres
                            </button>
                          </div>
                        </div>
                      </div>

                      {error && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-4 bg-red-50 border border-red-200 rounded-xl">
                          <p className="text-red-600 text-sm">{error}</p>
                  </motion.div>
                      )}

                      <div className="mt-8 flex justify-between items-center">
                        <button
                          onClick={handleBack}
                          className="flex items-center space-x-3 text-gray-600 hover:text-gray-900 px-6 py-3 rounded-xl !font-semibold transition-all hover:bg-gray-100"
                        >
                          <ArrowLeft className="w-5 h-5" />
                          <span>Retour</span>
                        </button>
                  
                  <motion.button
                          onClick={handleSubmit}
                          whileHover={{ scale: loading ? 1 : 1.03 }}
                          whileTap={{ scale: loading ? 1 : 0.97 }}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-12 py-4 rounded-xl !font-semibold transition-all shadow-lg hover:shadow-xl"
                        >
                          <span className="!text-white !font-semibold">
                            {loading ? 'Validation…' : 'Valider et activer mon plan'}
                          </span>
                  </motion.button>
                      </div>
                    </motion.div>
                  </div>

                  {/* Sidebar */}
                  <SummarySidebar />
                </div>
              </div>
            </motion.div>
          )}

          {/* ----------------------------- SUCCESS ------------------------------ */}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="min-h-screen py-12 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
              <div className="w-full px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-12 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }} className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Check className="w-10 h-10 text-white" />
                  </motion.div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-6">Bienvenue chez CubeAI !</h1>
                  <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                    Votre compte a été créé. Nous vous avons envoyé un email de confirmation et un mail de bienvenue avec les identifiants de connexion pour chaque session.
                  </p>
                  <motion.button onClick={handleGoToLogin} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 rounded-xl !font-semibold transition-all shadow-lg hover:shadow-xl">
                    <span className="!text-white !font-semibold">Aller à la connexion</span>
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
