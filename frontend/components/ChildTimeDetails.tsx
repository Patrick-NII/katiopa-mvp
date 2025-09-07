'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { User, Clock, TrendingUp, Calendar, Activity, Users } from 'lucide-react'

interface ChildTimeDetailsProps {
  children: Array<{
    id: string
    name: string
    emoji: string
    totalTime: string
    totalTimeMs: number
    lastActivity: Date
    isOnline: boolean
    activitiesCount: number
    averageScore?: number
  }>
}

export default function ChildTimeDetails({ children }: ChildTimeDetailsProps) {
  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes}min`
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`
    if (diffHours > 0) return `Il y a ${diffHours}h`
    if (diffMinutes > 0) return `Il y a ${diffMinutes}min`
    return 'À l\'instant'
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-blue-600" />
        <h4 className="text-lg font-semibold text-gray-800">Détails par enfant</h4>
      </div>

      {children.map((child, index) => (
        <motion.div
          key={child.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{child.emoji}</div>
              <div>
                <h5 className="font-semibold text-gray-800">{child.name}</h5>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(child.totalTimeMs)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    <span>{child.activitiesCount} activités</span>
                  </div>
                  {child.averageScore && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>{child.averageScore}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                child.isOnline 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  child.isOnline ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                {child.isOnline ? 'En ligne' : 'Hors ligne'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {getTimeAgo(child.lastActivity)}
              </div>
            </div>
          </div>

          {/* Barre de progression du temps */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Temps d'apprentissage</span>
              <span>{formatDuration(child.totalTimeMs)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ 
                  width: `${Math.min((child.totalTimeMs / (1000 * 60 * 60)) * 10, 100)}%` 
                }}
                transition={{ duration: 1, delay: index * 0.2 }}
              />
            </div>
          </div>
        </motion.div>
      ))}

      {children.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-sm">Aucun enfant trouvé</p>
        </div>
      )}
    </div>
  )
}
