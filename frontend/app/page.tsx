'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Monitor } from 'lucide-react'
import { MulticolorText, CubeAILogo, AnimatedMulticolorText } from '@/components/MulticolorText'
import AnimatedIcon from '@/components/AnimatedIcons'
import { authAPI } from '@/lib/api'
import DecorativeCubes from '@/components/DecorativeCubes';
import { useTheme } from '@/contexts/ThemeContext'
import PublicBubix from '@/components/PublicBubix'
import FloatingBubixButton from '@/components/FloatingBubixButton'

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const { theme, setTheme } = useTheme()
  const [showBubix, setShowBubix] = useState(false)
  useEffect(() => {
    let mounted = true
    authAPI.verify().then(res => {
      if (mounted && res?.success) setUser(res.user)
    }).catch(() => {})
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cubeai:auth') {
        authAPI.verify().then(res => {
          if (mounted) setUser(res?.success ? res.user : null)
        }).catch(() => { if (mounted) setUser(null) })
      }
    }
    window.addEventListener('storage', onStorage)
    return () => { mounted = false; window.removeEventListener('storage', onStorage) }
  }, [])
  const plans = [
    {
      name: 'Découverte',
      price: '4,99€',
      period: '/mois',
      description: 'Le premier pas vers l\'aventure',
      features: [
        '1 parent + 1 enfant',
        'Bubix (version simplifiée)',
        'MathCube pour découvrir les bases',
        'Expériences (lite) : mini-dashboard',
        '1 analyse simple par semaine',
        'Radar de connaissance : petit cerveau',
        'Support : Email uniquement',
        'IA : GPT-3.5-turbo limité'
      ],
      popular: false,
      starter: true,
      cta: 'Commencer l\'aventure',
      href: '/register',
      cardClass: 'card-decouverte'
    },
    {
      name: 'Explorateur',
      price: '29,99€',
      period: '/mois',
      description: 'L\'univers complet CubeAI',
      features: [
        '1 parent + 2 enfants',
        'Bubix (avancé, personnalisable)',
        'Tous les onglets enfants',
        'Dashboard parental complet + ComCube',
        'Analyses hebdomadaires + export',
        'Radar de connaissance complet',
        'Certificats simples',
        'Support : Email, chat et téléphone',
        'IA : GPT-4o-mini custom'
      ],
      popular: true,
      cta: 'Explorer l\'univers',
      href: '/register',
      cardClass: 'card-explorateur'
    },
    {
      name: 'Maître',
      price: '59,99€',
      period: '/mois',
      description: 'L\'excellence éducative pour les familles ambitieuses',
      features: [
        '1 parent + 4 enfants',
        'Bubix premium (le plus avancé)',
        'Analyses prédictives quotidiennes',
        'Radar de connaissance évolutif',
        'Contenus exclusifs',
        'Diplômes officiels',
        'Dashboard parental enrichi',
        'Support VIP prioritaire',
        'IA : GPT-4o premium adaptatif'
      ],
      popular: false,
      complete: true,
      cta: 'Devenir maître',
      href: '/register',
      cardClass: 'card-maitre'
    }
  ]

  return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <DecorativeCubes variant="minimal" />
      {/* Navigation */}
      <nav className="bg-white/20 dark:bg-gray-900/20 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
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

              {user ? (
                <>
                  <div className="hidden md:flex items-center gap-2 text-sm font-medium">
                    <div className="flex items-center">
                      <span className="font-title text-xl font-bold multicolor-id">
                        {user.sessionId.split('').map((char: string, index: number) => (
                          <span
                            key={index}
                            className="inline-block"
                            style={{
                              color: [
                                '#3B82F6', // sky blue
                                '#8B5CF6', // soft violet
                                '#EC4899', // raspberry pink
                                '#10B981', // mint green
                                '#F59E0B'  // peach orange
                              ][index % 5]
                            }}
                          >
                            {char}
                          </span>
                        ))}
                      </span>
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500 ml-2"></span>
                    </div>
                  </div>
                  <a href="/dashboard" className="font-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 md:px-5 py-2 rounded-lg text-xs md:text-sm font-medium">Espace personnel</a>

                  <button
                    onClick={async () => { try { await authAPI.logout(); localStorage.setItem('cubeai:auth', 'logged_out:' + Date.now()); router.push('/login'); } catch {} }}
                    title="Se déconnecter"
                    aria-label="Se déconnecter"
                    className="p-2 rounded-lg text-gray-700 hover:text-red-600 transition-all duration-300 hover:bg-red-50 hover:scale-110"
                  >
                    <svg 
                      className="w-5 h-5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                      />
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-2 md:space-x-4">
                    <Link href="/login" className="font-body text-gray-600 hover:text-gray-900 px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors hover:bg-gray-100">
                      Connexion
                    </Link>
                    <Link href="/register" className="font-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 md:px-6 py-2 rounded-lg text-xs md:text-sm font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                      Commencer
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Section principale */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        {/* Images de fond décoratives */}
        
        {/* Bubix à droite avec effet néon */}
        <div className="absolute top-1/2 right-8 transform -translate-y-1/2 z-10">
          <img 
            src="/image-bubix/bubix.png" 
            alt="Bubix" 
            className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 xl:w-64 xl:h-64 drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] drop-shadow-[0_0_40px_rgba(59,130,246,0.6)] drop-shadow-[0_0_60px_rgba(139,92,246,0.4)]"
          />
        </div>

        {/* Cube à gauche avec effet miroir */}
        <div className="absolute top-1/2 left-8 transform -translate-y-1/2 z-10">
          <div className="relative">
            <img 
              src="/image-bg/cube.png" 
              alt="Cube" 
              className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56"
            />
            {/* Effet miroir vers le sol */}
            <img 
              src="/image-bg/cube.png" 
              alt="Cube reflection" 
              className="absolute top-full left-0 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 opacity-30 scale-y-[-1] blur-[1px]"
            />
          </div>
        </div>

        {/* Titre principal - Positionné indépendamment */}
        <div className="absolute top-20 left-0 right-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 xl:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <AnimatedMulticolorText 
                text="Découvrez CubeAI & Bubix" 
                variant="h1" 
                className="leading-none text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[8rem] whitespace-nowrap drop-shadow-xl"
                staggerDelay={0.1}
              />
            </motion.div>
          </div>
        </div>

        {/* Contenu principal - Positionné plus bas */}
        <div className="absolute bottom-50 left-0 right-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 xl:px-8 text-center">
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="font-subtitle-xl text-white mb-6 max-w-3xl mx-auto drop-shadow-lg"
            >
              L'<strong className="text-yellow-300">intelligence artificielle</strong> qui grandit avec vos enfants.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="font-body-lg text-white mb-6 max-w-4xl mx-auto drop-shadow-lg"
            >
              <p className="mb-4">
                Avec CubeAI, chaque enfant découvre un univers magique où l'IA devient un véritable <strong className="text-yellow-300">compagnon d'apprentissage</strong> : <strong className="text-yellow-300">Bubix</strong>.
              </p>
              <ul className="text-left space-y-2 max-w-2xl mx-auto">
                <li className="flex items-center">
                  <span className="text-yellow-300 mr-2">•</span>
                  <strong className="text-yellow-300">Mathématiques</strong> et sciences interactives
                </li>
                <li className="flex items-center">
                  <span className="text-yellow-300 mr-2">•</span>
                  <strong className="text-yellow-300">Programmation</strong> et création de jeux
                </li>
                <li className="flex items-center">
                  <span className="text-yellow-300 mr-2">•</span>
                  <strong className="text-yellow-300">Histoires</strong> et aventures personnalisées
                </li>
              </ul>
            </motion.div>

            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="font-body-lg text-white mb-8 max-w-3xl mx-auto drop-shadow-lg"
            >
              Bubix <strong className="text-yellow-300">grandit avec votre enfant</strong> et crée un <strong className="text-yellow-300">parcours personnalisé</strong> qui évolue jour après jour.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/register" className="font-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 md:px-12 lg:px-16 py-3 md:py-3.5 lg:py-4 rounded-2xl text-base md:text-lg lg:text-xl font-semibold transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 border-2 border-white/20 backdrop-blur-sm">
                Commencer gratuitement
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Pourquoi choisir CubeAI ? */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mb-6"
            >
              <h2 className="text-3xl md:text-4xl font-title bg-gradient-to-r from-green-600 via-purple-400 to-yellow-600 bg-clip-text text-transparent mb-6">
                Pourquoi choisir CubeAI ?
              </h2>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center p-8 bg-white/80 backdrop-blur rounded-3xl shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300"
            >
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Bubix" className="w-8 h-8 filter brightness-0 invert" />
              </div>
              <h3 className="text-xl font-subtitle text-gray-900 dark:text-white mb-4">
                Bubix, votre professeur IA disponible 24h/24
              </h3>
              <p className="text-gray-600 dark:text-gray-300 font-body leading-relaxed">
                Parce que chaque enfant mérite un professeur patient et intelligent, disponible à tout moment.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center p-8 bg-white/80 backdrop-blur rounded-3xl shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300"
            >
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Analytics" className="w-8 h-8 filter brightness-0 invert" />
              </div>
              <h3 className="text-xl font-subtitle text-gray-900 dark:text-white mb-4">
                Suivi des progrès en temps réel
              </h3>
              <p className="text-gray-600 dark:text-gray-300 font-body leading-relaxed">
                Les parents peuvent suivre les progrès de leurs enfants sans stress grâce au dashboard CubeAI.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center p-8 bg-white/80 backdrop-blur rounded-3xl shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300"
            >
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Magic" className="w-8 h-8 filter brightness-0 invert" />
              </div>
              <h3 className="text-xl font-subtitle text-gray-900 dark:text-white mb-4">
                Apprentissage personnalisé et magique
              </h3>
              <p className="text-gray-600 dark:text-gray-300 font-body leading-relaxed">
                Bubix s'adapte au rythme de chaque enfant pour créer un voyage d'apprentissage unique.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-4 font-body">
              <strong>Positionnement :</strong> familles exigeantes / écoles → Bubix devient un mentor adaptatif.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Section des plans */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mb-6"
            >
              
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 via-purple-400 to-yellow-600 bg-clip-text text-transparent mb-6">
              Choisissez votre plan d'abonnement
              </h2>
            </motion.div>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="font-subtitle-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
            >
              Des options flexibles et transparentes pour tous les budgets et toutes les tailles de famille. 
              Commencez gratuitement et évoluez selon vos besoins.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className={`relative rounded-2xl p-6 border-2 flex flex-col h-full ${plan.cardClass}`}
              >
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
                  <h3 className="text-xl font-subtitle text-white mb-3">{plan.name}</h3>
                  <div className="mb-2">
                    <span className={`text-lg font-subtitle text-white ${plan.name === 'Starter' ? 'text-green-100' : ''}`}>
                      {plan.price}
                    </span>
                    <span className="font-body text-white/80">{plan.period}</span>
                  </div>
                  <p className="font-body text-white/90 mb-2">{plan.description}</p>
                  <p className="font-body text-white/80 text-sm italic">
                    {plan.name === 'Maître' ? '5 sessions' : plan.name === 'Explorateur' ? '3 sessions' : '2 sessions'} • {plan.name === 'Maître' ? '1 parent + 4 enfants' : plan.name === 'Explorateur' ? '1 parent + 2 enfants' : '1 parent + 1 enfant'}
                  </p>
                </div>

                <ul className="space-y-3 mb-6 flex-grow">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="font-body text-white/90 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link 
                  href={plan.href}
                  className="block w-full text-center font-button bg-white/20 text-white hover:bg-white/30 px-6 py-3 rounded-xl transition-all border border-white/30 hover:border-white/50 mt-auto"
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section des fonctionnalités */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mb-6"
            >
              <MulticolorText 
                text="Une révolution dans l'éducation numérique" 
                variant="h2" 
                className="text-gray-900"
              />
            </motion.div>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="font-subtitle-xl text-gray-600 mb-12 max-w-3xl mx-auto"
              >
              CubeAI combine les dernières avancées en 
              <strong className="text-green-700"> intelligence artificielle</strong> avec des 
              <strong className="text-green-700"> méthodes pédagogiques éprouvées</strong> 
              pour créer une expérience d'apprentissage unique et personnalisée, adaptée aux besoins spécifiques de chaque enfant.
              </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {[
              {
                icon: (
                  <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                ),
                title: 'Intelligence Artificielle Adaptative',
                description: 'Notre algorithme d\'IA analyse en temps réel les réponses de votre enfant pour ajuster instantanément la difficulté et le style d\'apprentissage. Plus besoin de suivre un programme rigide - l\'éducation s\'adapte à l\'enfant, pas l\'inverse.',
                benefits: ['Adaptation en temps réel', 'Personnalisation poussée', 'Suivi des progrès'],
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                iconBgColor: 'bg-blue-100',
                iconColor: 'text-blue-600'
              },
              {
                icon: (
                  <svg className="w-12 h-12 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ),
                title: 'Contenu Éducatif Premium',
                description: 'Développé par des experts en pédagogie et des enseignants expérimentés, notre contenu couvre tous les domaines essentiels : mathématiques fondamentales, lecture et écriture, sciences naturelles, et développement de la créativité.',
                benefits: ['Experts pédagogiques', 'Programme complet', 'Méthodes éprouvées'],
                bgColor: 'bg-purple-50',
                borderColor: 'border-purple-200',
                iconBgColor: 'bg-purple-100',
                iconColor: 'text-purple-600'
              },
              {
                icon: (
                  <svg className="w-12 h-12 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01 1l-4.7 6.28c-.18.24-.29.54-.29.85V20c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-2h2v2c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-2h2v2z"/>
                  </svg>
                ),
                title: 'Suivi Parental Avancé',
                description: 'Restez connecté à l\'éducation de votre enfant avec des rapports détaillés, des analyses de progression et des recommandations personnalisées. Participez activement à son développement scolaire depuis votre smartphone.',
                benefits: ['Rapports détaillés', 'Recommandations', 'Suivi en temps réel'],
                bgColor: 'bg-pink-50',
                borderColor: 'border-pink-200',
                iconBgColor: 'bg-pink-100',
                iconColor: 'text-pink-600'
              },
              {
                icon: (
                  <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                  </svg>
                ),
                title: 'Sécurité et Confidentialité',
                description: 'La protection des données de votre enfant est notre priorité absolue. Nous utilisons les technologies de cryptage les plus avancées et respectons strictement le RGPD pour garantir un environnement d\'apprentissage 100% sécurisé.',
                benefits: ['Cryptage avancé', 'Conformité RGPD', 'Protection maximale'],
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200',
                iconBgColor: 'bg-green-100',
                iconColor: 'text-green-600'
              },
              {
                icon: (
                  <svg className="w-12 h-12 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.48 2.54l2.6 1.53c.56-1.24.88-2.62.88-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.06.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10 3.31 0 6.24-1.61 8.06-4.09l-2.6-1.53C16.17 17.98 14.21 19 12 19z"/>
                  </svg>
                ),
                title: 'Résultats Mesurables',
                description: 'Voyez les progrès de votre enfant en temps réel avec des métriques précises et des graphiques interactifs. Notre système de suivi vous montre exactement où votre enfant excelle et où il a besoin de soutien supplémentaire.',
                benefits: ['Métriques précises', 'Graphiques interactifs', 'Progrès visibles'],
                bgColor: 'bg-yellow-50',
                borderColor: 'border-yellow-200',
                iconBgColor: 'bg-yellow-100',
                iconColor: 'text-yellow-600'
              },
              {
                icon: (
                  <svg className="w-12 h-12 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                ),
                title: 'Accessibilité Universelle',
                description: 'CubeAI fonctionne sur tous vos appareils : ordinateur, tablette ou smartphone. Votre enfant peut continuer à apprendre partout, que ce soit à la maison, en voyage ou chez les grands-parents.',
                benefits: ['Multi-plateformes', 'Synchronisation', 'Apprentissage mobile'],
                bgColor: 'bg-indigo-50',
                borderColor: 'border-indigo-200',
                iconBgColor: 'bg-indigo-100',
                iconColor: 'text-indigo-600'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className={`${feature.bgColor} ${feature.borderColor} border-2 rounded-2xl p-6 flex flex-col h-full`}
              >
                <div className={`${feature.iconBgColor} w-16 h-16 rounded-xl flex items-center justify-center mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="font-subtitle-lg text-gray-900 mb-3">{feature.title}</h3>
                <p className="font-body text-gray-600 mb-4 flex-grow">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center text-gray-700">
                      <div className={`w-2 h-2 ${feature.iconColor} rounded-full mr-3`} />
                      <span className="font-body text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Étapes d'Inscription */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mb-6"
            >
              <MulticolorText 
                text="Comment ça marche ?" 
                variant="h2" 
                className="text-gray-900"
              />
            </motion.div>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="font-subtitle-lg text-gray-600 max-w-2xl mx-auto"
            >
              En seulement 3 étapes simples, donnez à votre enfant accès à l'éducation du futur
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Créez votre compte',
                description: 'Inscrivez-vous en moins de 2 minutes avec votre email et créez le profil de votre enfant',
                icon: (
                  <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                ),
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                iconBgColor: 'bg-blue-100'
              },
              {
                step: '2',
                title: 'Personnalisez le profil',
                description: 'Définissez l\'âge, le niveau et les préférences d\'apprentissage de votre enfant',
                icon: (
                  <svg className="w-12 h-12 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                ),
                bgColor: 'bg-purple-50',
                borderColor: 'border-purple-200',
                iconBgColor: 'bg-purple-100'
              },
              {
                step: '3',
                title: 'Commencez à apprendre',
                description: 'Votre enfant peut immédiatement commencer ses exercices personnalisés',
                icon: (
                  <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ),
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200',
                iconBgColor: 'bg-green-100'
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className={`${step.bgColor} ${step.borderColor} border-2 rounded-2xl p-8 text-center relative`}
              >
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center font-title text-xl font-bold">
                  {step.step}
                </div>
                
                <div className={`${step.iconBgColor} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 mt-4`}>
                  {step.icon}
                </div>
                
                <h3 className="font-subtitle-lg text-gray-900 mb-4">{step.title}</h3>
                <p className="font-body text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link href="/register" className="font-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl text-lg font-medium">
              Commencer maintenant
            </Link>
          </motion.div>
        </div>
      </section>
      
      {/* Section Témoignages */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mb-6"
            >
              <MulticolorText 
                text="Ce que disent les parents" 
                variant="h2" 
                className="text-gray-900"
              />
            </motion.div>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="font-subtitle-lg text-gray-600 max-w-2xl mx-auto"
            >
              Découvrez les retours d'expérience de familles qui utilisent CubeAI
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {[
              {
                name: 'Marie D.',
                role: 'Maman de Lucas, 6 ans',
                content: 'CubeAI a transformé l\'apprentissage de mon fils. Il adore les exercices et je vois ses progrès en temps réel !',
                rating: 5,
                avatar: '👩‍👦',
                bgColor: 'from-blue-100 to-blue-200',
                borderColor: 'border-blue-300',
                shadowColor: 'shadow-blue-200'
              },
              {
                name: 'Thomas L.',
                role: 'Papa de Emma, 5 ans',
                content: 'L\'IA s\'adapte parfaitement au niveau de ma fille. Elle progresse à son rythme et reste motivée.',
                rating: 5,
                avatar: '👨‍👧',
                bgColor: 'from-purple-100 to-purple-200',
                borderColor: 'border-purple-300',
                shadowColor: 'shadow-purple-200'
              },
              {
                name: 'Sophie M.',
                role: 'Maman de Noah, 7 ans',
                content: 'Interface intuitive, contenu de qualité et suivi parental excellent. Je recommande vivement !',
                rating: 5,
                avatar: '👩‍👦',
                bgColor: 'from-pink-100 to-pink-200',
                borderColor: 'border-pink-300',
                shadowColor: 'shadow-pink-200'
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className={`bg-gradient-to-br ${testimonial.bgColor} ${testimonial.borderColor} border-2 rounded-2xl p-6 flex flex-col h-full`}
              >
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">{testimonial.avatar}</div>
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="font-subtitle text-gray-900 font-semibold">{testimonial.name}</p>
                    <p className="font-body text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <div className="relative">
                  <svg className="absolute -top-3 -left-3 w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                  </svg>
                  <p className="font-body text-gray-700 mb-4 italic pl-6 flex-grow">"{testimonial.content}"</p>
                </div>
                
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Rejoindre la Communauté */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mb-6"
            >
              <MulticolorText 
                text="Rejoignez la communauté CubeAI" 
                variant="h2" 
                className="text-gray-900"
              />
            </motion.div>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="font-subtitle-lg text-gray-600 max-w-2xl mx-auto"
            >
              Connectez-vous avec d'autres parents, partagez vos expériences et restez informés des dernières nouveautés
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                platform: 'Facebook',
                description: 'Groupe privé pour échanger conseils et astuces',
                icon: (
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-.8 0-1.54.37-2.01 1l-4.7 6.28c-.18.24-.29.54-.29.85V20c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-2h2v2c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-2h2v2c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-2h2v2z"/>
                  </svg>
                ),
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                hoverColor: 'hover:bg-blue-100'
              },
              {
                platform: 'Instagram',
                description: 'Suivez nos activités et partagez vos moments',
                icon: (
                  <svg className="w-8 h-8 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.49.49-1.297.807-2.026.807s-1.536-.317-2.026-.807c-.49-.49-.807-1.297-.807-2.026s.317-1.536.807-2.026c.49-.49 1.297-.807 2.026-.807s1.536.317 2.026.807c.49.49.807 1.297.807 2.026s-.317 1.536-.807 2.026z"/>
                  </svg>
                ),
                bgColor: 'bg-pink-50',
                borderColor: 'border-pink-200',
                hoverColor: 'hover:bg-pink-100'
              },
              {
                platform: 'LinkedIn',
                description: 'Réseau professionnel pour les parents',
                icon: (
                  <svg className="w-8 h-8 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                ),
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                hoverColor: 'hover:bg-blue-100'
              },
              {
                platform: 'YouTube',
                description: 'Tutoriels et contenus éducatifs',
                icon: (
                  <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                ),
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200',
                hoverColor: 'hover:bg-red-100'
              }
            ].map((social, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className={`${social.bgColor} ${social.borderColor} border-2 rounded-2xl p-6 text-center`}
              >
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  {social.icon}
                </div>
                <h3 className="font-subtitle text-gray-900 mb-2">{social.platform}</h3>
                <p className="font-body text-gray-600 text-sm">{social.description}</p>
                <button className="mt-4 font-button bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm transition-all hover:from-blue-700 hover:to-purple-700">
                  Rejoindre
                </button>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="font-body text-gray-600 mb-4">
              Restez connecté et recevez nos dernières actualités
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Votre email"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-body"
              />
              <button className="font-button bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg transition-all hover:from-blue-700 hover:to-purple-700">
                S'abonner
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="font-title text-white text-lg">C</span>
                </div>
                <CubeAILogo className="text-xl" />
              </div>
              <p className="font-body text-gray-300 mb-4">
                L'apprentissage de l'intelligence artificielle pour tous dès le plus jeune âge. Notre mission est de rendre 
                l'éducation accessible, personnalisée et engageante pour chaque enfant.
              </p>
            </div>
            
            <div>
              <h4 className="font-subtitle text-white mb-4">Produit</h4>
              <ul className="space-y-2">
                <li><Link href="/features" className="font-body text-gray-300 hover:text-white transition-colors">Fonctionnalités</Link></li>
                <li><Link href="/pricing" className="font-body text-gray-300 hover:text-white transition-colors">Tarifs</Link></li>
                <li><Link href="/demo" className="font-body text-gray-300 hover:text-white transition-colors">Démo</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-subtitle text-white mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/help" className="font-body text-gray-300 hover:text-white transition-colors">Centre d'aide</Link></li>
                <li><Link href="/contact" className="font-body text-gray-300 hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/status" className="font-body text-gray-300 hover:text-white transition-colors">Statut</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="font-body text-gray-400">
              © 2024 CubeAI. Tous droits réservés. L'IA pour tous les enfants.
            </p>
          </div>
        </div>
      </footer>

      {/* Modal Bubix */}
      <AnimatePresence>
        {showBubix && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowBubix(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="absolute inset-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-full">
                <PublicBubix />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pastille flottante Bubix */}
      <FloatingBubixButton />
    </div>
  )
}
