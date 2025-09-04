'use client'

import { useState, useEffect } from 'react'
import { Bookmark, Calendar, Star, Filter, Search, Trash2, Eye, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Icônes SVG de Flaticon
const FlaticonIcons = {
  compte_rendu: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
    </svg>
  ),
  appreciation: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  conseils: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  )
}

interface SavedAnalysis {
  id: string
  title: string
  content: string
  childName: string
  type: 'compte_rendu' | 'appreciation' | 'conseils'
  savedAt: Date
  rating: number
  tags: string[]
}

interface SavedAnalysesProps {
  childName: string
  onViewAnalysis: (analysis: SavedAnalysis) => void
  onDeleteAnalysis: (id: string) => void
}

export default function SavedAnalyses({ childName, onViewAnalysis, onDeleteAnalysis }: SavedAnalysesProps) {
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([])
  const [filter, setFilter] = useState<'all' | 'compte_rendu' | 'appreciation' | 'conseils'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'title'>('date')
  const [actionStates, setActionStates] = useState<Record<string, { viewed?: boolean; downloaded?: boolean; deleted?: boolean }>>({})

  // Charger les analyses sauvegardées depuis localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = JSON.parse(localStorage.getItem('savedAnalyses') || '[]');
      // Valider et nettoyer les données
      const validatedAnalyses = saved.map((analysis: any) => ({
        id: analysis.id || `analysis_${Date.now()}`,
        title: analysis.title || 'Analyse sans titre',
        content: analysis.content || '',
        childName: analysis.childName || childName,
        type: analysis.type || 'compte_rendu',
        savedAt: analysis.savedAt ? new Date(analysis.savedAt) : new Date(),
        rating: analysis.rating || 0,
        tags: Array.isArray(analysis.tags) ? analysis.tags : []
      }));
      setSavedAnalyses(validatedAnalyses);
    } catch (error) {
      console.error('Erreur lors du chargement des analyses sauvegardées:', error);
      setSavedAnalyses([]);
    }
  }, [childName]);

  const filteredAnalyses = savedAnalyses
    .filter(analysis => filter === 'all' || analysis.type === filter)
    .filter(analysis => {
      const title = analysis.title || '';
      const content = analysis.content || '';
      const tags = analysis.tags || [];
      const searchLower = searchTerm.toLowerCase();
      
      return title.toLowerCase().includes(searchLower) ||
             content.toLowerCase().includes(searchLower) ||
             tags.some(tag => (tag || '').toLowerCase().includes(searchLower));
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return (b.savedAt?.getTime() || 0) - (a.savedAt?.getTime() || 0)
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'title':
          return (a.title || '').localeCompare(b.title || '')
        default:
          return 0
      }
    })

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'compte_rendu':
        return 'bg-blue-100 text-blue-800'
      case 'appreciation':
        return 'bg-purple-100 text-purple-800'
      case 'conseils':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'compte_rendu':
        return FlaticonIcons.compte_rendu
      case 'appreciation':
        return FlaticonIcons.appreciation
      case 'conseils':
        return FlaticonIcons.conseils
      default:
        return FlaticonIcons.compte_rendu
    }
  }

  const handleViewAnalysis = (analysis: SavedAnalysis) => {
    onViewAnalysis(analysis);
    setActionStates(prev => ({ ...prev, [analysis.id]: { ...prev[analysis.id], viewed: true } }));
    setTimeout(() => {
      setActionStates(prev => ({ ...prev, [analysis.id]: { ...prev[analysis.id], viewed: false } }));
    }, 2000);
  };

  const handleDownloadAnalysis = (analysis: SavedAnalysis) => {
    const blob = new Blob([analysis.content || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = analysis.savedAt ? analysis.savedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    a.download = `${analysis.title || 'analyse'}_${date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setActionStates(prev => ({ ...prev, [analysis.id]: { ...prev[analysis.id], downloaded: true } }));
    setTimeout(() => {
      setActionStates(prev => ({ ...prev, [analysis.id]: { ...prev[analysis.id], downloaded: false } }));
    }, 2000);
  };

  const handleDeleteAnalysis = (id: string) => {
    onDeleteAnalysis(id);
    setActionStates(prev => ({ ...prev, [id]: { ...prev[id], deleted: true } }));
    setTimeout(() => {
      setActionStates(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }, 2000);
  };

  const getTypeBackground = (type: string) => {
    switch (type) {
      case 'compte_rendu':
        return 'bg-blue-100 border-blue-200'
      case 'appreciation':
        return 'bg-purple-100 border-purple-200'
      case 'conseils':
        return 'bg-green-100 border-green-200'
      default:
        return 'bg-gray-100 border-gray-200'
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
     

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher dans les analyses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filtre par type */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Tous les types</option>
          <option value="compte_rendu">Compte rendu</option>
          <option value="appreciation">Appréciation</option>
          <option value="conseils">Conseils</option>
        </select>

        {/* Tri */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="date">Trier par date</option>
          <option value="rating">Trier par note</option>
          <option value="title">Trier par titre</option>
        </select>
      </div>

      {/* Liste des analyses */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredAnalyses.map((analysis) => (
            <motion.div
              key={analysis.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex">
                {/* Bande colorée avec icône Flaticon */}
                <div className={`w-20 flex items-center justify-center ${getTypeBackground(analysis.type)}`}>
                  <div className="text-blue-600">
                    {getTypeIcon(analysis.type)}
                  </div>
                </div>
                
                {/* Contenu principal */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">{analysis.title}</h4>
                      
                      {/* Informations de l'enfant */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-blue-600">
                          {analysis.childName}
                        </span>
                        <span className="text-xs text-gray-500">
                          ID: {analysis.id.split('_')[0]}
                        </span>
                      </div>
                      
                      {/* Type et date */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(analysis.type)}`}>
                          {analysis.type === 'compte_rendu' ? 'Compte rendu' : 
                           analysis.type === 'appreciation' ? 'Appréciation' : 'Conseils'}
                        </span>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {analysis.savedAt ? analysis.savedAt.toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')} à {analysis.savedAt ? analysis.savedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Contenu prévisualisé */}
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {analysis.content || 'Aucun contenu disponible'}
                      </p>

                      {/* Tags et note */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {(analysis.tags || []).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{analysis.rating || 0}/5</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleViewAnalysis(analysis)}
                        className={`p-2 rounded-lg transition-colors ${actionStates[analysis.id]?.viewed ? 'bg-blue-100 text-blue-600' : 'text-blue-600 hover:bg-blue-50'}`}
                        title={actionStates[analysis.id]?.viewed ? "Document consulté !" : "Voir l'analyse complète"}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadAnalysis(analysis)}
                        className={`p-2 rounded-lg transition-colors ${actionStates[analysis.id]?.downloaded ? 'bg-green-100 text-green-600' : 'text-green-600 hover:bg-green-50'}`}
                        title={actionStates[analysis.id]?.downloaded ? "Téléchargé !" : "Télécharger"}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAnalysis(analysis.id)}
                        className={`p-2 rounded-lg transition-colors ${actionStates[analysis.id]?.deleted ? 'bg-red-100 text-red-600' : 'text-red-600 hover:bg-red-50'}`}
                        title={actionStates[analysis.id]?.deleted ? "Supprimé !" : "Supprimer"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Message si aucune analyse */}
        {filteredAnalyses.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filter !== 'all' ? 'Aucune analyse trouvée' : 'Aucune analyse sauvegardée'}
            </h4>
            <p className="text-gray-500">
              {searchTerm || filter !== 'all' 
                ? 'Essayez de modifier vos critères de recherche' 
                : 'Sauvegardez vos premières analyses pour les retrouver ici'
              }
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
