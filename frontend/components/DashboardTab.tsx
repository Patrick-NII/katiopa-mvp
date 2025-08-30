'use client'

import { useState } from 'react'
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
  MessageCircle,
  Send,
  Brain
} from 'lucide-react'
import AnimatedLLMButton from './AnimatedLLMButton'
import AdvancedLLMResults from './AdvancedLLMResults'
import UserStats from './UserStats'


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
  onSendChatMessage: (message: string) => void
  chatResponse: string
  chatLoading: boolean
  chatHistory?: any[]
  onLoadChatHistory?: () => void
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
  onSendChatMessage,
  chatResponse,
  chatLoading,
  chatHistory = [],
  onLoadChatHistory
}: DashboardTabProps) {
  const [chatMessage, setChatMessage] = useState('');
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-12"
    >
      

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div 
          className="bg-white p-5 rounded-xl shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <Activity size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Activités totales</h3>
              <p className="text-3xl font-bold text-gray-900">{activities?.length || 0}</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1 text-sm text-emerald-800 bg-emerald-100 px-2 py-1 rounded-full">
            <TrendingUp size={14} />
            <span className="font-medium">+15% ce mois</span>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-5 rounded-xl shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <Target size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Score moyen</h3>
              <p className="text-3xl font-bold text-gray-900">
                {summary?.averageScore ? summary.averageScore.toFixed(1) : 'N/A'}
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1 text-sm text-emerald-800 bg-emerald-100 px-2 py-1 rounded-full">
            <TrendingUp size={14} />
            <span className="font-medium">+8% cette semaine</span>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-5 rounded-xl shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              {user?.userType === 'PARENT' ? (
                <Users size={24} className="text-white" />
              ) : (
                <BarChart3 size={24} className="text-white" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">
                {user?.userType === 'PARENT' ? 'Enfants actifs' : 'Domaines actifs'}
              </h3>
              <p className="text-3xl font-bold text-gray-900">
                {user?.userType === 'PARENT' ? '2' : (summary?.domains?.length || 0)}
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1 text-sm text-indigo-800 bg-indigo-100 px-2 py-1 rounded-full">
            <Zap size={14} />
            <span className="font-medium">{user?.userType === 'PARENT' ? 'Emma & Thomas' : '3 matières'}</span>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-5 rounded-xl shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <Clock size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Temps total</h3>
              <p className="text-3xl font-bold text-gray-900">
                {summary?.totalTime || 0} min
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1 text-sm text-amber-800 bg-amber-100 px-2 py-1 rounded-full">
            <Award size={14} />
            <span className="font-medium">Niveau 3</span>
          </div>
        </motion.div>
      </div>

      {/* Section LLM avec bouton animé */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        
    
        {/* Interface unifiée : Grand input avec évaluation intégrée - MODERNE */}
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-sm">
          {/* En-tête intégré avec salutation */}
          <div className="text-center mb-10">
          
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              {user?.userType === 'PARENT' 
                ? `Bonjour ${user?.firstName} !` 
                : `Bonjour ${user?.firstName} ! 👋`
              }
            </h1>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              {user?.userType === 'PARENT' 
                ? "Suivez la progression de vos enfants et leurs performances en temps réel avec votre Assistant IA CubeAI"
                : "Découvre ton potentiel avec l'intelligence artificielle ! Ton Assistant IA Personnel est là pour t'accompagner"
              }
            </p>
          </div>
          
          
          
                      {/* Sélection de matière et bouton d'évaluation en haut */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              
              
              {/* Grand input unifié - ÉPURÉ */}
              <div className="mb-6">
                <textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder={
                    user?.userType === 'CHILD' 
                      ? "Pose ta question, demande une explication ou décris ce que tu veux apprendre... (Ex: Peux-tu m'expliquer les fractions ? Comment puis-je m'améliorer en mathématiques ?)" 
                      : "Posez votre question, demandez une analyse ou lancez une évaluation... (Ex: Comment se sent mon enfant aujourd'hui ? Analyse ses progrès en mathématiques)"
                  }
                  rows={6}
                  className="w-full px-6 py-6 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-200 resize-none text-base bg-white placeholder-gray-500"
                />
              </div>
              
              {/* Bouton d'envoi placé en dessous de l'input */}
              <div className="flex justify-center">
                <button 
                  onClick={() => onSendChatMessage(chatMessage)}
                  disabled={chatLoading || !chatMessage.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-xl transition-colors shadow-sm flex items-center gap-3 text-base disabled:cursor-not-allowed font-semibold"
                >
                  {chatLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-medium">Envoi...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span className="font-medium">Envoyer</span>
                    </>
                  )}
                </button>
              </div>

              {/* Affichage de la réponse de l'IA */}
              {chatResponse && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 p-8 bg-white rounded-2xl shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <MessageCircle size={20} className="text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Réponse de l'IA Coach</h4>
                  </div>
                  
                  <div className="text-gray-800 leading-relaxed whitespace-pre-wrap text-base">
                    {chatResponse}
                  </div>
                </motion.div>
              )}

              {/* Historique des conversations */}
              {chatHistory && chatHistory.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 p-8 bg-white rounded-2xl shadow-sm"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                        <MessageCircle size={20} className="text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Historique des Conversations</h4>
                    </div>
                    <button 
                      onClick={onLoadChatHistory}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Actualiser
                    </button>
                  </div>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {chatHistory.slice(0, 5).map((conv, index) => (
                      <div key={conv.id} className="border-l-2 border-blue-300 pl-4 py-2">
                        <div className="text-sm text-gray-500 mb-1">
                          {new Date(conv.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {conv.focus && (
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {conv.focus}
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-700 mb-1">
                          <span className="text-blue-600">Vous :</span> {conv.message}
                        </div>
                        <div className="text-sm text-gray-700">
                          <span className="text-green-600">IA :</span> {conv.response.substring(0, 100)}...
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {chatHistory.length > 5 && (
                    <div className="mt-3 text-center">
                      <span className="text-sm text-gray-500">
                        {chatHistory.length - 5} autres conversations...
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            
            {/* Aide contextuelle et raccourcis - AGRANDIS */}
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              <div className="flex items-center gap-3 text-base text-blue-700 mb-4">
                {user?.userType === 'CHILD' ? (
                  <>
                    <Brain size={18} className="text-blue-600" />
                    <span className="font-medium">💡 Raccourcis et capacités :</span>
                  </>
                ) : (
                  <>
                    <TrendingUp size={18} className="text-blue-600" />
                    <span className="font-medium">💡 Raccourcis et capacités :</span>
                  </>
                )}
              </div>
              
              {/* Grille de raccourcis - AGRANDIE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-sm text-blue-600">
                  <div className="font-medium mb-2 text-base">🎯 Questions directes :</div>
                  <div className="mb-1">• "Comment puis-je m'améliorer ?"</div>
                  <div className="mb-1">• "Explique-moi ce concept"</div>
                  <div className="mb-1">• "Quels exercices me recommandes-tu ?"</div>
                </div>
                <div className="text-sm text-blue-600">
                  <div className="font-medium mb-2 text-base">🚀 Évaluation IA :</div>
                  <div className="mb-1">• Cliquez sur "Évaluation Premium"</div>
                  <div className="mb-1">• Analyse automatique de vos progrès</div>
                  <div className="mb-1">• Recommandations personnalisées</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barre d'actions: Matière de focus + Bouton d'évaluation */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 bg-white rounded-xl px-5 py-3 shadow-sm">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Matière de focus
            </label>
            <select 
              value={focus} 
              onChange={(e) => onFocusChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm bg-white"
            >
              <option value="maths">Mathématiques</option>
              <option value="coding">Programmation</option>
              <option value="reading">Lecture</option>
              <option value="science">Sciences</option>
              <option value="ai">IA</option>
            </select>
          </div>
          <AnimatedLLMButton 
            onClick={onEvaluateLLM}
            loading={loading}
            disabled={loading}
            subscriptionType={user.subscriptionType}
            focus={focus}
            className="lg:min-w-[280px]"
          />
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          <button className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center">
              <Send size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">Nouvel exercice</div>
              <div className="text-xs text-gray-600">Générez un exercice adapté</div>
            </div>
          </button>
          <button className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">Analyser les progrès</div>
              <div className="text-xs text-gray-600">Aperçu des performances récentes</div>
            </div>
          </button>
          <button className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">Inviter un membre</div>
              <div className="text-xs text-gray-600">Ajouter un parent ou un enfant</div>
            </div>
          </button>
        </div>

        {/* Résultats LLM avancés */}
        {llmResponse && (
          <AdvancedLLMResults 
            result={llmResponse}
            subscriptionType={user.subscriptionType}
            onExerciseSelect={onExerciseSelect}
          />
        )}
      </motion.div>



      {/* Statistiques utilisateur */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <UserStats 
          activities={activities}
          memberSince={user?.createdAt}
          userId={user?.id}
        />
      </motion.div>
    </motion.div>
  )
} 
