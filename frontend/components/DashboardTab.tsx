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
  Bookmark,
  Flag,
  Trash2,
  Calendar
} from 'lucide-react'
import AnimatedLLMButton from './AnimatedLLMButton'
import AdvancedLLMResults from './AdvancedLLMResults'
import UserStats from './UserStats'
import { sessionsAPI, statsAPI } from '@/lib/api'
import { apiFetch } from '@/lib/api'
import { childSessionsAPI, type ChildSession, type ChildActivity, type SessionAnalysis, type GlobalAnalysis, type ExerciseResponse } from '@/lib/api/sessions'
import { useTracking } from '@/hooks/useTracking'
import { useRealTimeStatus } from '@/hooks/useRealTimeStatus'
import SavedAnalyses from './SavedAnalyses'
import OnlineStatus from './OnlineStatus'
import LimitationPopup from './LimitationPopup'
import AnalysisModal from './AnalysisModal'
import BubixSteps from './BubixSteps'
import AnalysisFilters from './AnalysisFilters'
import AnalysisPagination from './AnalysisPagination'
import ConversationAnalysis from './ConversationAnalysis'
import { useLimitationPopup } from '@/hooks/useLimitationPopup'
import WeeklyCycle from './WeeklyCycle'
import CommunicationAnalytics from './CommunicationAnalytics'

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
    childName?: string;
  }>>({});
  
  // États pour le modal d'analyse
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [likedAnalyses, setLikedAnalyses] = useState<Set<string>>(new Set());
  const [favoriteAnalyses, setFavoriteAnalyses] = useState<Set<string>>(new Set());
  
  // États pour les étapes Bubix
  const [bubixStepsVisible, setBubixStepsVisible] = useState<Record<string, boolean>>({});
  const [bubixCurrentStep, setBubixCurrentStep] = useState<Record<string, string>>({});
  const [bubixCompleted, setBubixCompleted] = useState<Record<string, boolean>>({});
  const [bubixError, setBubixError] = useState<Record<string, string>>({});

  // États pour les filtres et pagination
  const [filters, setFilters] = useState({
    search: '',
    childFilter: '',
    dateFilter: '',
    typeFilter: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // États pour les données CubeMatch
  const [cubeMatchData, setCubeMatchData] = useState<Record<string, any>>({});
  const [cubeMatchLoading, setCubeMatchLoading] = useState(false);
  
  // États pour le classement global
  const [globalRankings, setGlobalRankings] = useState<Record<string, number>>({});
  
  // États pour les statistiques globales et le top 10
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [top10Players, setTop10Players] = useState<any[]>([]);
  const [userRanking, setUserRanking] = useState<number | null>(null);

  // États pour les données ChildPrompts
  const [childPromptsData, setChildPromptsData] = useState<Record<string, any>>({});
  const [childPromptsLoading, setChildPromptsLoading] = useState(false);

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

  const handleSaveAnalysis = async (analysis: any) => {
    try {
      // L'analyse est déjà sauvegardée par l'API dans le modal
      // On récupère les analyses sauvegardées pour mettre à jour l'affichage
      await fetchSavedAnalyses();
      console.log('Analyse sauvegardée avec succès:', analysis);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleFlagAnalysis = async (analysisKey: string) => {
    try {
      // TODO: Implémenter l'API pour signaler une analyse
      console.log('Signalement de l\'analyse:', analysisKey);
      // Pour l'instant, on affiche juste un message
      alert('Analyse signalée avec succès');
    } catch (error) {
      console.error('Erreur lors du signalement:', error);
    }
  };

  // Fonction pour récupérer les analyses sauvegardées
  const fetchSavedAnalyses = async () => {
    try {
      const response = await fetch('/api/analyses/history');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Convertir les analyses sauvegardées au format attendu par le tableau
          const formattedAnalyses = data.analyses.reduce((acc: any, analysis: any) => {
            acc[analysis.id] = {
              type: analysis.analysisType,
              content: analysis.content,
              timestamp: new Date(analysis.createdAt),
              sessionId: analysis.sessionId,
              childName: analysis.childName,
              saved: true
            };
            return acc;
          }, {});
          
          setBubixResponses(prev => ({ ...prev, ...formattedAnalyses }));
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des analyses sauvegardées:', error);
    }
  };

  // Fonction pour récupérer les statistiques CubeMatch d'un enfant
  const fetchCubeMatchStats = async (childId: string) => {
    try {
      const response = await fetch(`/api/cubematch/stats?childId=${childId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        return data.data?.stats || null;
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération stats CubeMatch:', error);
      return null;
    }
  };

  // Fonction pour récupérer les scores CubeMatch récents d'un enfant
  const fetchCubeMatchScores = async (childId: string, limit: number = 5) => {
    try {
      const response = await fetch(`/api/cubematch/scores?childId=${childId}&limit=${limit}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        return data.data?.scores || [];
      }
      return [];
    } catch (error) {
      console.error('Erreur récupération scores CubeMatch:', error);
      return [];
    }
  };

  // Fonction pour récupérer les statistiques globales
  const fetchGlobalStats = async () => {
    try {
      const response = await fetch('/api/cubematch/stats', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setGlobalStats(data.data?.stats || null);
      }
    } catch (error) {
      console.error('Erreur récupération stats globales:', error);
    }
  };

  // Fonction pour récupérer le top 10 des joueurs
  const fetchTop10Players = async () => {
    try {
      const response = await fetch('/api/cubematch/global-leaderboard?limit=10');
      
      if (response.ok) {
        const data = await response.json();
        const leaderboard = data.data?.leaderboard || [];
        
        setTop10Players(leaderboard);
        
        // Calculer le rang de l'utilisateur actuel
        const currentUserRank = leaderboard.findIndex((player: any) => 
          childSessions?.some(session => session.id === player.userId)
        );
        
        setUserRanking(currentUserRank >= 0 ? currentUserRank + 1 : null);
      }
    } catch (error) {
      console.error('Erreur récupération top 10:', error);
    }
  };

  // Fonction pour calculer le classement global
  const calculateGlobalRankings = async () => {
    try {
      // Utiliser la route publique du leaderboard global
      const response = await fetch('/api/cubematch/global-leaderboard?limit=100');
      
      if (response.ok) {
        const data = await response.json();
        const leaderboard = data.data?.leaderboard || [];
        
        // Créer un mapping userId -> rank
        const rankingsMap: Record<string, number> = {};
        leaderboard.forEach((player: any) => {
          rankingsMap[player.userId] = player.rank;
        });
        
        setGlobalRankings(rankingsMap);
      }
    } catch (error) {
      console.error('Erreur calcul classement global:', error);
    }
  };

  // Fonction pour charger toutes les données CubeMatch des enfants
  const loadCubeMatchData = async () => {
    if (!childSessions || childSessions.length === 0) return;
    
    setCubeMatchLoading(true);
    try {
      const cubeMatchPromises = childSessions.map(async (session) => {
        const [stats, scores] = await Promise.all([
          fetchCubeMatchStats(session.id),
          fetchCubeMatchScores(session.id, 3)
        ]);
        
        return {
          sessionId: session.sessionId,
          childId: session.id,
          childName: session.name,
          stats,
          recentScores: scores
        };
      });
      
      const cubeMatchResults = await Promise.all(cubeMatchPromises);
      const cubeMatchMap = cubeMatchResults.reduce((acc, data) => {
        acc[data.sessionId] = data;
        return acc;
      }, {} as Record<string, any>);
      
      setCubeMatchData(cubeMatchMap);
      
      // Charger les statistiques globales et le top 10
      await Promise.all([
        calculateGlobalRankings(),
        fetchGlobalStats(),
        fetchTop10Players()
      ]);
    } catch (error) {
      console.error('Erreur chargement données CubeMatch:', error);
    } finally {
      setCubeMatchLoading(false);
    }
  };

  // Fonction pour récupérer les ChildPrompts d'un enfant
  const fetchChildPrompts = async (childId: string, limit: number = 5) => {
    try {
      const response = await fetch(`/api/childprompts/save?childSessionId=${childId}&limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        return data.data.prompts || [];
      }
      return [];
    } catch (error) {
      console.error('Erreur récupération ChildPrompts:', error);
      return [];
    }
  };

  // Fonction pour charger toutes les données ChildPrompts des enfants
  const loadChildPromptsData = async () => {
    if (!childSessions || childSessions.length === 0) return;
    
    try {
      const childPromptsPromises = childSessions.map(async (session) => {
        const prompts = await fetchChildPrompts(session.id, 3);
        
        return {
          sessionId: session.sessionId,
          childId: session.id,
          childName: session.name,
          recentPrompts: prompts
        };
      });
      
      const childPromptsResults = await Promise.all(childPromptsPromises);
      const childPromptsMap = childPromptsResults.reduce((acc, data) => {
        acc[data.sessionId] = data;
        return acc;
      }, {} as Record<string, any>);
      
      setChildPromptsData(childPromptsMap);
    } catch (error) {
      console.error('Erreur chargement données ChildPrompts:', error);
    }
  };

  // Fonction de filtrage des analyses
  const getFilteredAnalyses = () => {
    const analyses = Object.entries(bubixResponses);
    
    return analyses.filter(([key, response]) => {
      // Filtre par recherche textuelle
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const contentMatch = response.content.toLowerCase().includes(searchLower);
        const childMatch = response.childName?.toLowerCase().includes(searchLower);
        if (!contentMatch && !childMatch) return false;
      }

      // Filtre par enfant
      if (filters.childFilter && response.childName !== filters.childFilter) {
        return false;
      }

      // Filtre par type
      if (filters.typeFilter && response.type !== filters.typeFilter) {
        return false;
      }

      // Filtre par date
      if (filters.dateFilter) {
        const now = new Date();
        const analysisDate = new Date(response.timestamp);
        
        switch (filters.dateFilter) {
          case 'today':
            if (analysisDate.toDateString() !== now.toDateString()) return false;
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (analysisDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (analysisDate < monthAgo) return false;
            break;
          case 'quarter':
            const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            if (analysisDate < quarterAgo) return false;
            break;
          case 'year':
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            if (analysisDate < yearAgo) return false;
            break;
        }
      }

      return true;
    });
  };

  // Fonction de pagination
  const getPaginatedAnalyses = () => {
    const filtered = getFilteredAnalyses();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Fonction pour gérer les changements de filtres
  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset à la première page
  };

  // Fonction pour effacer les filtres
  const handleClearFilters = () => {
    setCurrentPage(1);
  };

  // Fonction pour changer de page
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteAnalysis = (analysisId: string) => {
    // Confirmation avant suppression
    if (confirm('Êtes-vous sûr de vouloir supprimer cette analyse ?')) {
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
      alert('Analyse supprimée avec succès');
    }
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

  // Chargement des analyses sauvegardées au démarrage
  useEffect(() => {
    if (user?.userType === 'PARENT') {
      fetchSavedAnalyses();
    }
  }, [user?.userType]);

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
          
          // Charger les données CubeMatch et ChildPrompts après avoir chargé les sessions
          if (sessions.length > 0) {
            loadCubeMatchData();
            loadChildPromptsData();
          }
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
      // Vérifier que les données sont chargées
      if (!childSessions || childSessions.length === 0) {
        console.error('❌ childSessions non chargées:', childSessions);
        throw new Error('Sessions enfants non chargées');
      }

      setLoadingStates(prev => ({ ...prev, [`compte_rendu_${sessionId}`]: true }));

      // Initialiser les étapes Bubix
      setBubixStepsVisible(prev => ({ ...prev, [sessionId]: true }));
      setBubixCurrentStep(prev => ({ ...prev, [sessionId]: 'auth' }));
      setBubixCompleted(prev => ({ ...prev, [sessionId]: false }));
      setBubixError(prev => ({ ...prev, [sessionId]: '' }));

      // Début de l'analyse
      
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

      // Trouver la session correspondante
      const foundSession = childSessions.find(s => s.sessionId === sessionId);
      const sessionIdToSend = foundSession?.id || sessionId;
      
      if (!foundSession) {
        throw new Error(`Session ${sessionId} non trouvée dans les données chargées`);
      }

      // Simuler les étapes de progression
      const steps = ['auth', 'parent', 'child', 'security', 'data', 'ai'];
      for (let i = 0; i < steps.length; i++) {
        setBubixCurrentStep(prev => ({ ...prev, [sessionId]: steps[i] }));
        await new Promise(resolve => setTimeout(resolve, 500)); // Délai entre chaque étape
      }

      const response = await fetch('/api/bubix/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt,
          sessionId: sessionIdToSend, // Utiliser l'ID de la base de données
          analysisType: 'compte_rendu',
          context: {
            childName: foundSession.name,
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

      // Marquer comme terminé
      setBubixCompleted(prev => ({ ...prev, [sessionId]: true }));

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
      setBubixError(prev => ({ 
        ...prev, 
        [sessionId]: error instanceof Error ? error.message : 'Erreur inconnue' 
      }));
      // Stocker l'erreur dans BubixResponses au lieu de sessionAnalyses
      setBubixResponses(prev => ({
        ...prev,
        [`compte_rendu_${sessionId}`]: {
          type: 'compte_rendu',
          content: `❌ Erreur lors de la génération du compte rendu: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          timestamp: new Date(),
          sessionId
        }
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [`compte_rendu_${sessionId}`]: false }));
      
      // Masquer les étapes après 3 secondes
      setTimeout(() => {
        setBubixStepsVisible(prev => ({ ...prev, [sessionId]: false }));
      }, 3000);
      
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
            ? "Suivez la progression de vos enfants et leurs avancées en temps réel"
            : "Découvre ton potentiel avec l'intelligence artificielle !"
          }
        </p>
      </motion.div>

      {/* Section informations compte pour les parents */}
      {user?.userType === 'PARENT' && realSummary?.totalTimeSinceRegistration && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-sm text-gray-600">Administrateur du compte</p>
                <p className="text-xs text-gray-500 font-mono">ID: {user?.sessionId}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-600">Temps total :</div>
                <div className="text-lg font-bold text-gray-800">
                  {realSummary.totalTimeSinceRegistration.formatted}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-600">Créé le :</div>
                <div className="text-sm font-semibold text-gray-800">
                  {new Date(realSummary.accountCreatedAt).toLocaleDateString('fr-FR')}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-600">Dernière connexion :</div>
                <div className="text-sm font-semibold text-gray-800">
                  {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('fr-FR') : 'Jamais'}
                </div>
              </div>
            </div>
            
            <button
              onClick={refreshAllData}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Rafraîchir les données"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Actualisation...' : 'Actualiser'}
            </button>
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
            <h3 className="text-lg font-semibold text-gray-900"></h3>
          </div>
          
          {/* Layout en deux colonnes */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Colonne gauche - Sessions (40%) */}
            <div className="lg:col-span-2">
              <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Sessions actives
              </h4>
          <div className="space-y-4">
            {childSessions && childSessions.length > 0 ? (
              childSessions.map((session) => (
              <div key={session.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* En-tête de la session */}
                <div className="flex items-center justify-between p-4 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{session.name}</p>
                      <p className="text-xs text-gray-500 font-mono">ID: {session.sessionId}</p>
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
                        {sessionStatuses[session.sessionId]?.totalTime || session.totalTime}
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
                    {/* Données CubeMatch */}
                    

                    

                    {/* Analyse des Conversations */}
                    {childPromptsData[session.sessionId] && childPromptsData[session.sessionId].recentPrompts?.length > 0 && (
                      <div className="mb-6">
                        <ConversationAnalysis 
                          analysis={{
                            totalConversations: childPromptsData[session.sessionId].recentPrompts.length,
                            averageEngagement: childPromptsData[session.sessionId].recentPrompts.reduce((sum: number, prompt: any) => {
                              const engagementValue = prompt.engagement === 'HIGH' ? 3 : prompt.engagement === 'MEDIUM' ? 2 : 1;
                              return sum + engagementValue;
                            }, 0) / childPromptsData[session.sessionId].recentPrompts.length,
                            favoriteTopics: childPromptsData[session.sessionId].recentPrompts.reduce((acc: Record<string, number>, prompt: any) => {
                              if (prompt.activityType) {
                                acc[prompt.activityType] = (acc[prompt.activityType] || 0) + 1;
                              }
                              return acc;
                            }, {}),
                            recentEngagement: childPromptsData[session.sessionId].recentPrompts.slice(0, 5).map((prompt: any) => ({
                              engagement: prompt.engagement,
                              topic: prompt.activityType,
                              date: new Date(prompt.createdAt)
                            }))
                          }}
                          childName={session.name}
                        />
                      </div>
                    )}

                    {/* Conversations Bubix détaillées */}
                    {childPromptsData[session.sessionId] && childPromptsData[session.sessionId].recentPrompts?.length > 0 && (
                      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                        <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Brain className="w-4 h-4 text-green-600" />
                          Conversations récentes avec Bubix
                        </h5>
                        <div className="space-y-3">
                          {childPromptsData[session.sessionId].recentPrompts.slice(0, 3).map((prompt: any, index: number) => (
                            <div key={prompt.id} className="bg-white rounded-md p-3 border border-gray-200">
                              <div className="flex items-start gap-2 mb-2">
                                <div className="text-xs text-gray-500">
                                  {new Date(prompt.createdAt).toLocaleDateString('fr-FR', { 
                                    day: '2-digit', 
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                        </div>
                                {prompt.engagement && (
                                  <div className={`text-xs px-2 py-1 rounded-full ${
                                    prompt.engagement === 'HIGH' ? 'bg-green-100 text-green-700' :
                                    prompt.engagement === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {prompt.engagement === 'HIGH' ? 'Élevé' : 
                                     prompt.engagement === 'MEDIUM' ? 'Moyen' : 'Faible'}
                              </div>
                                )}
                        </div>
                              <div className="text-xs text-gray-700 mb-1">
                                <strong>Enfant:</strong> {prompt.childMessage.substring(0, 100)}
                                {prompt.childMessage.length > 100 && '...'}
                              </div>
                              <div className="text-xs text-gray-600">
                                <strong>Bubix:</strong> {prompt.bubixResponse.substring(0, 80)}
                                {prompt.bubixResponse.length > 80 && '...'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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

                    {/* Étapes Bubix en cours */}
                    {bubixStepsVisible[session.sessionId] && (
                      <BubixSteps
                        isVisible={bubixStepsVisible[session.sessionId]}
                        currentStep={bubixCurrentStep[session.sessionId] || 'auth'}
                        isCompleted={bubixCompleted[session.sessionId] || false}
                        error={bubixError[session.sessionId]}
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

            {/* Colonne droite - Tableau des analyses (60%) */}
            <div className="lg:col-span-3">
              <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-600" />
                Analyses Bubix
              </h4>
              
              {/* Filtres et recherche */}
              <AnalysisFilters
                onFiltersChange={handleFiltersChange}
                children={childSessions.map(s => s.name)}
                onClearFilters={handleClearFilters}
              />
              
              {/* Tableau des réponses Bubix */}
              {Object.keys(bubixResponses).length > 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-hidden">
                    <table className="w-full table-fixed">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Enfant
                          </th>
                          <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aperçu
                          </th>
                          <th className="w-40 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getPaginatedAnalyses()
                          .sort(([,a], [,b]) => b.timestamp.getTime() - a.timestamp.getTime())
                          .map(([key, response]) => {
                            const childName = childSessions.find(s => s.sessionId === response.sessionId)?.name || response.childName || 'Enfant';
                            // Séparer le nom et prénom
                            const nameParts = childName.split(' ');
                            const firstName = nameParts[0] || '';
                            const lastName = nameParts.slice(1).join(' ') || '';
                            
                            return (
                              <tr key={key} className="hover:bg-gray-50">
                                <td className="px-3 py-3">
                                  <div className="text-xs text-gray-900 leading-tight">
                                    <div className="font-medium">{lastName}</div>
                                    <div className="text-gray-600">{firstName}</div>
                                    <div className="text-gray-400 font-mono text-xs">ID: {response.sessionId}</div>
                                  </div>
                                </td>
                                <td className="px-3 py-3">
                                  <div className="text-xs text-gray-500">
                                    {response.timestamp.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {response.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </td>
                                <td className="px-3 py-3">
                                  <div className="text-xs text-gray-700 line-clamp-2 leading-relaxed">
                                    {response.content.substring(0, 120)}...
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleOpenModal({
                                        ...response,
                                        childName
                                      })}
                                      className="inline-flex items-center gap-0 px-2 py-1 text-white text-xs font-medium rounded-md transition-colors"
                                      title="Lire l'analyse complète"
                                    >
                                      <BookOpen className="w-4 h-4 text-gray-900" />
                                      <span></span>
                                    </button>
                                    
            <button
                                      onClick={() => handleFlagAnalysis(key)}
                                      className="inline-flex items-center gap-0 px-2 py-1 text-white text-xs font-medium rounded-md transition-colors"
                                      title="Flag"
                                    >
                                      <Flag className="w-4 h-4 text-gray-900" />
                                      <span></span>
                                    </button>
                                    
                                    <button
                                      onClick={() => handleDeleteAnalysis(key)}
                                      className="inline-flex items-center gap-0 px-2 py-1 text-white text-xs font-medium rounded-md transition-colors"
                                      title="Supprimer"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                      <span></span>
            </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
          </div>
          
                  {/* Pagination */}
                  <AnalysisPagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(getFilteredAnalyses().length / itemsPerPage)}
                    totalItems={getFilteredAnalyses().length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                  />
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

      {/* Cycle d'apprentissage hebdomadaire pour les parents */}
      {user?.userType === 'PARENT' && childSessions.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Cycle d'apprentissage hebdomadaire</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cycle pour chaque enfant */}
            {childSessions.map((session) => (
              <div key={session.id} className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                    {session.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{session.name}</h4>
                    <p className="text-xs text-gray-500 font-mono">ID: {session.sessionId}</p>
                  </div>
                </div>
                
                <WeeklyCycle 
                  childName={session.name}
                  currentDay={new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()}
                  childSessionId={session.id}
                  showProgress={true}
                />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Analytics de communication pour les parents */}
      {user?.userType === 'PARENT' && childSessions.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="space-y-6"
        >
          <h3 className="text-lg font-semibold text-gray-900">Analytics de Communication</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {childSessions.map((session) => (
              <CommunicationAnalytics
                key={session.id}
                childSessionId={session.id}
                childName={session.name}
                timeRange={30}
              />
            ))}
          </div>
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
