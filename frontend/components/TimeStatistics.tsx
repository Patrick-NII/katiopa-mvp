'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Calendar, Clock, Target } from 'lucide-react'

interface TimeStatisticsProps {
  totalTimeSinceRegistration: {
    formatted: string
    ms: number
  }
  children: Array<{
    id: string
    name: string
    totalTimeMs: number
    activitiesCount: number
    averageScore?: number
  }>
  accountCreatedAt: Date
}

export default function TimeStatistics({ 
  totalTimeSinceRegistration, 
  children, 
  accountCreatedAt 
}: TimeStatisticsProps) {
  const getDaysSinceRegistration = () => {
    const now = new Date()
    const diffMs = now.getTime() - accountCreatedAt.getTime()
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
  }

  const getAverageTimePerDay = () => {
    const days = getDaysSinceRegistration()
    if (days === 0) return '0h'
    
    const hours = totalTimeSinceRegistration.ms / (1000 * 60 * 60) / days
    return `${hours.toFixed(1)}h/jour`
  }

  const getMostActiveChild = () => {
    if (children.length === 0) return null
    return children.reduce((max, child) => 
      child.totalTimeMs > max.totalTimeMs ? child : max
    )
  }

  const getTotalActivities = () => {
    return children.reduce((total, child) => total + child.activitiesCount, 0)
  }

  const getAverageScore = () => {
    const childrenWithScores = children.filter(child => child.averageScore)
    if (childrenWithScores.length === 0) return 0
    
    const totalScore = childrenWithScores.reduce((sum, child) => 
      sum + (child.averageScore || 0), 0
    )
    return Math.round(totalScore / childrenWithScores.length)
  }

  const mostActiveChild = getMostActiveChild()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Temps moyen par jour */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-green-200">
            <TrendingUp className="w-5 h-5 text-green-700" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">Moyenne/jour</h4>
            <p className="text-sm text-gray-600">Depuis l'inscription</p>
          </div>
        </div>
        <div className="text-2xl font-bold text-green-800">
          {getAverageTimePerDay()}
        </div>
      </motion.div>

      {/* Enfant le plus actif */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-purple-200">
            <Target className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">Plus actif</h4>
            <p className="text-sm text-gray-600">Temps total</p>
          </div>
        </div>
        <div className="text-lg font-bold text-purple-800">
          {mostActiveChild ? mostActiveChild.name : 'N/A'}
        </div>
        {mostActiveChild && (
          <div className="text-sm text-purple-600">
            {Math.round(mostActiveChild.totalTimeMs / (1000 * 60 * 60) * 10) / 10}h
          </div>
        )}
      </motion.div>

      {/* Total activités */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-orange-200">
            <BarChart3 className="w-5 h-5 text-orange-700" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">Activités</h4>
            <p className="text-sm text-gray-600">Total réalisées</p>
          </div>
        </div>
        <div className="text-2xl font-bold text-orange-800">
          {getTotalActivities()}
        </div>
      </motion.div>

      {/* Score moyen */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-200">
            <Calendar className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">Score moyen</h4>
            <p className="text-sm text-gray-600">Tous enfants</p>
          </div>
        </div>
        <div className="text-2xl font-bold text-blue-800">
          {getAverageScore()}%
        </div>
      </motion.div>
    </div>
  )
}
