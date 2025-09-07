'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Calendar, User, X } from 'lucide-react'

interface AnalysisFiltersProps {
  onFiltersChange: (filters: {
    search: string
    childFilter: string
    dateFilter: string
    typeFilter: string
  }) => void
  children: string[]
  onClearFilters: () => void
}

export default function AnalysisFilters({ 
  onFiltersChange, 
  children, 
  onClearFilters 
}: AnalysisFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    childFilter: '',
    dateFilter: '',
    typeFilter: ''
  })

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    const clearedFilters = {
      search: '',
      childFilter: '',
      dateFilter: '',
      typeFilter: ''
    }
    setFilters(clearedFilters)
    onFiltersChange(clearedFilters)
    onClearFilters()
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  return (
    <div className="mb-4">
      {/* Barre de recherche principale */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher dans les analyses..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
        
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            isExpanded || hasActiveFilters
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtres</span>
          {hasActiveFilters && (
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          )}
        </motion.button>
      </div>

      {/* Panneau de filtres étendu */}
      <motion.div
        initial={false}
        animate={{ 
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtre par enfant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Enfant
              </label>
              <select
                value={filters.childFilter}
                onChange={(e) => handleFilterChange('childFilter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Tous les enfants</option>
                {children.map((child) => (
                  <option key={child} value={child}>
                    {child}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Période
              </label>
              <select
                value={filters.dateFilter}
                onChange={(e) => handleFilterChange('dateFilter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="quarter">Ce trimestre</option>
                <option value="year">Cette année</option>
              </select>
            </div>

            {/* Filtre par type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type d'analyse
              </label>
              <select
                value={filters.typeFilter}
                onChange={(e) => handleFilterChange('typeFilter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Tous les types</option>
                <option value="compte_rendu">Compte rendu</option>
                <option value="appreciation">Appréciation</option>
                <option value="conseils">Conseils</option>
                <option value="vigilance">Vigilance</option>
              </select>
            </div>
          </div>

          {/* Bouton pour effacer les filtres */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <motion.button
                onClick={clearAllFilters}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-4 h-4" />
                Effacer tous les filtres
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
