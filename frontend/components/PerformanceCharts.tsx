'use client'
import { useState, useEffect } from 'react'

interface PerformanceChartsProps {
  userId: string
  memberSince: string
  activities: Array<{
    id: string
    domain: string
    nodeKey: string
    score: number
    attempts: number
    durationMs: number
    createdAt: string
  }>
}

type Granularity = 'day' | 'week' | 'month' | 'quarter' | 'year'

export default function PerformanceCharts({ userId, memberSince, activities }: PerformanceChartsProps) {
  const [selectedGranularity, setSelectedGranularity] = useState<Granularity>('month')
  const [selectedDomain, setSelectedDomain] = useState<string>('all')

  // Obtenir les domaines uniques
  const domains = ['all', ...Array.from(new Set(activities.map(a => a.domain)))]

  // Filtrer les activités par domaine
  const filteredActivities = selectedDomain === 'all' 
    ? activities 
    : activities.filter(a => a.domain === selectedDomain)

  // Grouper les données par granularité
  const groupDataByGranularity = () => {
    const grouped: { [key: string]: any[] } = {}
    
    filteredActivities.forEach(activity => {
      const date = new Date(activity.createdAt)
      let key = ''
      
      switch (selectedGranularity) {
        case 'day':
          key = date.toISOString().split('T')[0]
          break
        case 'week':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1
          key = `${date.getFullYear()}-Q${quarter}`
          break
        case 'year':
          key = date.getFullYear().toString()
          break
      }
      
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(activity)
    })
    
    return grouped
  }

  // Calculer les statistiques par période
  const calculatePeriodStats = (activities: any[]) => {
    if (activities.length === 0) return { avgScore: 0, totalTime: 0, count: 0 }
    
    const totalScore = activities.reduce((sum, a) => sum + a.score, 0)
    const totalTime = activities.reduce((sum, a) => sum + a.durationMs, 0)
    
    return {
      avgScore: Math.round(totalScore / activities.length),
      totalTime: Math.round(totalTime / 60000), // en minutes
      count: activities.length
    }
  }

  // Préparer les données pour les graphiques
  const chartData = () => {
    const grouped = groupDataByGranularity()
    const sortedKeys = Object.keys(grouped).sort()
    
    return sortedKeys.map(key => {
      const stats = calculatePeriodStats(grouped[key])
      return {
        period: key,
        ...stats
      }
    })
  }

  // Données pour le graphique en ligne (scores)
  const lineChartData = chartData()
  
  // Données pour le camembert (répartition par domaine)
  const pieChartData = domains.filter(d => d !== 'all').map(domain => {
    const domainActivities = activities.filter(a => a.domain === domain)
    const total = domainActivities.reduce((sum, a) => sum + a.score, 0)
    const count = domainActivities.length
    
    return {
      domain,
      total,
      count,
      percentage: activities.length > 0 ? Math.round((count / activities.length) * 100) : 0
    }
  })

  // Données pour l'histogramme (distribution des scores)
  const histogramData = () => {
    const scoreRanges = [
      { min: 0, max: 20, label: '0-20%' },
      { min: 21, max: 40, label: '21-40%' },
      { min: 41, max: 60, label: '41-60%' },
      { min: 61, max: 80, label: '61-80%' },
      { min: 81, max: 100, label: '81-100%' }
    ]
    
    return scoreRanges.map(range => {
      const count = filteredActivities.filter(a => 
        a.score >= range.min && a.score <= range.max
      ).length
      
      return {
        range: range.label,
        count,
        percentage: filteredActivities.length > 0 ? Math.round((count / filteredActivities.length) * 100) : 0
      }
    })
  }

  const histogramChartData = histogramData()

  return (
    <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">Graphiques de performance</h3>
        <div className="flex items-center space-x-4">
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {domains.map(domain => (
              <option key={domain} value={domain}>
                {domain === 'all' ? 'Tous les domaines' : domain}
              </option>
            ))}
          </select>
          <select
            value={selectedGranularity}
            onChange={(e) => setSelectedGranularity(e.target.value as Granularity)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="day">Jour</option>
            <option value="week">Semaine</option>
            <option value="month">Mois</option>
            <option value="quarter">Trimestre</option>
            <option value="year">Année</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Graphique en ligne - Évolution des scores */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Évolution des scores</h4>
          <div className="space-y-3">
            {lineChartData.map((data, index) => (
              <div key={data.period} className="flex items-center space-x-4">
                <div className="w-20 text-sm text-gray-600">{data.period}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${data.avgScore}%` }}
                  ></div>
                </div>
                <div className="w-16 text-right text-sm font-medium text-gray-900">
                  {data.avgScore}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Graphique camembert - Répartition par domaine */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Répartition par domaine</h4>
          <div className="space-y-3">
            {pieChartData.map((data) => (
              <div key={data.domain} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {data.domain}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">{data.count} activités</div>
                  <div className="text-xs text-gray-500">{data.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Histogramme - Distribution des scores */}
        <div className="bg-gray-50 p-6 rounded-lg lg:col-span-2">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Distribution des scores</h4>
          <div className="grid grid-cols-5 gap-4">
            {histogramChartData.map((data) => (
              <div key={data.range} className="text-center">
                <div className="bg-blue-100 rounded-lg p-3 mb-2">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{data.count}</div>
                  <div className="text-xs text-blue-700">{data.range}</div>
                </div>
                <div className="text-xs text-gray-500">{data.percentage}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistiques de progression */}
        <div className="bg-gray-50 p-6 rounded-lg lg:col-span-2">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Statistiques de progression</h4>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {activities.length}
              </div>
              <div className="text-sm text-gray-600">Total activités</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {activities.length > 0 ? Math.round(activities.reduce((sum, a) => sum + a.score, 0) / activities.length) : 0}%
              </div>
              <div className="text-sm text-gray-600">Score moyen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {Math.round(activities.reduce((sum, a) => sum + a.durationMs, 0) / 60000)}
              </div>
              <div className="text-sm text-gray-600">Temps total (min)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {Math.round(activities.reduce((sum, a) => sum + a.attempts, 0) / activities.length || 0)}
              </div>
              <div className="text-sm text-gray-600">Tentatives moy.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 