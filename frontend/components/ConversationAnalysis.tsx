import React from 'react'
import { Brain, MessageCircle, TrendingUp, Target } from 'lucide-react'

interface ConversationAnalysisProps {
  analysis: {
    totalConversations: number
    averageEngagement: number
    favoriteTopics: Record<string, number>
    recentEngagement: Array<{
      engagement: string
      topic: string | null
      date: Date
    }>
  }
  childName: string
}

const ConversationAnalysis: React.FC<ConversationAnalysisProps> = ({ 
  analysis, 
  childName 
}) => {
  const getEngagementColor = (engagement: string) => {
    switch (engagement) {
      case 'HIGH': return 'text-green-600 bg-green-100'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100'
      case 'LOW': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getEngagementLabel = (engagement: string) => {
    switch (engagement) {
      case 'HIGH': return 'Élevé'
      case 'MEDIUM': return 'Moyen'
      case 'LOW': return 'Faible'
      default: return 'Non défini'
    }
  }

  const getEngagementIcon = (engagement: string) => {
    switch (engagement) {
      case 'HIGH': return '📈'
      case 'MEDIUM': return '📊'
      case 'LOW': return '📉'
      default: return '❓'
    }
  }

  return (
    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
      <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <Brain className="w-4 h-4 text-purple-600" />
        Analyse des Conversations avec Bubix
      </h5>

      {/* Statistiques principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-purple-800">
            {analysis.totalConversations}
          </div>
          <div className="text-xs text-purple-600">Conversations</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-800">
            {analysis.averageEngagement.toFixed(1)}/3
          </div>
          <div className="text-xs text-blue-600">Engagement moyen</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-800">
            {Object.keys(analysis.favoriteTopics).length}
          </div>
          <div className="text-xs text-green-600">Sujets explorés</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-orange-800">
            {analysis.recentEngagement.filter(e => e.engagement === 'HIGH').length}
          </div>
          <div className="text-xs text-orange-600">Engagement élevé</div>
        </div>
      </div>

      {/* Sujets préférés */}
      {Object.keys(analysis.favoriteTopics).length > 0 && (
        <div className="mb-4">
          <h6 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <Target className="w-3 h-3" />
            Sujets préférés
          </h6>
          <div className="flex flex-wrap gap-2">
            {Object.entries(analysis.favoriteTopics)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 3)
              .map(([topic, count]) => (
                <div key={topic} className="px-2 py-1 bg-white rounded-full text-xs border border-purple-200">
                  <span className="font-medium text-purple-700">{topic}</span>
                  <span className="text-gray-500 ml-1">({count})</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Engagement récent */}
      {analysis.recentEngagement.length > 0 && (
        <div>
          <h6 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Engagement récent
          </h6>
          <div className="space-y-2">
            {analysis.recentEngagement.slice(0, 3).map((engagement, index) => (
              <div key={index} className="flex items-center justify-between bg-white rounded-md p-2 border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{getEngagementIcon(engagement.engagement)}</span>
                  <span className="text-xs text-gray-600">
                    {engagement.topic || 'Général'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getEngagementColor(engagement.engagement)}`}>
                    {getEngagementLabel(engagement.engagement)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(engagement.date).toLocaleDateString('fr-FR', { 
                      day: '2-digit', 
                      month: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message si aucune conversation */}
      {analysis.totalConversations === 0 && (
        <div className="text-center text-gray-500 text-sm py-4">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p>Aucune conversation avec Bubix encore</p>
          <p className="text-xs">Les conversations seront analysées automatiquement</p>
        </div>
      )}
    </div>
  )
}

export default ConversationAnalysis
