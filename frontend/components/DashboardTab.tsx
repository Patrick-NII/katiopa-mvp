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
  summary: any[]
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
  activities,
  summary,
  llmResponse,
  loading,
  focus,
  onFocusChange,
  onEvaluateLLM,
  onExerciseSelect,
  onSendChatMessage,
  chatResponse,
  chatLoading,
  chatHistory,
  onLoadChatHistory
}: DashboardTabProps) {
  const [chatMessage, setChatMessage] = useState('');
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Activités totales</h3>
              <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <TrendingUp size={16} />
            <span>+15% ce mois</span>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Target size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Score moyen</h3>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.averageScore || 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <TrendingUp size={16} />
            <span>+8% cette semaine</span>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              {user?.userType === 'PARENT' ? (
                <Users size={24} className="text-purple-600" />
              ) : (
                <BarChart3 size={24} className="text-purple-600" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">
                {user?.userType === 'PARENT' ? 'Enfants actifs' : 'Domaines actifs'}
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {user?.userType === 'PARENT' ? '2' : (summary?.domains?.length || 0)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-purple-600">
            <Zap size={16} />
            <span>
              {user?.userType === 'PARENT' ? 'Emma & Thomas' : '3 matières'}
            </span>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock size={24} className="text-orange-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Temps total</h3>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.totalTime || 0} min
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-orange-600">
            <Award size={16} />
            <span>Niveau 3</span>
          </div>
        </motion.div>
      </div>

      {/* Section LLM avec bouton animé */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        
    
        {/* Interface unifiée : Grand input avec évaluation intégrée - AGRANDIE */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-10 mb-8 shadow-xl">
          {/* En-tête intégré avec salutation */}
          <div className="text-center mb-8">
          
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              {user?.userType === 'PARENT' 
                ? `Bonjour ${user?.firstName} ! ` 
                : `Bonjour ${user?.firstName} ! 👋`
              }
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {user?.userType === 'PARENT' 
                ? "Suivez la progression de vos enfants et leurs performances en temps réel avec votre Assistant IA Katiopa"
                : "Découvre ton potentiel avec l'intelligence artificielle ! Ton Assistant IA Personnel est là pour t'accompagner"
              }
            </p>
          </div>
          
          
          
                      {/* Sélection de matière et bouton d'évaluation en haut */}
            <div className="bg-white rounded-xl p-8 border border-blue-100 shadow-lg">
              
              
              {/* Grand input unifié - AGRANDI */}
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
                  className="w-full px-6 py-6 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all duration-200 resize-none text-lg"
                />
              </div>
              
              {/* Bouton d'envoi placé en dessous de l'input */}
              <div className="flex justify-center">
                <button 
                  onClick={() => onSendChatMessage(chatMessage)}
                  disabled={chatLoading || !chatMessage.trim()}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-12 py-4 rounded-lg transition-all duration-300 hover:scale-105 disabled:scale-100 shadow-md flex items-center gap-3 text-lg disabled:cursor-not-allowed"
                >
                  {chatLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-medium">Envoi...</span>
                    </>
                  ) : (
                    <>
                      <Send size={20} />
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
                  className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                        <MessageCircle size={16} className="text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Réponse de l'IA Coach</h4>
                    </div>
                    
                    {/* Badge RAG avancé */}
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-600 text-white text-xs font-medium rounded-full flex items-center gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        RAG Avancé
                      </div>
                      <div className="text-xs text-gray-500">
                        IA enrichie
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {chatResponse}
                  </div>
                  
                  {/* Informations RAG */}
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                      <span>Cette réponse a été enrichie avec l'historique des conversations et les connaissances de Katiopa</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Historique des conversations */}
              {chatHistory && chatHistory.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-6 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <MessageCircle size={16} className="text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Historique des Conversations</h4>
                    </div>
                    <button 
                      onClick={onLoadChatHistory}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Actualiser
                    </button>
                  </div>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {chatHistory.slice(0, 5).map((conv, index) => (
                      <div key={conv.id} className="border-l-4 border-blue-200 pl-4 py-2">
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
                        <div className="text-sm text-gray-600">
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
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
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

        {/* Ligne supérieure : Matière de focus + Bouton d'évaluation */}
        <div className="flex items-center justify-between gap-6 mb-6">
                <div className="flex items-center gap-6">
                  <label className="text-base font-medium text-gray-700 whitespace-nowrap">
                    Matière de focus :
                  </label>
                  <select 
                    value={focus} 
                    onChange={(e) => onFocusChange(e.target.value)}
                    className="px-6 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 text-base bg-gray-50"
                  >
                    <option value="maths">Mathématiques</option>
                    <option value="coding">Programmation</option>
                    <option value="reading">Lecture</option>
                    <option value="science">Sciences</option>
                    <option value="ai">IA</option>
                  </select>
                </div>
                
                {/* Bouton d'évaluation IA placé à droite */}
                <AnimatedLLMButton 
                  onClick={onEvaluateLLM}
                  loading={loading}
                  disabled={loading}
                  subscriptionType={user.subscriptionType}
                  focus={focus}
                  className=""
                />
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