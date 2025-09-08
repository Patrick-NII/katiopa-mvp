'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  UserPlus, 
  Settings, 
  Eye, 
  Edit, 
  Trash2,
  Calendar,
  TrendingUp,
  Award,
  Clock,
  ChevronRight,
  Plus,
  Search,
  Filter
} from 'lucide-react'
import WeeklyCycle from '../../../components/WeeklyCycle'
import CommunicationAnalytics from '../../../components/CommunicationAnalytics'

interface FamilyPageProps {
  user: any
  childSessions: any[]
}

export default function FamilyPage({ user, childSessions }: FamilyPageProps) {
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [showAddChild, setShowAddChild] = useState(false)

  // Statistiques familiales
  const familyStats = {
    totalChildren: childSessions?.length || 0,
    activeChildren: childSessions?.filter(child => child.isActive !== false).length || 0,
    totalTime: 0,
    averageScore: 0,
    weeklyProgress: 0
  }

  // Filtrer les enfants selon les critères
  const filteredChildren = childSessions?.filter(child => {
    const matchesSearch = `${child.firstName} ${child.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'active' && child.isActive !== false) ||
      (filterStatus === 'inactive' && child.isActive === false)
    
    return matchesSearch && matchesFilter
  })

  const handleAddChild = () => {
    setShowAddChild(true)
    // Ici on pourrait ouvrir un modal ou rediriger vers une page d'ajout
  }

  const handleEditChild = (childId: string) => {
    // Ici on pourrait ouvrir un modal d'édition ou rediriger
    console.log('Éditer enfant:', childId)
  }

  const handleViewChild = (childId: string) => {
    setSelectedChild(childId)
  }

  return (
    <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
      <div className="h-full overflow-y-auto p-4 md:p-5 lg:p-6">
        <div className="space-y-6">
          {/* En-tête */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Gestion Familiale 👨‍👩‍👧‍👦
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Suivez et gérez les comptes de vos enfants
              </p>
            </div>
            
            <button
              onClick={handleAddChild}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Ajouter un enfant
            </button>
          </motion.div>

          {/* Statistiques familiales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total enfants</p>
              <p className="text-2xl font-bold text-blue-600">{familyStats.totalChildren}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Actifs</p>
              <p className="text-2xl font-bold text-green-600">{familyStats.activeChildren}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Temps total</p>
              <p className="text-2xl font-bold text-purple-600">{familyStats.totalTime}h</p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Score moyen</p>
              <p className="text-2xl font-bold text-orange-600">{familyStats.averageScore}%</p>
            </div>
            <Award className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </motion.div>

      {/* Barre de recherche et filtres */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un enfant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les enfants</option>
            <option value="active">Enfants actifs</option>
            <option value="inactive">Enfants inactifs</option>
          </select>
        </div>
      </motion.div>

      {/* Liste des enfants */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <h3 className="text-xl font-semibold text-gray-900">
          Mes Enfants ({filteredChildren.length})
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChildren.map((child, index) => (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {child.firstName?.charAt(0) || '?'}{child.lastName?.charAt(0) || '?'}
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
                
                <div className="flex gap-1">
                  <button
                    onClick={() => handleViewChild(child.id)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Voir les détails"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditChild(child.id)}
                    className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Dernière activité</span>
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Statut</span>
                  <span className={`font-medium ${
                    child.isActive !== false ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {child.isActive !== false ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Progression</span>
                  <span className="font-medium">75%</span>
                </div>
              </div>
              
              <button
                onClick={() => handleViewChild(child.id)}
                className="w-full py-2 px-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
              >
                <ChevronRight className="w-4 h-4" />
                Voir les détails
              </button>
            </motion.div>
          ))}
        </div>
        
        {filteredChildren.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun enfant trouvé
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Aucun enfant ne correspond à votre recherche.' : 'Vous n\'avez pas encore d\'enfants enregistrés.'}
            </p>
            <button
              onClick={handleAddChild}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Ajouter un enfant
            </button>
          </div>
        )}
      </motion.div>

      {/* Vue détaillée d'un enfant */}
      {selectedChild && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {(() => {
            const child = childSessions?.find(c => c.id === selectedChild)
            if (!child) return null
            
            return (
              <>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Détails de {child.firstName} {child.lastName}
                    </h3>
                    <button
                      onClick={() => setSelectedChild(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Cycle d'apprentissage hebdomadaire
                      </h4>
                      <WeeklyCycle
                        childName={`${child.firstName} ${child.lastName}`}
                        currentDay={new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()}
                        childSessionId={child.id}
                      />
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Analytics de Communication
                      </h4>
                      <CommunicationAnalytics childSessionId={child.id} />
                    </div>
                  </div>
                </div>
              </>
            )
          })()}
        </motion.div>
      )}
        </div>
      </div>
    </div>
  )
}
