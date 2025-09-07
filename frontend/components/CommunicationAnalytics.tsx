'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Clock, 
  Star,
  Target,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Calendar,
  Users
} from 'lucide-react'
import { useCommunicationAnalytics } from '@/hooks/useLearningCycles'

interface CommunicationAnalyticsProps {
  childSessionId: string
  childName: string
  timeRange?: number
}

export default function CommunicationAnalytics({ 
  childSessionId, 
  childName, 
  timeRange = 30 
}: CommunicationAnalyticsProps) {
  const { analytics, stats, loading, error } = useCommunicationAnalytics(childSessionId, timeRange);
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Analytics de Communication</h3>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded-xl"></div>
          <div className="h-16 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">Analytics de Communication</h3>
        </div>
        <p className="text-sm text-red-600">Erreur: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const getStyleColor = (style: string) => {
    const colors = {
      singapore: 'from-blue-500 to-blue-600',
      finland: 'from-green-500 to-green-600',
      estonia: 'from-purple-500 to-purple-600',
      reggio: 'from-pink-500 to-pink-600',
      ib: 'from-orange-500 to-orange-600'
    };
    return colors[style as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const getStyleName = (style: string) => {
    const names = {
      singapore: 'Singapour (Rigueur)',
      finland: 'Finlande (Bien-être)',
      estonia: 'Estonie (Innovation)',
      reggio: 'Reggio Emilia (Créativité)',
      ib: 'IB/IPC (Transversalité)'
    };
    return names[style as keyof typeof names] || style;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Analytics de Communication</h3>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <MessageSquare className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-900">{stats.totalMessages}</div>
          <div className="text-sm text-blue-700">Messages</div>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-900">
            {(stats.averageEffectiveness * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-green-700">Efficacité</div>
        </div>
        
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <Clock className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-900">
            {stats.averageResponseTime > 0 ? `${(stats.averageResponseTime / 1000).toFixed(1)}s` : 'N/A'}
          </div>
          <div className="text-sm text-purple-700">Temps réponse</div>
        </div>
        
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <Star className="w-6 h-6 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-orange-900">
            {stats.averageSatisfaction > 0 ? stats.averageSatisfaction.toFixed(1) : 'N/A'}
          </div>
          <div className="text-sm text-orange-700">Satisfaction</div>
        </div>
      </div>

      {/* Détails par style de communication */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-6"
        >
          {/* Styles de communication */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Efficacité par Style de Communication
            </h4>
            <div className="space-y-3">
              {Object.entries(stats.styleBreakdown).map(([style, data]: [string, any]) => (
                <div key={style} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getStyleColor(style)}`}></div>
                    <span className="font-medium text-gray-900">{getStyleName(style)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{data.count}</div>
                      <div className="text-gray-600">Messages</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-600">
                        {(data.averageEffectiveness * 100).toFixed(1)}%
                      </div>
                      <div className="text-gray-600">Efficacité</div>
                    </div>
                    {data.averageResponseTime > 0 && (
                      <div className="text-center">
                        <div className="font-semibold text-purple-600">
                          {(data.averageResponseTime / 1000).toFixed(1)}s
                        </div>
                        <div className="text-gray-600">Réponse</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modules */}
          {Object.keys(stats.moduleBreakdown).length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Efficacité par Module
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(stats.moduleBreakdown).map(([module, data]: [string, any]) => (
                  <div key={module} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{module}</span>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          {(data.averageEffectiveness * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">{data.count} interactions</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Types de messages */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              Efficacité par Type de Message
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(stats.messageTypeBreakdown).map(([messageType, data]: [string, any]) => (
                <div key={messageType} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 capitalize">{messageType}</span>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {(data.averageEffectiveness * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">{data.count} messages</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommandations */}
          {stats.recommendations && stats.recommendations.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-600" />
                Recommandations
              </h4>
              <div className="space-y-2">
                {stats.recommendations.map((recommendation: string, index: number) => (
                  <div key={index} className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <p className="text-sm text-yellow-800">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
