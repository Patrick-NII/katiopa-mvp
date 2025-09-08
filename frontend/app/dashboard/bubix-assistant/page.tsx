'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageCircle, 
  Brain, 
  Sparkles, 
  Users, 
  TrendingUp,
  Calendar,
  Target,
  Zap,
  ChevronRight,
  Send,
  Mic,
  MicOff,
  Settings,
  History,
  Star,
  Filter
} from 'lucide-react'
import BubixTab from '../../../components/BubixTab'

interface BubixAssistantPageProps {
  user: any
  userType: 'CHILD' | 'PARENT'
  childSessions: any[]
}

export default function BubixAssistantPage({ 
  user, 
  userType, 
  childSessions 
}: BubixAssistantPageProps) {
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'chat' | 'analytics' | 'recommendations'>('chat')
  const [isRecording, setIsRecording] = useState(false)

  const isChild = userType === 'CHILD'

  // Statistiques Bubix
  const bubixStats = {
    totalConversations: 0,
    averageResponseTime: 0,
    satisfactionRate: 0,
    recommendationsGiven: 0
  }

  const recentConversations = [
    {
      id: '1',
      childName: 'Emma',
      lastMessage: 'Comment améliorer mes maths ?',
      timestamp: new Date(),
      satisfaction: 5
    },
    {
      id: '2',
      childName: 'Lucas',
      lastMessage: 'Je veux apprendre la programmation',
      timestamp: new Date(Date.now() - 3600000),
      satisfaction: 4
    }
  ]

  const recommendations = [
    {
      id: '1',
      type: 'learning',
      title: 'Renforcer les bases en mathématiques',
      description: 'Focus sur les additions et soustractions',
      priority: 'high',
      childName: 'Emma'
    },
    {
      id: '2',
      type: 'motivation',
      title: 'Encourager la créativité',
      description: 'Proposer des activités artistiques',
      priority: 'medium',
      childName: 'Lucas'
    }
  ]

  const handleStartRecording = () => {
    setIsRecording(true)
    // Ici on implémenterait l'enregistrement vocal
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    // Ici on traiterait l'audio enregistré
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bubix Assistant IA
          </h1>
        </div>
        <p className="text-gray-600">
          {isChild 
            ? "Votre assistant personnel pour l'apprentissage" 
            : "Assistant IA pour le suivi pédagogique de vos enfants"
          }
        </p>
      </motion.div>

      {/* Statistiques Bubix */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversations</p>
              <p className="text-2xl font-bold text-blue-600">{bubixStats.totalConversations}</p>
            </div>
            <MessageCircle className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Temps de réponse</p>
              <p className="text-2xl font-bold text-green-600">{bubixStats.averageResponseTime}s</p>
            </div>
            <Zap className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Satisfaction</p>
              <p className="text-2xl font-bold text-purple-600">{bubixStats.satisfactionRate}%</p>
            </div>
            <Star className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recommandations</p>
              <p className="text-2xl font-bold text-orange-600">{bubixStats.recommendationsGiven}</p>
            </div>
            <Target className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </motion.div>

      {/* Onglets de navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
      >
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'chat' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <MessageCircle className="w-4 h-4 inline mr-2" />
            Chat
          </button>
          
          {!isChild && (
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'analytics' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Analytics
            </button>
          )}
          
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'recommendations' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Target className="w-4 h-4 inline mr-2" />
            Recommandations
          </button>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            {/* Sélection d'enfant pour les parents */}
            {!isChild && childSessions && childSessions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Sélectionner un enfant pour la conversation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {childSessions.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChild(child.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        selectedChild === child.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {child.firstName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {child.firstName} {child.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {child.age ? `${child.age} ans` : 'Âge non spécifié'}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Interface de chat */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Brain className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Bubix</h4>
                  <p className="text-sm text-gray-600">
                    {isChild 
                      ? "Votre assistant personnel" 
                      : selectedChild 
                        ? `Assistant pour ${childSessions?.find(c => c.id === selectedChild)?.firstName}`
                        : "Sélectionnez un enfant pour commencer"
                    }
                  </p>
                </div>
              </div>
              
              {/* Zone de conversation */}
              <div className="bg-white rounded-lg p-4 mb-4 min-h-[300px] border border-gray-200">
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>
                    {isChild 
                      ? "Bonjour ! Comment puis-je vous aider aujourd'hui ?" 
                      : selectedChild 
                        ? `Prêt à discuter avec Bubix pour ${childSessions?.find(c => c.id === selectedChild)?.firstName}`
                        : "Sélectionnez un enfant pour commencer la conversation"
                    }
                  </p>
                </div>
              </div>
              
              {/* Zone de saisie */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={isChild ? "Tapez votre message..." : "Tapez votre message pour l'enfant..."}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!isChild && !selectedChild}
                />
                
                <button
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    isRecording 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  disabled={!isChild && !selectedChild}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                
                <button
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={!isChild && !selectedChild}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && !isChild && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Analytics des Conversations
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Conversations récentes</h4>
                <div className="space-y-3">
                  {recentConversations.map((conv) => (
                    <div key={conv.id} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{conv.childName}</span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${
                                i < conv.satisfaction ? 'text-yellow-400' : 'text-gray-300'
                              }`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{conv.lastMessage}</p>
                      <p className="text-xs text-gray-500">
                        {conv.timestamp.toLocaleDateString()} à {conv.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Métriques clés</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Temps de réponse moyen</span>
                    <span className="font-semibold">2.3s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Satisfaction moyenne</span>
                    <span className="font-semibold">4.2/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conversations/jour</span>
                    <span className="font-semibold">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Recommandations données</span>
                    <span className="font-semibold">8</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recommandations Personnalisées
            </h3>
            
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div key={rec.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                      <p className="text-sm text-gray-600">{rec.description}</p>
                      {!isChild && (
                        <p className="text-xs text-gray-500 mt-1">Pour: {rec.childName}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rec.priority === 'high' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {rec.priority === 'high' ? 'Priorité haute' : 'Priorité moyenne'}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <button className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      Appliquer
                    </button>
                    <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm">
                      Plus tard
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Interface Bubix complète pour les cas complexes */}
      {isChild && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <BubixTab 
            user={user}
            childSessions={[]}
            userType={userType}
            subscriptionType={user.subscriptionType}
          />
        </motion.div>
      )}
    </div>
  )
}
