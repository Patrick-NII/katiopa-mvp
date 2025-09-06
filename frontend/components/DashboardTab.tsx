'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  TrendingUp, 
  Award,
  BarChart3,
  Clock,
  Zap,
  Users,
  Brain,
  ChevronDown,
  ChevronUp,
  Play,
  BookOpen,
  Code,
  Lightbulb,
  Gamepad2,
  Plus,
  RefreshCw,
  Bookmark
} from 'lucide-react'
import AnimatedLLMButton from './AnimatedLLMButton'
import AdvancedLLMResults from './AdvancedLLMResults'
import UserStats from './UserStats'
import { sessionsAPI, statsAPI } from '@/lib/api'
import { apiFetch } from '@/lib/api'
import { childSessionsAPI, type ChildSession, type ChildActivity, type SessionAnalysis, type GlobalAnalysis, type ExerciseResponse } from '@/lib/api/sessions'
import { useTracking } from '@/hooks/useTracking'
import { useRealTimeStatus } from '@/hooks/useRealTimeStatus'
import AIWritingAnimation from './AIWritingAnimation'
import SavedAnalyses from './SavedAnalyses'
import OnlineStatus from './OnlineStatus'
import LimitationPopup from './LimitationPopup'
import AnalysisModal from './AnalysisModal'
import BubixProgress, { createBubixSteps } from './BubixProgress'
import { useLimitationPopup } from '@/hooks/useLimitationPopup'

interface DashboardTabProps {
  user: any
  activities: any[]
  summary: {
    totalTime: number
    averageScore: number
    totalActivities: number
    domains: any[]
  } | null
  llmResponse: any
  loading: boolean
  focus: string
  onFocusChange: (focus: string) => void
  onEvaluateLLM: () => void
  onExerciseSelect: (nodeKey: string) => void
  subscriptionType?: 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE'
}

export default function DashboardTab({
  user,
  activities = [],
  summary = null,
  llmResponse,
  loading,
  focus,
  onFocusChange,
  onEvaluateLLM,
  onExerciseSelect,
  subscriptionType = 'FREE'
}: DashboardTabProps) {
  const [childSessions, setChildSessions] = useState<ChildSession[]>([]);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [sessionActivities, setSessionActivities] = useState<Record<string, ChildActivity[]>>({});
  const [sessionAnalyses, setSessionAnalyses] = useState<Record<string, SessionAnalysis>>({});
  const [exerciseResponses, setExerciseResponses] = useState<Record<string, ExerciseResponse>>({});
  const [globalAnalyses, setGlobalAnalyses] = useState<Record<string, GlobalAnalysis>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [aiWritingStates, setAiWritingStates] = useState<Record<string, { isWriting: boolean; type: 'compte_rendu' }>>({});
  const [expandedAnalyses, setExpandedAnalyses] = useState<Record<string, boolean>>({});
  const [realSummary, setRealSummary] = useState<any>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [showSavedAnalyses, setShowSavedAnalyses] = useState(false);
  const [analysisRatings, setAnalysisRatings] = useState<Record<string, number>>({});
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bubixResponses, setBubixResponses] = useState<Record<string, {
    type: 'compte_rendu';
    content: string;
    timestamp: Date;
    sessionId: string;
  }>>({});
  
  // États pour le modal d'analyse
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [likedAnalyses, setLikedAnalyses] = useState<Set<string>>(new Set());
  const [favoriteAnalyses, setFavoriteAnalyses] = useState<Set<string>>(new Set());
  
  // États pour la progression Bubix
  const [isProgressVisible, setIsProgressVisible] = useState(false);
  const [progressSteps, setProgressSteps] = useState(createBubixSteps());
  const [currentProgressStep, setCurrentProgressStep] = useState('');

  // Hook pour le statut en temps réel
  const { sessionStatuses, isLoading: statusLoading, refreshStatus } = useRealTimeStatus({
    childSessions,
    refreshInterval: 5000 // Mise à jour toutes les 5 secondes
  });

  // Limitation Découverte: 1 analyse / 7 jours (UX côté frontend + popup)
  const getLastAnalysisTs = (): number => {
    if (typeof window === 'undefined') return 0
    const v = localStorage.getItem('analysis_last_ts')
    return v ? parseInt(v, 10) : 0
  }
  const setLastAnalysisTs = () => {
    if (typeof window === 'undefined') return
    localStorage.setItem('analysis_last_ts', Date.now().toString())
  }
  const isAnalysisLimited = (): boolean => {
    if (!user?.subscriptionType || user.subscriptionType !== 'FREE') return false
    const last = getLastAnalysisTs()
    if (!last) return false
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    return Date.now() - last < sevenDays
  }
  const showLimitPopup = () => {
    const childName = childSessions[0]?.name || 'votre enfant'
    const subscriptionInfo = {
      limitationMessage: `⏳ Limite atteinte\n\nVotre plan Découverte permet 1 analyse par semaine.\n\n💡 Passez à Explorateur pour des analyses hebdomadaires détaillées, ou à Maître pour des analyses quotidiennes et prédictives.`,
      isCommercial: true,
      showUpgrade: true
    }
    showPopup(subscriptionInfo, 'PARENT', childName)
  }

  // Déterminer les couleurs selon le type d'abonnement
  const getSubscriptionColors = () => {
    if (subscriptionType === 'PRO_PLUS' || subscriptionType === 'ENTERPRISE') {
      return {
        gradient: 'from-orange-500 to-violet-600',
        hoverGradient: 'from-orange-600 to-violet-700',
        buttonBg: 'bg-orange-500',
        buttonHover: 'hover:bg-orange-600',
        lightBg: 'bg-orange-50',
        lightText: 'text-orange-700',
        lightBgHover: 'hover:bg-orange-100',
        iconBg: 'bg-orange-100',
        primary: 'orange'
      }
    } else if (subscriptionType === 'PRO') {
      return {
        gradient: 'from-violet-600 to-pink-500',
        hoverGradient: 'from-violet-700 to-pink-600',
        buttonBg: 'bg-violet-600',
        buttonHover: 'hover:bg-violet-700',
        lightBg: 'bg-violet-50',
        lightText: 'text-violet-700',
        lightBgHover: 'hover:bg-violet-100',
        iconBg: 'bg-violet-100',
        primary: 'violet'
      }
    } else {
      return {
        gradient: 'from-blue-600 to-purple-600',
        hoverGradient: 'from-blue-700 to-purple-700',
        buttonBg: 'bg-blue-600',
        buttonHover: 'hover:bg-blue-700',
        lightBg: 'bg-blue-50',
        lightText: 'text-blue-700',
        lightBgHover: 'hover:bg-blue-100',
        iconBg: 'bg-blue-100',
        primary: 'blue'
      }
    }
  }

  const colors = getSubscriptionColors()

  // Initialisation du tracking
  const { trackPrompt, trackMetric } = useTracking({
    trackClicks: false,
    trackInputs: false,
    trackNavigation: false,
    trackPerformance: false,
    trackPrompts: false
  });

  // Hook pour gérer les popups de limitation
  const {
    limitationState,
    showPopup,
    closePopup,
    remindLater,
    dismiss,
    upgrade
  } = useLimitationPopup()

  // Fonction pour déclencher le popup de limitation
  const triggerLimitationPopup = (subscriptionInfo: any) => {
    if (subscriptionInfo?.isCommercial && subscriptionInfo?.showUpgrade) {
      const childName = childSessions[0]?.name || 'votre enfant'
      showPopup(subscriptionInfo, 'PARENT', childName)
    }
  }

  // Fonction pour déclencher le popup après une action (comme générer une analyse)
  const triggerPopupAfterAction = () => {
    if (user?.subscriptionType === 'FREE') {
      const mockSubscriptionInfo = {
        limitationMessage: `🌟 **${childSessions[0]?.name || 'Votre enfant'} montre un potentiel exceptionnel !**\n\nLes progrès de votre enfant sont remarquables. Pour lui offrir l'accompagnement le plus adapté, nous vous proposons d'accéder à nos outils d'analyse avancés.\n\n🚀 **Avantages pour ${childSessions[0]?.name || 'votre enfant'} :**\n• Intelligence artificielle plus performante\n• Analyses détaillées de ses forces et axes d'amélioration\n• Recommandations pédagogiques personnalisées\n• Suivi en temps réel de ses performances\n\n💝 **Notre engagement :** Votre confiance est précieuse. Nous nous engageons à utiliser ces outils pour le bien-être et la progression de ${childSessions[0]?.name || 'votre enfant'}.`,
        isCommercial: true,
        showUpgrade: true
      }
      triggerLimitationPopup(mockSubscriptionInfo)
    }
  }

  // Fonctions pour gérer les actions du modal d'analyse
  const handleOpenModal = (analysis: any) => {
    setSelectedAnalysis(analysis);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAnalysis(null);
  };

  const handleSaveAnalysis = (analysis: any) => {
    // Sauvegarder l'analyse
    const savedAnalysis = {
      ...analysis,
      savedAt: new Date(),
      id: `${analysis.type}_${analysis.sessionId}_${Date.now()}`
    };
    setSavedAnalyses(prev => [...prev, savedAnalysis]);
    console.log('Analyse sauvegardée:', savedAnalysis);
  };

  const handleDeleteAnalysis = (analysisId: string) => {
    // Supprimer l'analyse
    setBubixResponses(prev => {
      const newResponses = { ...prev };
      Object.keys(newResponses).forEach(key => {
        if (key.includes(analysisId)) {
          delete newResponses[key];
        }
      });
      return newResponses;
    });
    handleCloseModal();
  };

  const handleLikeAnalysis = (analysisId: string) => {
    setLikedAnalyses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(analysisId)) {
        newSet.delete(analysisId);
      } else {
        newSet.add(analysisId);
      }
      return newSet;
    });
  };

  const handleFavoriteAnalysis = (analysisId: string) => {
    setFavoriteAnalyses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(analysisId)) {
        newSet.delete(analysisId);
      } else {
        newSet.add(analysisId);
      }
      return newSet;
    });
  };

  const handleDialogueAnalysis = (analysisId: string) => {
    // Ici on pourrait ouvrir un chat avec Bubix Pro
    console.log('Ouverture du dialogue Bubix Pro pour:', analysisId);
  };

  // Déclencheur de popup aléatoire (pour tester)
  useEffect(() => {
    // Déclencher le popup après 5 secondes pour les comptes FREE
    if (user?.subscriptionType === 'FREE') {
      const timer = setTimeout(() => {
        // Simuler des informations de limitation
        const mockSubscriptionInfo = {
          limitationMessage: `👨‍👩‍👧‍👦 **${childSessions[0]?.name || 'Votre enfant'} atteint un niveau extraordinaire !**\n\nNous sommes impressionnés par les progrès de votre enfant. Pour continuer à l'accompagner au mieux dans son apprentissage, nous vous proposons de découvrir nos fonctionnalités avancées.\n\n✨ **Bénéfices pour ${childSessions[0]?.name || 'votre enfant'} :**\n• Analyses plus approfondies de ses performances\n• Recommandations personnalisées\n• Suivi détaillé de sa progression\n• Accès à des exercices adaptés à son niveau\n\n🔒 **Votre tranquillité :** Nous nous engageons à protéger la progression de ${childSessions[0]?.name || 'votre enfant'} et à respecter son rythme d'apprentissage.`,
          isCommercial: true,
          showUpgrade: true
        }
        triggerLimitationPopup(mockSubscriptionInfo)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [user?.subscriptionType, childSessions])

  // Récupération des vraies données depuis l'API
  useEffect(() => {
    const loadRealData = async () => {
      try {
        setSummaryLoading(true);
        const summaryData = await statsAPI.getSummary();
        setRealSummary(summaryData);
      } catch (error) {
        console.error('Erreur lors du chargement des données réelles:', error);
        setRealSummary(summary);
      } finally {
        setSummaryLoading(false);
      }
    };

    loadRealData();
  }, [summary]);

  // Récupération des sessions enfants
  useEffect(() => {
    const loadChildSessions = async () => {
      if (user?.userType !== 'PARENT') return;
      
      try {
        // Utiliser directement fetch au lieu de childSessionsAPI
        const response = await fetch('/api/sessions/children', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          // S'assurer que data est un tableau
          const sessions = Array.isArray(data) ? data : [];
          setChildSessions(sessions);
        } else {
          console.error('Erreur lors du chargement des sessions enfants:', response.status);
          setChildSessions([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des sessions enfants:', error);
        setChildSessions([]);
      }
    };

    loadChildSessions();
  }, [user?.userType]);

  // Fonction de rafraîchissement complète
  const refreshAllData = async () => {
    setRefreshing(true);
    try {
      // Rafraîchir les données du résumé
      const summaryData = await statsAPI.getSummary();
      setRealSummary(summaryData);
      
      // Rafraîchir les sessions enfants
      if (user?.userType === 'PARENT') {
        const response = await fetch('/api/sessions/children', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          const sessions = Array.isArray(data) ? data : [];
          setChildSessions(sessions);
        } else {
          console.error('Erreur lors du rafraîchissement des sessions enfants:', response.status);
          setChildSessions([]);
        }
      }
      
      // Rafraîchir les statuts en temps réel
      refreshStatus();
      
      // Rafraîchir les activités des sessions ouvertes
      for (const sessionId of expandedSessions) {
        await loadSessionActivities(sessionId);
      }
      
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Fonction pour basculer l'expansion d'une session
  const toggleSessionExpansion = async (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
      // Charger les activités si pas encore fait
      if (!sessionActivities[sessionId]) {
        await loadSessionActivities(sessionId);
      }
    }
    setExpandedSessions(newExpanded);
  };

  // Charger les activités d'une session
  const loadSessionActivities = async (sessionId: string) => {
    try {
      setLoadingStates(prev => ({ ...prev, [sessionId]: true }));
      const activities = await childSessionsAPI.getSessionActivities(sessionId);
      setSessionActivities(prev => ({ ...prev, [sessionId]: activities }));
    } catch (error) {
      console.error('Erreur lors du chargement des activités:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  // Compte rendu précis et concis de l'ensemble
  const generateCompteRendu = async (sessionId: string) => {
    try {
      setLoadingStates(prev => ({ ...prev, [`compte_rendu_${sessionId}`]: true }));
      setAiWritingStates(prev => ({ ...prev, [sessionId]: { isWriting: true, type: 'compte_rendu' } }));
      
      // Fermer toutes les autres analyses
      setSessionAnalyses(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(key => { if (key !== sessionId) { delete newState[key]; } });
        return newState;
      });
      setGlobalAnalyses(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(key => { if (key !== sessionId) { delete newState[key]; } });
        return newState;
      });
      setExerciseResponses(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(key => { if (key !== sessionId) { delete newState[key]; } });
        return newState;
      });
      
      // Bloquer si limitation locale (Découverte)
      if (user?.subscriptionType === 'FREE' && isAnalysisLimited()) {
        showLimitPopup()
        throw new Error('Limite atteinte: 1 analyse/semaine (Découverte)')
      }

      // Communiquer uniquement avec Bubix
      const prompt = `Analyse complète de la session d'apprentissage de l'enfant ${sessionId}. 
      Génère un compte rendu détaillé incluant :
      - Résumé des activités réalisées
      - Temps passé et progression
      - Points forts observés
      - Difficultés rencontrées
      - Recommandations pour la suite
      
      Sois précis, constructif et encourageant.`;

      const response = await fetch('/api/bubix/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt,
          sessionId,
          analysisType: 'compte_rendu',
          context: {
            childName: childSessions.find(s => s.sessionId === sessionId)?.name || 'Enfant',
            activities: sessionActivities[sessionId] || [],
            subscriptionType: user?.subscriptionType
          }
        })
      });

      if (response.status === 429) {
        showLimitPopup();
        throw new Error('Limite atteinte');
      }

      if (!response.ok) {
        throw new Error('Erreur lors de la communication avec Bubix');
      }

      const data = await response.json();
      const analysisText = data.response || data.content || 'Aucune réponse de Bubix';

      // Stocker la réponse de Bubix
      setBubixResponses(prev => ({
        ...prev,
        [`compte_rendu_${sessionId}`]: {
          type: 'compte_rendu',
          content: analysisText,
          timestamp: new Date(),
          sessionId
        }
      }));
      // Marquer l'utilisation (Découverte)
      if (user?.subscriptionType === 'FREE') setLastAnalysisTs()
    } catch (error) {
      console.error('Erreur lors de la génération du compte rendu:', error);
      setSessionAnalyses(prev => ({ ...prev, [sessionId]: { sessionId, analysis: `❌ Erreur lors de la génération du compte rendu: ${error instanceof Error ? error.message : 'Erreur inconnue'}` } }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [`compte_rendu_${sessionId}`]: false }));
      setAiWritingStates(prev => ({ ...prev, [sessionId]: { isWriting: false, type: 'compte_rendu' } }));
      
      // Déclencher le popup après l'action (avec délai pour laisser l'utilisateur voir le résultat)
      setTimeout(() => {
        triggerPopupAfterAction()
      }, 2000)
    }
  };

  // Fonctions de gestion des analyses sauvegardées
  const saveAnalysis = (sessionId: string, type: string, content: string) => {
    const newAnalysis = {
      id: `${sessionId}_${type}_${Date.now()}`,
      sessionId,
      type,
      content,
      childName: childSessions.find(s => s.sessionId === sessionId)?.name || 'Enfant',
      savedAt: new Date(),
      rating: analysisRatings[`${sessionId}_${type}`] || 0,
      tags: []
    };
    
    setSavedAnalyses(prev => [newAnalysis, ...prev]);
    
    // Sauvegarder en localStorage
    if (typeof window !== 'undefined') {
      const saved = JSON.parse(localStorage.getItem('savedAnalyses') || '[]');
      saved.unshift(newAnalysis);
      localStorage.setItem('savedAnalyses', JSON.stringify(saved.slice(0, 50))); // Limiter à 50 analyses
    }
  };

  const deleteAnalysis = (id: string) => {
    setSavedAnalyses(prev => prev.filter(a => a.id !== id));
    
    // Supprimer du localStorage
    if (typeof window !== 'undefined') {
      const saved = JSON.parse(localStorage.getItem('savedAnalyses') || '[]');
      const updated = saved.filter((a: any) => a.id !== id);
      localStorage.setItem('savedAnalyses', JSON.stringify(updated));
    }
  };

  const rateAnalysis = (sessionId: string, type: string, rating: number) => {
    setAnalysisRatings(prev => ({ ...prev, [`${sessionId}_${type}`]: rating }));
  };

  const viewSavedAnalysis = (analysis: any) => {
    // Afficher l'analyse dans une modal ou une nouvelle section
    console.log('Documents:', analysis);
  };

  // Charger les analyses sauvegardées au montage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const saved = JSON.parse(localStorage.getItem('savedAnalyses') || '[]');
    setSavedAnalyses(saved);
  }, []);

  // Obtenir l'icône selon le type d'activité

  // Obtenir l'icône selon le type d'activité
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'MATH': return <BookOpen className="w-4 h-4" />;
      case 'READING': return <BookOpen className="w-4 h-4" />;
      case 'SCIENCE': return <Lightbulb className="w-4 h-4" />;
      case 'CODING': return <Code className="w-4 h-4" />;
      case 'GAME': return <Gamepad2 className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  // Obtenir la couleur selon le score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec salutation */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-4 mb-3">
          <h1 className="text-4xl font-bold text-gray-900">
            {user?.userType === 'PARENT' 
              ? `Bonjour ${user?.firstName} !` 
              : `Bonjour ${user?.firstName} ! 👋`
            }
          </h1>
        </div>
        <p className="text-lg text-gray-700 max-w-3xl mx-auto">
          {user?.userType === 'PARENT' 
            ? "Suivez la progression de vos enfants et leurs performances en temps réel"
            : "Découvre ton potentiel avec l'intelligence artificielle !"
          }
        </p>
      </motion.div>

      {/* Section temps total depuis l'inscription pour les parents */}
      {user?.userType === 'PARENT' && realSummary?.totalTimeSinceRegistration && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Temps total 
            </h3>
            <button
              onClick={refreshAllData}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2  text-blue-600 rounded-lg hover:bg-grey-100 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Rafraîchir les données"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Actualisation...' : ''}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-800">
                {realSummary.totalTimeSinceRegistration.formatted}
              </div>
              <div className="text-sm text-blue-600 font-medium">
                Temps total de connexion
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-800">
                {realSummary.totalTimeSinceRegistration.totalDays} jours
              </div>
              <div className="text-sm text-green-600 font-medium">
                Depuis l'inscription
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-800">
                {realSummary.totalTimeSinceRegistration.totalHours} heures
              </div>
              <div className="text-sm text-purple-600 font-medium">
                Temps cumulé
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>Compte créé le : {new Date(realSummary.accountCreatedAt).toLocaleDateString('fr-FR')}</p>
          </div>
        </motion.div>
      )}

      {/* Section des sessions enfants pour les parents */}
      {user?.userType === 'PARENT' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Sessions et Analyses</h3>
          </div>
          
          {/* Layout en deux colonnes */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Colonne gauche - Sessions (60%) */}
            <div className="lg:col-span-3">
              <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Sessions Enfants
              </h4>
              <div className="space-y-4">
            {childSessions && childSessions.length > 0 ? (
              childSessions.map((session) => (
              <div key={session.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* En-tête de la session */}
                <div className="flex items-center justify-between p-4 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{session.emoji}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{session.name}</p>
                      <p className="text-xs text-gray-500">ID: {session.sessionId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Statut en ligne/hors ligne en temps réel */}
                    
                    <OnlineStatus
                      isOnline={sessionStatuses[session.sessionId]?.isOnline || session.isOnline}
                      lastActivity={sessionStatuses[session.sessionId]?.lastActivity}
                      size="md"
                    />
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900"> 
                        {sessionStatuses[session.sessionId]?.totalTime || session.totalTime} min
                      </p>
                      <p className="text-xs text-gray-500">
                        {sessionStatuses[session.sessionId]?.lastActivity 
                          ? sessionStatuses[session.sessionId].lastActivity.toLocaleDateString('fr-FR')
                          : new Date(session.lastActivity).toLocaleDateString('fr-FR')
                        }
                      </p>
                    </div>
                    {/* Bouton d'expansion */}
                    <button
                      onClick={() => toggleSessionExpansion(session.sessionId)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {expandedSessions.has(session.sessionId) ? (
                        <ChevronUp className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Contenu déplié */}
                {expandedSessions.has(session.sessionId) && (
                  <div className="p-4 bg-white">
                    {/* Actions rapides — style aligné sur la page login */}
                    <div className="mb-6">
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Compte rendu */}
                        <button
                          onClick={() => generateCompteRendu(session.sessionId)}
                          disabled={loadingStates[`compte_rendu_${session.sessionId}`]}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 !text-gray-200 font-medium rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Générer un compte rendu"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>Compte rendu</span>
                          {loadingStates[`compte_rendu_${session.sessionId}`] && (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Animation IA en train d'écrire */}
                    {aiWritingStates[session.sessionId]?.isWriting && (
                      <AIWritingAnimation
                        isWriting={aiWritingStates[session.sessionId].isWriting}
                        childName={session.name.split(' ')[0]}
                        analysisType={aiWritingStates[session.sessionId].type}
                      />
                    )}




                     

                    
                  </div>
                )}
              </div>
            ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune session enfant trouvée</p>
              </div>
            )}
              </div>
            </div>

            {/* Colonne droite - Tableau des analyses (40%) */}
            <div className="lg:col-span-2">
              <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-600" />
                Analyses Bubix
              </h4>
              
              {/* Tableau des réponses Bubix */}
              {Object.keys(bubixResponses).length > 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Enfant
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aperçu
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(bubixResponses)
                          .sort(([,a], [,b]) => b.timestamp.getTime() - a.timestamp.getTime())
                          .map(([key, response]) => {
                            const childName = childSessions.find(s => s.sessionId === response.sessionId)?.name || 'Enfant';
                            return (
                              <tr key={key} className="hover:bg-gray-50">
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    {response.type === 'compte_rendu' && <BookOpen className="w-4 h-4 text-blue-600" />}
                                    <span className="text-sm font-medium text-gray-900">
                                      {response.type === 'compte_rendu' && 'Compte rendu'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{childName}</div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">
                                    {response.timestamp.toLocaleDateString('fr-FR')}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {response.timestamp.toLocaleTimeString('fr-FR')}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm text-gray-700 max-w-xs truncate">
                                    {response.content.substring(0, 100)}...
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-center">
                                  <button
                                    onClick={() => handleOpenModal({
                                      ...response,
                                      childName
                                    })}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                  >
                                    <BookOpen className="w-3 h-3" />
                                    Lire
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">Aucune analyse disponible</p>
                  <p className="text-xs text-gray-400 mt-1">Cliquez sur les boutons d'analyse pour commencer</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      

      {/* Section des analyses sauvegardées */}
      {user?.userType === 'PARENT' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowSavedAnalyses(!showSavedAnalyses)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Bookmark className="w-4 h-4" />
              {showSavedAnalyses ? 'Masquer' : 'Voir'} Documents
              <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                {savedAnalyses.length}
              </span>
            </button>
          </div>
          
          {showSavedAnalyses && (
            <SavedAnalyses
              childName={user?.firstName || 'Parent'}
              onViewAnalysis={viewSavedAnalysis}
              onDeleteAnalysis={deleteAnalysis}
            />
          )}
        </motion.div>
      )}

      
      {/* Modal d'analyse */}
      {selectedAnalysis && (
        <AnalysisModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          analysis={selectedAnalysis}
          onSave={handleSaveAnalysis}
          onDelete={handleDeleteAnalysis}
          onLike={handleLikeAnalysis}
          onFavorite={handleFavoriteAnalysis}
          onDialogue={handleDialogueAnalysis}
          isLiked={likedAnalyses.has(selectedAnalysis.sessionId)}
          isFavorite={favoriteAnalyses.has(selectedAnalysis.sessionId)}
          canDialogue={user?.subscriptionType === 'MAITRE' || user?.subscriptionType === 'ENTERPRISE'}
        />
      )}

      {/* Progression Bubix */}
      {isProgressVisible && (
        <BubixProgress
          isVisible={isProgressVisible}
          steps={progressSteps}
          currentStep={currentProgressStep}
          onComplete={() => setIsProgressVisible(false)}
        />
      )}

      {/* Popup de limitation */}
      <LimitationPopup
        isVisible={limitationState.isVisible}
        message={limitationState.message}
        isCommercial={limitationState.isCommercial}
        showUpgrade={limitationState.showUpgrade}
        childName={limitationState.childName}
        userType={limitationState.userType}
        subscriptionType={limitationState.subscriptionType}
        upgradeEvent={limitationState.upgradeEvent}
        onClose={closePopup}
        onUpgrade={upgrade}
        onRemindLater={remindLater}
        onDismiss={dismiss}
      />
      
    </div>
  )
} 
