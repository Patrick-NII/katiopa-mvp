'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  Tag, 
  Heart, 
  MessageSquare, 
  Trash2, 
  Edit3,
  Download,
  Eye,
  ChevronDown,
  Star
} from 'lucide-react'
import { useSavedReports } from '../../../hooks/useSavedReports'
import { useRouter } from 'next/navigation'

export default function SavedReportsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedChild, setSelectedChild] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'child'>('date')
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set())

  const {
    reports,
    loading,
    error,
    total,
    hasMore,
    tags,
    loadReports,
    loadMoreReports,
    deleteReport,
    updateReport
  } = useSavedReports({ autoLoad: true })

  // Filtrer les rapports
  const filteredReports = reports.filter(report => {
    const matchesSearch = !searchTerm || 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.analysis?.analysis.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesChild = !selectedChild || report.childId === selectedChild

    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => report.tags.includes(tag))

    const matchesFavorites = !showFavoritesOnly || report.isFavorite

    return matchesSearch && matchesChild && matchesTags && matchesFavorites
  })

  // Trier les rapports
  const sortedReports = [...filteredReports].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'child':
        return a.childId.localeCompare(b.childId)
      case 'date':
      default:
        return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    }
  })

  // Basculer l'expansion d'un rapport
  const toggleExpanded = (reportId: string) => {
    const newExpanded = new Set(expandedReports)
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId)
    } else {
      newExpanded.add(reportId)
    }
    setExpandedReports(newExpanded)
  }

  // Basculer le favori
  const toggleFavorite = async (report: any) => {
    try {
      await updateReport(report.id, { isFavorite: !report.isFavorite })
    } catch (error) {
      console.error('Erreur toggle favorite:', error)
    }
  }

  // Supprimer un rapport
  const handleDelete = async (report: any) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le rapport "${report.title}" ?`)) {
      try {
        await deleteReport(report.id)
      } catch (error) {
        console.error('Erreur suppression:', error)
      }
    }
  }

  // Discuter avec Bubix
  const handleTalkWithBubix = (report: any) => {
    const contextData = {
      analysisId: report.analysisId,
      competence: report.analysis?.competence || 'Compétence',
      childName: report.analysis?.metadata?.childName || 'Enfant',
      analysis: report.analysis?.analysis || '',
      savedReport: {
        title: report.title,
        notes: report.notes,
        tags: report.tags
      }
    }

    const encodedContext = encodeURIComponent(JSON.stringify(contextData))
    router.push(`/dashboard/bubix?context=${encodedContext}`)
  }

  // Obtenir les enfants uniques
  const uniqueChildren = [...new Set(reports.map(r => r.childId))]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Mes Rapports Sauvegardés
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Retrouvez tous vos rapports pédagogiques Bubix sauvegardés et organisez-les selon vos besoins.
          </p>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher dans les rapports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Filtre par enfant */}
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tous les enfants</option>
              {uniqueChildren.map(childId => (
                <option key={childId} value={childId}>
                  {reports.find(r => r.childId === childId)?.analysis?.metadata?.childName || childId}
                </option>
              ))}
            </select>

            {/* Filtre par tags */}
            <select
              value=""
              onChange={(e) => {
                const tag = e.target.value
                if (tag && !selectedTags.includes(tag)) {
                  setSelectedTags([...selectedTags, tag])
                }
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Ajouter un tag...</option>
              {tags.filter(tag => !selectedTags.includes(tag)).map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>

            {/* Tri */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="date">Trier par date</option>
              <option value="title">Trier par titre</option>
              <option value="child">Trier par enfant</option>
            </select>
          </div>

          {/* Tags sélectionnés et favoris */}
          <div className="flex items-center gap-4 mt-4">
            {selectedTags.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tags:</span>
                {selectedTags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full text-xs"
                  >
                    {tag}
                    <button
                      onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                      className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${
                showFavoritesOnly
                  ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              Favoris uniquement
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
                <p className="text-gray-600 dark:text-gray-400">Rapports sauvegardés</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reports.filter(r => r.isFavorite).length}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Favoris</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <Tag className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{tags.length}</p>
                <p className="text-gray-600 dark:text-gray-400">Tags utilisés</p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des rapports */}
        {loading && reports.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : sortedReports.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Aucun rapport trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {reports.length === 0 
                ? "Vous n'avez pas encore sauvegardé de rapports."
                : "Aucun rapport ne correspond à vos critères de recherche."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedReports.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
              >
                {/* Header du rapport */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {report.title}
                        </h3>
                        {report.isFavorite && (
                          <Star className="w-5 h-5 text-yellow-500 fill-current" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(report.savedAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                        <span>
                          {report.analysis?.metadata?.childName || 'Enfant'}
                        </span>
                        <span>
                          {report.analysis?.competence || 'Compétence'}
                        </span>
                      </div>

                      {report.tags.length > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          {report.tags.map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {report.notes && (
                        <p className="text-gray-700 dark:text-gray-300 text-sm italic">
                          "{report.notes}"
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => toggleFavorite(report)}
                        className={`p-2 rounded-lg transition-colors ${
                          report.isFavorite
                            ? 'text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/20'
                            : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        title={report.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      >
                        <Heart className={`w-4 h-4 ${report.isFavorite ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        onClick={() => handleTalkWithBubix(report)}
                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
                        title="Discuter avec Bubix"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => toggleExpanded(report.id)}
                        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title={expandedReports.has(report.id) ? 'Réduire' : 'Voir le rapport complet'}
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${
                          expandedReports.has(report.id) ? 'rotate-180' : ''
                        }`} />
                      </button>

                      <button
                        onClick={() => handleDelete(report)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Contenu du rapport (expandable) */}
                {expandedReports.has(report.id) && report.analysis && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-6 bg-gray-50 dark:bg-gray-900/50"
                  >
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {report.analysis.analysis}
                      </div>
                    </div>

                    {report.analysis.metadata && (
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <span>Score: {report.analysis.metadata.score}/10</span>
                        <span>Niveau: {report.analysis.metadata.level}</span>
                        <span>
                          Généré le {new Date(report.analysis.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}

            {/* Bouton Charger plus */}
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={loadMoreReports}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Chargement...' : 'Charger plus de rapports'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
