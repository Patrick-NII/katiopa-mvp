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
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAgeAdaptation } from '@/hooks/useAgeAdaptation'
import { authAPI } from '@/lib/api'

function MathCubePageContent() {
  // Hooks
  const { isMobile, isTablet } = useScreenSize()
  const router = useRouter()
  
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
    console.log('🎮 Navigation vers la page CubeMatch...')
    router.push('/dashboard/games/cubematch')
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-50/80 dark:from-gray-950/95 dark:via-slate-900/90 dark:to-indigo-950/95 flex items-center justify-center relative overflow-hidden">
        {/* Éléments décoratifs pour le loading */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-40 h-40 bg-blue-200/8 dark:bg-blue-400/3 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-32 h-32 bg-indigo-200/10 dark:bg-indigo-400/4 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400"></div>
          <p className="text-blue-600 dark:text-blue-400 font-medium animate-pulse">Chargement de MathCube...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-50/80 dark:from-gray-950/95 dark:via-slate-900/90 dark:to-indigo-950/95 relative overflow-hidden">
      {/* Éléments décoratifs subtils et élégants */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Motifs géométriques doux */}
        <div className="absolute top-20 left-10 w-40 h-40 bg-blue-200/8 dark:bg-blue-400/3 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-60 right-16 w-32 h-32 bg-indigo-200/10 dark:bg-indigo-400/4 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-1/4 w-28 h-28 bg-purple-200/8 dark:bg-purple-400/3 rounded-full blur-2xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-1/3 w-24 h-24 bg-cyan-200/10 dark:bg-cyan-400/4 rounded-full blur-xl animate-pulse delay-3000"></div>
        
        {/* Grille subtile en arrière-plan */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.01]" 
             style={{
               backgroundImage: `radial-gradient(circle at 1px 1px, rgb(99 102 241) 1px, transparent 0)`,
               backgroundSize: '40px 40px'
             }}>
        </div>

        {/* Points lumineux discrets */}
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-400/30 dark:bg-blue-300/20 rounded-full animate-ping delay-500"></div>
        <div className="absolute top-2/3 left-1/4 w-1 h-1 bg-indigo-400/30 dark:bg-indigo-300/20 rounded-full animate-ping delay-1500"></div>
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-purple-400/30 dark:bg-purple-300/20 rounded-full animate-ping delay-2500"></div>
      </div>

      <div className="container mx-auto px-8 py-8 max-w-8xl relative z-10">
        
         {/* Header Hero Section Amélioré */}
         <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           className="relative text-center mb-6 overflow-hidden"
         >
         

          
          
          {/* Titre avec effet de typing */}
          <motion.h1 
          >
            {adaptText({
              simple: '🧮 MathCube',
              intermediate: '🧮 MathCube',
              advanced: '🧮 MathCube Pro'
            })}
            <motion.div
              className="absolute -inset-1 "
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
         <div className="space-y-6">
           
           {/* Section Jeux Disponibles */}
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="space-y-4"
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
                        </div>
                        
             {/* Grille des jeux - Optimisée pour enfants */}
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               
               {/* CubeMatch - Carte App Store */}
               <motion.div
                 className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-white/20 group cursor-pointer"
                 whileHover={{ y: -4, scale: 1.02 }}
                 transition={{ type: "spring", stiffness: 300 }}
                 onClick={handleOpenCubeMatch}
               >
                 {/* Image de prévisualisation - Compacte */}
                 <div className="relative aspect-[4/3] overflow-hidden">
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
                
                 {/* Informations du jeu - Compactes */}
                 <div className="p-3">
                   <div className="text-center mb-2">
                     <h3 className="font-bold text-base text-gray-900 dark:text-white">CubeMatch</h3>
                     <p className="text-xs text-blue-600 dark:text-blue-400">Calcul Mental</p>
                    </div>
                    
                   {/* Stats en une ligne */}
                   <div className="flex items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                     <div className="flex items-center gap-1">
                       <Trophy className="w-3 h-3 text-yellow-500" />
                       <span>{personalProgress.bestScore.toLocaleString()}</span>
                     </div>
                     <div className="flex items-center gap-1">
                       <Target className="w-3 h-3 text-blue-500" />
                       <span>Niv.{currentLevel}</span>
                        </div>
                      </div>
                            </div>
               </motion.div>
               
              {/* NuméroMagic - Jeu de nombres */}
              <motion.div
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-white/20 group cursor-pointer"
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                onClick={() => router.push('/dashboard/games/numeromagic')}
              >
                 <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-green-400 to-emerald-500">
                   <div className="absolute inset-0 flex items-center justify-center">
                     <span className="text-6xl">🔢</span>
                                </div>
                   <div className="absolute top-3 left-3">
                     <div className="bg-green-500/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium text-white">
                       Bientôt
                                  </div>
                                </div>
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                     <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
                       <Play className="w-8 h-8 text-white ml-1" />
                                  </div>
                                </div>
                              </div>
                 <div className="p-3">
                   <div className="text-center mb-2">
                     <h3 className="font-bold text-base text-gray-900 dark:text-white">NuméroMagic</h3>
                     <p className="text-xs text-green-600 dark:text-green-400">Nombres Magiques</p>
                          </div>
                   <div className="flex items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                     <div className="flex items-center gap-1">
                       <Sparkles className="w-3 h-3 text-green-500" />
                       <span>Nouveau</span>
                      </div>
                    </div>
                  </div>
               </motion.div>
               
              {/* FormesFun - Géométrie */}
              <motion.div
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-white/20 group cursor-pointer"
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                onClick={() => router.push('/dashboard/games/formesfun')}
              >
                 <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-purple-400 to-pink-500">
                   <div className="absolute inset-0 flex items-center justify-center">
                     <span className="text-6xl">🔺</span>
                   </div>
                   <div className="absolute top-3 left-3">
                     <div className="bg-purple-500/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium text-white">
                       Bientôt
                </div>
              </div>
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                     <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
                       <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                    </div>
                  </div>
                 <div className="p-3">
                   <div className="text-center mb-2">
                     <h3 className="font-bold text-base text-gray-900 dark:text-white">FormesFun</h3>
                     <p className="text-xs text-purple-600 dark:text-purple-400">Géométrie</p>
                        </div>
                   <div className="flex items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                     <div className="flex items-center gap-1">
                       <Sparkles className="w-3 h-3 text-purple-500" />
                       <span>Nouveau</span>
                          </div>
                        </div>
                      </div>
               </motion.div>
               
              {/* LogiQuest - Logique */}
              <motion.div
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-white/20 group cursor-pointer"
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                onClick={() => router.push('/dashboard/games/logiquest')}
              >
                 <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-orange-400 to-red-500">
                   <div className="absolute inset-0 flex items-center justify-center">
                     <span className="text-6xl">🧩</span>
                              </div>
                   <div className="absolute top-3 left-3">
                     <div className="bg-orange-500/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium text-white">
                       Bientôt
                            </div>
                          </div>
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                     <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
                       <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>
                </div>
                 <div className="p-3">
                   <div className="text-center mb-2">
                     <h3 className="font-bold text-base text-gray-900 dark:text-white">LogiQuest</h3>
                     <p className="text-xs text-orange-600 dark:text-orange-400">Énigmes</p>
                   </div>
                   <div className="flex items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                     <div className="flex items-center gap-1">
                       <Sparkles className="w-3 h-3 text-orange-500" />
                       <span>Nouveau</span>
              </div>
            </div>
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
      
      
    </div>
  )
}

export default function MathCubePage() {
  return <MathCubePageContent />
}