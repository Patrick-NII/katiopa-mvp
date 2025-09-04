'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  TrendingUp, 
  Target, 
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
  Eye,
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
import AIAnalysisCard from './AIAnalysisCard'
import SavedAnalyses from './SavedAnalyses'
import OnlineStatus from './OnlineStatus'

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
  const [aiWritingStates, setAiWritingStates] = useState<Record<string, { isWriting: boolean; type: 'compte_rendu' | 'appreciation' | 'conseils' }>>({});
  const [expandedAnalyses, setExpandedAnalyses] = useState<Record<string, boolean>>({});
  const [realSummary, setRealSummary] = useState<any>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [showSavedAnalyses, setShowSavedAnalyses] = useState(false);
  const [analysisRatings, setAnalysisRatings] = useState<Record<string, number>>({});
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Hook pour le statut en temps réel
  const { sessionStatuses, isLoading: statusLoading, refreshStatus } = useRealTimeStatus({
    childSessions,
    refreshInterval: 5000 // Mise à jour toutes les 5 secondes
  });

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
        Object.keys(newState).forEach(key => {
          if (key !== sessionId) {
            delete newState[key];
          }
        });
        return newState;
      });
      setGlobalAnalyses(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(key => {
          if (key !== sessionId) {
            delete newState[key];
          }
        });
        return newState;
      });
      setExerciseResponses(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(key => {
          if (key !== sessionId) {
            delete newState[key];
          }
        });
        return newState;
      });
      
      const analysis = await childSessionsAPI.analyzeSession(sessionId);
      setSessionAnalyses(prev => ({ ...prev, [sessionId]: analysis }));
    } catch (error) {
      console.error('Erreur lors de la génération du compte rendu:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [`compte_rendu_${sessionId}`]: false }));
      setAiWritingStates(prev => ({ ...prev, [sessionId]: { isWriting: false, type: 'compte_rendu' } }));
    }
  };

  // Analyse détaillée de chaque élément et améliorations possibles
  const generateAppreciation = async (sessionId: string) => {
    try {
      setLoadingStates(prev => ({ ...prev, [`appreciation_${sessionId}`]: true }));
      setAiWritingStates(prev => ({ ...prev, [sessionId]: { isWriting: true, type: 'appreciation' } }));
      
      // Fermer les autres onglets
      setSessionAnalyses(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(key => {
          if (key !== sessionId) {
            delete newState[key];
          }
        });
        return newState;
      });
      setGlobalAnalyses(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(key => {
          if (key !== sessionId) {
            delete newState[key];
          }
        });
        return newState;
      });
      setExerciseResponses(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(key => {
          if (key !== sessionId) {
            delete newState[key];
          }
        });
        return newState;
      });
      
      const analysis = await childSessionsAPI.getGlobalAnalysis(sessionId);
      setGlobalAnalyses(prev => ({ ...prev, [sessionId]: analysis }));
    } catch (error) {
      console.error('Erreur lors de la génération de l\'appréciation:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [`appreciation_${sessionId}`]: false }));
      setAiWritingStates(prev => ({ ...prev, [sessionId]: { isWriting: false, type: 'appreciation' } }));
    }
  };

  // Conseils et plans d'action pour améliorer le programme
  const generateConseils = async (sessionId: string) => {
    try {
      setLoadingStates(prev => ({ ...prev, [`conseils_${sessionId}`]: true }));
      setAiWritingStates(prev => ({ ...prev, [sessionId]: { isWriting: true, type: 'conseils' } }));
      
      // Fermer les autres onglets
      setSessionAnalyses(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(key => {
          if (key !== sessionId) {
            delete newState[key];
          }
        });
        return newState;
      });
      setGlobalAnalyses(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(key => {
          if (key !== sessionId) {
            delete newState[key];
          }
        });
        return newState;
      });
      setExerciseResponses(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(key => {
          if (key !== sessionId) {
            delete newState[key];
          }
        });
        return newState;
      });
      
      const exercise = await childSessionsAPI.generateExercise(sessionId);
      setExerciseResponses(prev => ({ ...prev, [sessionId]: exercise }));
    } catch (error) {
      console.error('Erreur lors de la génération des conseils:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [`conseils_${sessionId}`]: false }));
      setAiWritingStates(prev => ({ ...prev, [sessionId]: { isWriting: false, type: 'conseils' } }));
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Session active</h3>
            
          </div>
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
                    {/* Actions rapides */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => generateCompteRendu(session.sessionId)}
                        disabled={loadingStates[`compte_rendu_${session.sessionId}`]}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                      >
                        Compte rendu
                      </button>
                      
                      <button
                        onClick={() => generateAppreciation(session.sessionId)}
                        disabled={loadingStates[`appreciation_${session.sessionId}`]}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                      >
                        Appréciation
                      </button>
                      <button
                        onClick={() => generateConseils(session.sessionId)}
                        disabled={loadingStates[`conseils_${session.sessionId}`]}
                        className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                      >
                        Conseils et exercices
                      </button>
                    </div>

                    {/* Animation IA en train d'écrire */}
                    {aiWritingStates[session.sessionId]?.isWriting && (
                      <AIWritingAnimation
                        isWriting={aiWritingStates[session.sessionId].isWriting}
                        childName={session.name.split(' ')[0]}
                        analysisType={aiWritingStates[session.sessionId].type}
                      />
                    )}

                    {/* Analyse des performances */}
                    {sessionAnalyses[session.sessionId] && (
                      <AIAnalysisCard
                        type="compte_rendu"
                        title={`Compte rendu - ${session.name} (ID: ${session.sessionId})`}
                        content={sessionAnalyses[session.sessionId].analysis}
                        childName={session.name}
                        isExpanded={expandedAnalyses[`compte_rendu_${session.sessionId}`] || false}
                        onToggle={() => setExpandedAnalyses(prev => ({ 
                          ...prev, 
                          [`compte_rendu_${session.sessionId}`]: !prev[`compte_rendu_${session.sessionId}`] 
                        }))}
                        onClose={() => setSessionAnalyses(prev => {
                          const newState = { ...prev }
                          delete newState[session.sessionId]
                          return newState
                        })}
                        onSave={() => saveAnalysis(session.sessionId, 'compte_rendu', sessionAnalyses[session.sessionId].analysis)}
                        onShare={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: `Compte rendu - ${session.name}`,
                              text: sessionAnalyses[session.sessionId].analysis
                            })
                          }
                        }}
                        rating={analysisRatings[`${session.sessionId}_compte_rendu`] || 0}
                        onRate={(rating) => rateAnalysis(session.sessionId, 'compte_rendu', rating)}
                      />
                    )}

                    {/* Analyse globale */}
                    {globalAnalyses[session.sessionId] && (
                      <AIAnalysisCard
                        type="appreciation"
                        title={`Appréciation détaillée - ${session.name} (ID: ${session.sessionId})`}
                        content={globalAnalyses[session.sessionId].analysis.aiAnalysis}
                        childName={session.name}
                        isExpanded={expandedAnalyses[`appreciation_${session.sessionId}`] || false}
                        onToggle={() => setExpandedAnalyses(prev => ({ 
                          ...prev, 
                          [`appreciation_${session.sessionId}`]: !prev[`appreciation_${session.sessionId}`] 
                        }))}
                        onClose={() => setGlobalAnalyses(prev => {
                          const newState = { ...prev }
                          delete newState[session.sessionId]
                          return newState
                        })}
                        onSave={() => saveAnalysis(session.sessionId, 'appreciation', globalAnalyses[session.sessionId].analysis.aiAnalysis)}
                        onShare={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: `Appréciation - ${session.name}`,
                              text: globalAnalyses[session.sessionId].analysis.aiAnalysis
                            })
                          }
                        }}
                        rating={analysisRatings[`${session.sessionId}_appreciation`] || 0}
                        onRate={(rating) => rateAnalysis(session.sessionId, 'appreciation', rating)}
                        showDate={true}
                      />
                    )}

                    {/* Exercice généré */}
                    {exerciseResponses[session.sessionId] && (
                      <AIAnalysisCard
                        type="conseils"
                        title={`Conseils et exercices - ${session.name} (ID: ${session.sessionId})`}
                        content={exerciseResponses[session.sessionId].exercise}
                        childName={session.name}
                        isExpanded={expandedAnalyses[`conseils_${session.sessionId}`] || false}
                        onToggle={() => setExpandedAnalyses(prev => ({ 
                          ...prev, 
                          [`conseils_${session.sessionId}`]: !prev[`conseils_${session.sessionId}`] 
                        }))}
                        onClose={() => setExerciseResponses(prev => {
                          const newState = { ...prev }
                          delete newState[session.sessionId]
                          return newState
                        })}
                        onSave={() => saveAnalysis(session.sessionId, 'conseils', exerciseResponses[session.sessionId].exercise)}
                        onShare={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: `Conseils - ${session.name}`,
                              text: exerciseResponses[session.sessionId].exercise
                            })
                          }
                        }}
                        rating={analysisRatings[`${session.sessionId}_conseils`] || 0}
                        onRate={(rating) => rateAnalysis(session.sessionId, 'conseils', rating)}
                        showDate={true}
                      />
                    )}

                     

                    {/* Activités récentes */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Activités récentes</h4>
                      {loadingStates[session.sessionId] ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        </div>
                      ) : sessionActivities[session.sessionId] ? (
                        <div className="space-y-2">
                          {sessionActivities[session.sessionId].slice(0, 5).map((activity) => (
                            <div key={activity.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-2">
                                {getActivityIcon(activity.type)}
                                <span className="text-sm text-gray-700">{activity.title}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${getScoreColor(activity.score)}`}>
                                  {activity.score}%
                                </span>
                                <span className="text-xs text-gray-500">{activity.duration} min</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Aucune activité récente</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Aucune session enfant trouvée</p>
              </div>
            )}
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

      
      
    </div>
  )
} 

