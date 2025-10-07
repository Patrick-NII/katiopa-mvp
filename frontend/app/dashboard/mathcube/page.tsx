'use client'

import React, { useState, useEffect } from 'react'
import { 
  Trophy, 
  Star, 
  Clock, 
  TrendingUp,
  Zap,
  Gamepad2,
  Play,
  Award,
  BarChart3,
  Eye,
  HelpCircle,
  Target,
  Brain,
  Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScreenSize } from '@/hooks/useScreenSize'
import { cubeMatchAPI, type LeaderboardEntry } from '@/lib/api/cubematch-v2'
import { ModalProvider, useModalContext } from '@/contexts/ModalContext'
import CubeMatchModal from '@/components/modals/CubeMatchModal'
import Image from 'next/image'
import { useAgeAdaptation } from '@/hooks/useAgeAdaptation'
import { authAPI } from '@/lib/api'

function MathCubePageContent() {
  // Hooks
  const { isMobile, isTablet } = useScreenSize()
  const { openCubeMatchModal, modalStates, closeModal, minimizeModal, maximizeModal, updateModal } = useModalContext()
  
  // États principaux
  const [userAge, setUserAge] = useState<number>(8)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [isClient, setIsClient] = useState(false)

  // États de sauvegarde personnelle
  const [personalProgress, setPersonalProgress] = useState({
    gamesPlayed: 0,
    bestScore: 0,
    totalTime: 0,
    lastPlayed: null as Date | null
  })
  const [loading, setLoading] = useState(true)
  
  // États UI
  const [showInstructionsModal, setShowInstructionsModal] = useState(false)

  // Adaptation par âge
  const { adaptText, ui, shouldShowFeature } = useAgeAdaptation({ age: userAge })
  
  // Fonction pour ouvrir CubeMatch
  const handleOpenCubeMatch = () => {
    console.log('🎮 Tentative d\'ouverture du modal CubeMatch...')
    console.log('📊 État des modals avant:', modalStates)
    openCubeMatchModal()
    setTimeout(() => {
      console.log('📊 État des modals après:', modalStates)
    }, 100)
  }

  // Chargement des données
  useEffect(() => {
    setIsClient(true)
    
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Charger l'âge de l'utilisateur
        try {
          const response = await authAPI.verify()
          if (response.success && (response.user as any)?.age) {
            setUserAge((response.user as any).age)
          }
        } catch (error) {
          console.error('Erreur lors du chargement de l\'âge:', error)
        }
        
         
         // Charger la progression personnelle (sauvegarde locale)
         const savedProgress = localStorage.getItem('cubematch-progress')
         if (savedProgress) {
           const progress = JSON.parse(savedProgress)
           setPersonalProgress(progress)
           setScore(progress.bestScore || 0)
         }
        
      } catch (error) {
        console.error('❌ Erreur de chargement:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])
  
  
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header Hero Section Amélioré */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative text-center mb-12 overflow-hidden"
        >
          {/* Arrière-plan animé */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500/10 rounded-full animate-pulse"></div>
            <div className="absolute top-20 right-20 w-16 h-16 bg-purple-500/10 rounded-full animate-bounce delay-300"></div>
            <div className="absolute bottom-10 left-1/4 w-12 h-12 bg-pink-500/10 rounded-full animate-pulse delay-700"></div>
            <div className="absolute bottom-20 right-1/3 w-8 h-8 bg-yellow-500/10 rounded-full animate-bounce delay-1000"></div>
          </div>

          
          
          {/* Titre avec effet de typing */}
          <motion.h1 
            className={`${ui.fontSize.title} font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 relative`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {adaptText({
              simple: '🧮 MathCube',
              intermediate: '🧮 MathCube',
              advanced: '🧮 MathCube Pro'
            })}
            <motion.div
              className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-lg blur-lg"
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.h1>
          
          {/* Description avec animation */}
          <motion.p 
            className={`${ui.fontSize.body} text-gray-600 dark:text-gray-300 max-w-2xl mx-auto relative`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {adaptText({
              simple: 'Trouve les bonnes combinaisons et deviens un champion des nombres !',
              intermediate: 'Développe tes compétences en calcul mental avec des défis amusants',
              advanced: 'Maîtrise les opérations mathématiques et développe ta logique numérique'
            })}
          </motion.p>

          
        </motion.div>
        
         {/* App Store - Jeux et Exercices */}
         <div className="space-y-8">
           
           {/* Section Jeux Disponibles */}
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="space-y-6"
           >
             <div className="flex items-center justify-between">
               <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                 <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                   <Gamepad2 className="w-5 h-5 text-white" />
                 </div>
                 {adaptText({
                   simple: 'Mes Jeux',
                   intermediate: 'Jeux Disponibles',
                   advanced: 'Catalogue de Jeux'
                 })}
               </h2>
               <div className="text-sm text-gray-500 dark:text-gray-400">
                 {adaptText({
                   simple: '1 jeu',
                   intermediate: '1 jeu disponible',
                   advanced: '1 jeu • Plus à venir'
                 })}
               </div>
             </div>

             {/* Grille des jeux */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               
               {/* CubeMatch - Carte App Store */}
               <motion.div
                 className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-white/20 group cursor-pointer"
                 whileHover={{ y: -4, scale: 1.02 }}
                 transition={{ type: "spring", stiffness: 300 }}
                 onClick={handleOpenCubeMatch}
               >
                 {/* Image de prévisualisation */}
                 <div className="relative aspect-[16/10] overflow-hidden">
                   <Image
                     src="/cubematch/image1.png"
                     alt="CubeMatch"
                     fill
                     className="object-cover group-hover:scale-105 transition-transform duration-300"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                   
                   {/* Badge de difficulté */}
                   <div className="absolute top-3 left-3">
                     <div className="bg-blue-500/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium text-white">
                       {adaptText({
                         simple: 'Facile',
                         intermediate: 'Moyen',
                         advanced: 'Expert'
                       })}
                     </div>
                   </div>
                   
                   {/* Bouton Play au centre */}
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                     <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
                       <Play className="w-8 h-8 text-white ml-1" />
                     </div>
                   </div>
                 </div>
                 
                 {/* Informations du jeu */}
                 <div className="p-4">
                   <div className="flex items-start justify-between mb-2">
                     <div>
                       <h3 className="font-bold text-lg text-gray-900 dark:text-white">CubeMatch</h3>
                       <p className="text-sm text-blue-600 dark:text-blue-400">Calcul Mental</p>
                     </div>
                     <div className="text-right">
                       <div className="text-sm font-bold text-gray-900 dark:text-white">{personalProgress.bestScore.toLocaleString()}</div>
                       <div className="text-xs text-gray-500 dark:text-gray-400">Record</div>
                     </div>
                   </div>
                   
                   <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                     {adaptText({
                       simple: 'Trouve les bonnes combinaisons de nombres !',
                       intermediate: 'Développe ton calcul mental avec des défis amusants',
                       advanced: 'Maîtrise les opérations et développe ta logique numérique'
                     })}
                   </p>
                   
                   {/* Stats compactes */}
                   <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                     <div className="flex items-center gap-1">
                       <Clock className="w-3 h-3" />
                       <span>{personalProgress.gamesPlayed} parties</span>
                     </div>
                     <div className="flex items-center gap-1">
                       <Target className="w-3 h-3" />
                       <span>Niveau {currentLevel}</span>
                     </div>
                   </div>
                   
                   {/* Bouton d'action */}
                   <motion.button
                     onClick={(e) => {
                       e.stopPropagation()
                       handleOpenCubeMatch()
                     }}
                     className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-300 flex items-center justify-center gap-2"
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                   >
                     <Play className="w-4 h-4" />
                     {adaptText({
                       simple: 'Jouer',
                       intermediate: 'Démarrer',
                       advanced: 'Lancer le jeu'
                     })}
                   </motion.button>
                 </div>
               </motion.div>
               
               {/* Placeholder pour futurs jeux */}
               <motion.div
                 className="bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300/50 dark:border-gray-600/50 p-6 flex flex-col items-center justify-center text-center min-h-[300px] group hover:border-blue-400/50 transition-all duration-300"
                 whileHover={{ scale: 1.02 }}
               >
                 <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                   <Sparkles className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                 </div>
                 <h3 className="font-bold text-gray-600 dark:text-gray-400 mb-2">
                   {adaptText({
                     simple: 'Nouveau Jeu',
                     intermediate: 'Prochainement',
                     advanced: 'En Développement'
                   })}
                 </h3>
                 <p className="text-sm text-gray-500 dark:text-gray-500">
                   {adaptText({
                     simple: 'Bientôt disponible !',
                     intermediate: 'De nouveaux jeux arrivent',
                     advanced: 'Modules en cours de développement'
                   })}
                 </p>
               </motion.div>
               
               {/* Autre placeholder */}
               <motion.div
                 className="bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300/50 dark:border-gray-600/50 p-6 flex flex-col items-center justify-center text-center min-h-[300px] group hover:border-green-400/50 transition-all duration-300"
                 whileHover={{ scale: 1.02 }}
               >
                 <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                   <Brain className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                 </div>
                 <h3 className="font-bold text-gray-600 dark:text-gray-400 mb-2">
                   {adaptText({
                     simple: 'Autre Jeu',
                     intermediate: 'À venir',
                     advanced: 'Module Futur'
                   })}
                 </h3>
                 <p className="text-sm text-gray-500 dark:text-gray-500">
                   {adaptText({
                     simple: 'Plus de jeux bientôt !',
                     intermediate: 'Exercices supplémentaires',
                     advanced: 'Contenu éducatif avancé'
                   })}
                 </p>
               </motion.div>
               
             </div>
           </motion.div>

           {/* Section Exercices et Leçons */}
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="space-y-6"
           >
             <div className="flex items-center justify-between">
               <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                 <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                   <Brain className="w-5 h-5 text-white" />
                 </div>
                 {adaptText({
                   simple: 'Mes Leçons',
                   intermediate: 'Exercices & Leçons',
                   advanced: 'Modules d\'Apprentissage'
                 })}
               </h2>
               <div className="text-sm text-gray-500 dark:text-gray-400">
                 {adaptText({
                   simple: 'Bientôt',
                   intermediate: 'En préparation',
                   advanced: 'Contenu à venir'
                 })}
               </div>
             </div>

             {/* Grille des exercices */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               
               {/* Calcul Mental */}
               <motion.div
                 className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl p-4 border border-blue-200/50 dark:border-blue-700/30 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                 whileHover={{ scale: 1.02, y: -2 }}
               >
                 <div className="flex items-center gap-3 mb-3">
                   <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                     <span className="text-xl">🧮</span>
                   </div>
                   <div>
                     <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                       {adaptText({
                         simple: 'Calculs',
                         intermediate: 'Calcul Mental',
                         advanced: 'Calcul Rapide'
                       })}
                     </h3>
                     <p className="text-xs text-blue-600 dark:text-blue-400">Mathématiques</p>
                   </div>
                 </div>
                 <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                   {adaptText({
                     simple: 'Additions et soustractions',
                     intermediate: 'Opérations de base',
                     advanced: 'Stratégies de calcul'
                   })}
                 </p>
                 <div className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full inline-block">
                   📊 Suivi Bubix
                 </div>
               </motion.div>

               {/* Géométrie */}
               <motion.div
                 className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl p-4 border border-green-200/50 dark:border-green-700/30 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                 whileHover={{ scale: 1.02, y: -2 }}
               >
                 <div className="flex items-center gap-3 mb-3">
                   <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                     <span className="text-xl">📐</span>
                   </div>
                   <div>
                     <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                       {adaptText({
                         simple: 'Formes',
                         intermediate: 'Géométrie',
                         advanced: 'Géométrie Spatiale'
                       })}
                     </h3>
                     <p className="text-xs text-green-600 dark:text-green-400">Mathématiques</p>
                   </div>
                 </div>
                 <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                   {adaptText({
                     simple: 'Formes et couleurs',
                     intermediate: 'Figures géométriques',
                     advanced: 'Aires et volumes'
                   })}
                 </p>
                 <div className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-1 rounded-full inline-block">
                   📊 Suivi Bubix
                 </div>
               </motion.div>

               {/* Résolution de Problèmes */}
               <motion.div
                 className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-2xl p-4 border border-purple-200/50 dark:border-purple-700/30 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                 whileHover={{ scale: 1.02, y: -2 }}
               >
                 <div className="flex items-center gap-3 mb-3">
                   <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                     <span className="text-xl">🧩</span>
                   </div>
                   <div>
                     <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                       {adaptText({
                         simple: 'Problèmes',
                         intermediate: 'Résolution',
                         advanced: 'Problèmes Complexes'
                       })}
                     </h3>
                     <p className="text-xs text-purple-600 dark:text-purple-400">Logique</p>
                   </div>
                 </div>
                 <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                   {adaptText({
                     simple: 'Énigmes simples',
                     intermediate: 'Stratégies étape par étape',
                     advanced: 'Problèmes multi-étapes'
                   })}
                 </p>
                 <div className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full inline-block">
                   📊 Suivi Bubix
                 </div>
               </motion.div>

               {/* Logique */}
               <motion.div
                 className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-2xl p-4 border border-orange-200/50 dark:border-orange-700/30 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                 whileHover={{ scale: 1.02, y: -2 }}
               >
                 <div className="flex items-center gap-3 mb-3">
                   <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                     <span className="text-xl">🎯</span>
                   </div>
                   <div>
                     <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                       {adaptText({
                         simple: 'Logique',
                         intermediate: 'Raisonnement',
                         advanced: 'Déduction'
                       })}
                     </h3>
                     <p className="text-xs text-orange-600 dark:text-orange-400">Sens critique</p>
                   </div>
                 </div>
                 <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                   {adaptText({
                     simple: 'Suites logiques',
                     intermediate: 'Raisonnement logique',
                     advanced: 'Analyse critique'
                   })}
                 </p>
                 <div className="text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full inline-block">
                   📊 Suivi Bubix
                 </div>
               </motion.div>

             </div>
           </motion.div>
          
          
        </div>
        
        
      </div>

      {/* Modal Instructions */}
      <AnimatePresence>
      {showInstructionsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowInstructionsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {adaptText({
                      simple: 'Comment Jouer',
                      intermediate: 'Mode d\'emploi CubeMatch',
                      advanced: 'Guide Stratégique CubeMatch'
                    })}
                  </h2>
                  <p className="text-blue-600 dark:text-blue-400">
                    {adaptText({
                      simple: 'Règles du jeu',
                      intermediate: 'Règles et instructions du jeu',
                      advanced: 'Mécaniques de jeu et stratégies'
                    })}
                  </p>
          </div>
        </div>
        
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    {adaptText({
                      simple: 'But du Jeu',
                      intermediate: 'Objectif du Jeu',
                      advanced: 'Objectifs et Mécaniques'
                    })}
          </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {adaptText({
                      simple: 'Trouve les cubes qui font le bon nombre quand on les additionne !',
                      intermediate: 'CubeMatch est un jeu de calcul mental où tu dois résoudre des équations mathématiques en faisant correspondre des cubes colorés.',
                      advanced: 'CubeMatch est un jeu de calcul mental où tu dois résoudre des équations mathématiques en faisant correspondre des cubes colorés. L\'objectif est d\'obtenir le score le plus élevé possible en résolvant correctement le maximum d\'équations dans le temps imparti.'
                    })}
                  </p>
                </div>

                      <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Play className="w-5 h-5 text-green-600" />
                    {adaptText({
                      simple: 'Comment Jouer',
                      intermediate: 'Règles du Jeu',
                      advanced: 'Mécaniques de Gameplay'
                    })}
                  </h3>
                  <div className="space-y-3 text-gray-700 dark:text-gray-300">
                    <p>
                      {adaptText({
                        simple: '1. Clique sur les cubes pour les sélectionner',
                        intermediate: '1. Sélectionne les cubes en cliquant dessus',
                        advanced: '1. Sélectionne les cubes en cliquant dessus (ou utilise les raccourcis clavier)'
                      })}
                    </p>
                    <p>
                      {adaptText({
                        simple: '2. Trouve la bonne combinaison',
                        intermediate: '2. Trouve la combinaison qui donne le résultat demandé',
                        advanced: '2. Calcule mentalement pour trouver la combinaison qui correspond à l\'objectif affiché'
                      })}
                    </p>
                    <p>
                      {adaptText({
                        simple: '3. Valide ta réponse',
                        intermediate: '3. Valide ta réponse pour gagner des points',
                        advanced: '3. Valide ta réponse rapidement pour maximiser ton score et maintenir ton combo'
                      })}
                    </p>
                    <p>
                      {adaptText({
                        simple: '4. Continue jusqu\'à la fin !',
                        intermediate: '4. Continue jusqu\'à la fin du temps imparti',
                        advanced: '4. Optimise ta stratégie : vitesse vs précision pour maximiser ton score final'
                      })}
                    </p>
            </div>
          </div>
          
                {shouldShowFeature('advancedTips') && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      Conseils Avancés
                  </h3>
                    <div className="space-y-2 text-gray-700 dark:text-gray-300">
                      <p>• Maintiens un combo élevé pour multiplier tes points</p>
                      <p>• Les solutions rapides donnent des bonus de temps</p>
                      <p>• Utilise les indices avec parcimonie (ils coûtent des points)</p>
                      <p>• Observe les patterns pour anticiper les prochains cubes</p>
                    </div>
            </div>
                )}
          </div>
          
              <div className="flex justify-end mt-8">
                  <button
                    onClick={() => setShowInstructionsModal(false)}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  {adaptText({
                    simple: 'Compris !',
                    intermediate: 'J\'ai compris',
                    advanced: 'Commencer à jouer'
                  })}
                  </button>
              </div>
            </motion.div>
          </motion.div>
      )}
      </AnimatePresence>
      
      {/* CubeMatch Modal */}
      {modalStates.cubematch && (
        <CubeMatchModal
          isOpen={modalStates.cubematch.isOpen}
          onClose={() => closeModal('cubematch')}
          onMinimize={() => minimizeModal('cubematch')}
          onMaximize={() => maximizeModal('cubematch')}
          onFullscreen={() => updateModal('cubematch', { isFullscreen: true, isMaximized: false })}
          isMinimized={modalStates.cubematch.isMinimized}
          isMaximized={modalStates.cubematch.isMaximized}
          isFullscreen={modalStates.cubematch.isFullscreen}
          zIndex={modalStates.cubematch.zIndex}
          position={modalStates.cubematch.position}
          size={modalStates.cubematch.size}
        />
      )}
      
    </div>
  )
}

export default function MathCubePage() {
  return (
    <ModalProvider>
      <MathCubePageContent />
    </ModalProvider>
  )
}