'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Baby, User, Edit, Eye, EyeOff, Plus, Trash2, Copy, Check } from 'lucide-react'
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api'

interface FamilyMember {
  id: string
  username: string
  displayName: string
  ageBracket?: string
  email?: string
  status: string
  createdAt: string
}

interface PlanInfo {
  current: number
  limit: number
  canCreateMore: boolean
}

export default function FamilyMembersManager() {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({})
  const [copiedUsername, setCopiedUsername] = useState<string | null>(null)

  // État pour l'ajout/édition de membre
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    password: '',
    ageBracket: '5-7' as string,
    email: ''
  })

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const response = await apiGet('/v2/members') as any
      
      if (response.success) {
        setMembers(response.members)
        setPlanInfo(response.plan)
      } else {
        setError(response.message || 'Erreur lors du chargement des membres')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.username || !formData.displayName || !formData.password) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      const response = await apiPost('/v2/members', {
        username: formData.username,
        displayName: formData.displayName,
        password: formData.password,
        ageBracket: formData.ageBracket,
        email: formData.email || undefined
      }) as any

      if (response.success) {
        setMembers(prev => [...prev, response.member])
        setPlanInfo(prev => prev ? {
          ...prev,
          current: prev.current + 1,
          canCreateMore: prev.current + 1 < prev.limit
        } : null)
        
        // Réinitialiser le formulaire
        setFormData({
          username: '',
          displayName: '',
          password: '',
          ageBracket: '5-7',
          email: ''
        })
        setShowAddForm(false)
        setError('')
      } else {
        setError(response.message || 'Erreur lors de la création du membre')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion au serveur')
    }
  }

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingMember) return

    try {
      const response = await apiPatch(`/v2/members/${editingMember.id}`, {
        username: formData.username,
        displayName: formData.displayName,
        ageBracket: formData.ageBracket,
        email: formData.email || undefined,
        ...(formData.password && { password: formData.password })
      }) as any

      if (response.success) {
        setMembers(prev => prev.map(member => 
          member.id === editingMember.id ? response.member : member
        ))
        
        setEditingMember(null)
        setFormData({
          username: '',
          displayName: '',
          password: '',
          ageBracket: '5-7',
          email: ''
        })
        setError('')
      } else {
        setError(response.message || 'Erreur lors de la modification du membre')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion au serveur')
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver ce membre ?')) return

    try {
      const response = await apiDelete(`/v2/members/${memberId}`) as any

      if (response.success) {
        setMembers(prev => prev.map(member => 
          member.id === memberId ? { ...member, status: 'inactive' } : member
        ))
        setError('')
      } else {
        setError(response.message || 'Erreur lors de la suppression du membre')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion au serveur')
    }
  }

  const startEditing = (member: FamilyMember) => {
    setEditingMember(member)
    setFormData({
      username: member.username,
      displayName: member.displayName,
      password: '',
      ageBracket: member.ageBracket || '5-7',
      email: member.email || ''
    })
  }

  const cancelEditing = () => {
    setEditingMember(null)
    setFormData({
      username: '',
      displayName: '',
      password: '',
      ageBracket: '5-7',
      email: ''
    })
  }

  const copyUsername = async (username: string) => {
    try {
      await navigator.clipboard.writeText(username)
      setCopiedUsername(username)
      setTimeout(() => setCopiedUsername(null), 2000)
    } catch (err) {
      console.error('Erreur lors de la copie:', err)
    }
  }

  const togglePasswordVisibility = (memberId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec informations du plan */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Users size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Membres du Foyer</h2>
              <p className="text-gray-600">Gérez les identifiants de connexion de vos enfants</p>
            </div>
          </div>
          
          {planInfo && (
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {planInfo.current}/{planInfo.limit}
              </div>
              <div className="text-sm text-gray-600">enfants</div>
            </div>
          )}
        </div>

        {/* Bouton d'ajout */}
        {planInfo?.canCreateMore && (
          <motion.button
            onClick={() => setShowAddForm(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Ajouter un enfant
          </motion.button>
        )}

        {!planInfo?.canCreateMore && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-700">
              <strong>Limite atteinte :</strong> Vous avez atteint le nombre maximum d'enfants pour votre plan.
            </p>
          </div>
        )}
      </div>

      {/* Formulaire d'ajout/édition */}
      <AnimatePresence>
        {(showAddForm || editingMember) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingMember ? 'Modifier le membre' : 'Ajouter un nouvel enfant'}
            </h3>

            <form onSubmit={editingMember ? handleEditMember : handleAddMember} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Identifiant de connexion *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ex: lucas2024, emma_pro"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Identifiant unique pour la connexion
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom d'affichage *
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ex: Lucas Dupont"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe {editingMember ? '(optionnel)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={editingMember ? 'Laisser vide pour ne pas changer' : 'Mot de passe'}
                    required={!editingMember}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tranche d'âge
                  </label>
                  <select
                    value={formData.ageBracket}
                    onChange={(e) => setFormData(prev => ({ ...prev, ageBracket: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="5-7">5-7 ans</option>
                    <option value="8-11">8-11 ans</option>
                    <option value="12-15">12-15 ans</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (optionnel)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@exemple.com"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingMember ? 'Modifier' : 'Ajouter'}
                </motion.button>
                
                <motion.button
                  type="button"
                  onClick={editingMember ? cancelEditing : () => setShowAddForm(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste des membres */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Membres actuels</h3>
        </div>

        {members.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Baby size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Aucun enfant ajouté pour le moment</p>
            <p className="text-sm">Commencez par ajouter votre premier enfant</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {members.map((member) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Baby size={20} className="text-white" />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{member.displayName}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {member.status === 'active' ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User size={14} />
                          <code className="bg-gray-100 px-2 py-1 rounded font-mono">
                            {member.username}
                          </code>
                          <button
                            onClick={() => copyUsername(member.username)}
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                            title="Copier l'identifiant"
                          >
                            {copiedUsername === member.username ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                        
                        {member.ageBracket && (
                          <div>{member.ageBracket} ans</div>
                        )}
                        
                        {member.email && (
                          <div className="text-blue-600">{member.email}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => startEditing(member)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </motion.button>
                    
                    <motion.button
                      onClick={() => handleDeleteMember(member.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Désactiver"
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


