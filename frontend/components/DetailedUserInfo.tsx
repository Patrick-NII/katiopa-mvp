'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Calendar, 
  MapPin, 
  Clock, 
  BookOpen, 
  Target, 
  Heart, 
  Star,
  Edit3,
  Save,
  X,
  Plus,
  Trash2
} from 'lucide-react'

interface UserPreferences {
  learningGoals: string[]
  preferredSubjects: string[]
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed'
  difficultyPreference: 'easy' | 'medium' | 'challenging' | 'adaptive'
  sessionDuration: number // en minutes
  practiceFrequency: 'daily' | 'weekly' | 'flexible'
  specialNeeds: string[]
  interests: string[]
  parentNotes: string
  teacherNotes: string
}

interface DetailedUserInfoProps {
  user: {
    id: string
    name: string
    email: string
    age?: number
    grade?: string
    country?: string
    timezone?: string
    createdAt: string
    subscriptionType: string
  }
  onPreferencesUpdate: (preferences: UserPreferences) => void
}

export default function DetailedUserInfo({ user, onPreferencesUpdate }: DetailedUserInfoProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [preferences, setPreferences] = useState<UserPreferences>({
    learningGoals: ['Maîtriser les bases des mathématiques', 'Développer la logique'],
    preferredSubjects: ['maths', 'logique'],
    learningStyle: 'mixed',
    difficultyPreference: 'adaptive',
    sessionDuration: 15,
    practiceFrequency: 'daily',
    specialNeeds: [],
    interests: ['puzzles', 'jeux de logique'],
    parentNotes: '',
    teacherNotes: ''
  })

  const [newGoal, setNewGoal] = useState('')
  const [newInterest, setNewInterest] = useState('')
  const [newSpecialNeed, setNewSpecialNeed] = useState('')

  const subjects = [
    { value: 'maths', label: 'Mathématiques', icon: '🔢' },
    { value: 'reading', label: 'Lecture', icon: '📚' },
    { value: 'science', label: 'Sciences', icon: '🔬' },
    { value: 'ai', label: 'IA & Logique', icon: '🤖' },
    { value: 'logic', label: 'Logique pure', icon: '🧩' },
    { value: 'creativity', label: 'Créativité', icon: '🎨' }
  ]

  const learningStyles = [
    { value: 'visual', label: 'Visuel', description: 'Images, graphiques, couleurs' },
    { value: 'auditory', label: 'Auditif', description: 'Sons, musique, explications verbales' },
    { value: 'kinesthetic', label: 'Kinesthésique', description: 'Mouvement, manipulation, expériences' },
    { value: 'mixed', label: 'Mixte', description: 'Combinaison des styles' }
  ]

  const difficultyLevels = [
    { value: 'easy', label: 'Facile', description: 'Renforcement des bases' },
    { value: 'medium', label: 'Moyen', description: 'Progression équilibrée' },
    { value: 'challenging', label: 'Challenging', description: 'Défis stimulants' },
    { value: 'adaptive', label: 'Adaptatif', description: 'S\'adapte automatiquement' }
  ]

  const frequencies = [
    { value: 'daily', label: 'Quotidien', description: 'Tous les jours' },
    { value: 'weekly', label: 'Hebdomadaire', description: '3-4 fois par semaine' },
    { value: 'flexible', label: 'Flexible', description: 'Selon disponibilité' }
  ]

  const handleSave = () => {
    onPreferencesUpdate(preferences)
    setIsEditing(false)
  }

  const addGoal = () => {
    if (newGoal.trim()) {
      setPreferences(prev => ({
        ...prev,
        learningGoals: [...prev.learningGoals, newGoal.trim()]
      }))
      setNewGoal('')
    }
  }

  const removeGoal = (index: number) => {
    setPreferences(prev => ({
      ...prev,
      learningGoals: prev.learningGoals.filter((_, i) => i !== index)
    }))
  }

  const addInterest = () => {
    if (newInterest.trim()) {
      setPreferences(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }))
      setNewInterest('')
    }
  }

  const removeInterest = (index: number) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index)
    }))
  }

  const addSpecialNeed = () => {
    if (newSpecialNeed.trim()) {
      setPreferences(prev => ({
        ...prev,
        specialNeeds: [...prev.specialNeeds, newSpecialNeed.trim()]
      }))
      setNewSpecialNeed('')
    }
  }

  const removeSpecialNeed = (index: number) => {
    setPreferences(prev => ({
      ...prev,
      specialNeeds: prev.specialNeeds.filter((_, i) => i !== index)
    }))
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'Date invalide'
    }
  }

  const calculateMembershipDuration = (dateString: string) => {
    try {
      const now = new Date()
      const memberSince = new Date(dateString)
      const diffTime = Math.abs(now.getTime() - memberSince.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) return '1 jour'
      if (diffDays < 7) return `${diffDays} jours`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} semaines`
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} mois`
      return `${Math.floor(diffDays / 365)} an(s)`
    } catch {
      return 'Durée inconnue'
    }
  }

  return (
    <motion.div 
      className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* En-tête avec bouton d'édition */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <User size={24} />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-blue-100">Informations détaillées et préférences</p>
            </div>
          </div>
          
          {!isEditing ? (
            <motion.button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Edit3 size={16} />
              Modifier
            </motion.button>
          ) : (
            <div className="flex gap-2">
              <motion.button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Save size={16} />
                Sauvegarder
              </motion.button>
              <motion.button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 rounded-lg hover:bg-gray-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X size={16} />
                Annuler
              </motion.button>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Informations de base */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User size={20} />
              Informations personnelles
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-gray-600 w-24">Nom:</span>
                <span className="font-medium">{user.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-600 w-24">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-600 w-24">Âge:</span>
                <span className="font-medium">{user.age || 'Non spécifié'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-600 w-24">Niveau:</span>
                <span className="font-medium">{user.grade || 'Non spécifié'}</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar size={20} />
              Informations de membre
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-gray-600 w-24">Membre depuis:</span>
                <span className="font-medium">{formatDate(user.createdAt)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-600 w-24">Durée:</span>
                <span className="font-medium">{calculateMembershipDuration(user.createdAt)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-600 w-24">Type:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.subscriptionType === 'premium' ? 'bg-purple-100 text-purple-800' :
                  user.subscriptionType === 'enterprise' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {user.subscriptionType === 'premium' ? 'Premium' :
                   user.subscriptionType === 'enterprise' ? 'Entreprise' : 'Gratuit'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-600 w-24">Pays:</span>
                <span className="font-medium">{user.country || 'Non spécifié'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-600 w-24">Fuseau:</span>
                <span className="font-medium">{user.timezone || 'Non spécifié'}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Préférences d'apprentissage */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Target size={20} />
            Objectifs et préférences d'apprentissage
          </h3>

          {/* Objectifs d'apprentissage */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Objectifs d'apprentissage
            </label>
            {isEditing ? (
              <div className="space-y-2">
                {preferences.learningGoals.map((goal, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={goal}
                      onChange={(e) => {
                        const newGoals = [...preferences.learningGoals]
                        newGoals[index] = e.target.value
                        setPreferences(prev => ({ ...prev, learningGoals: newGoals }))
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => removeGoal(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="Ajouter un nouvel objectif..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={addGoal}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {preferences.learningGoals.map((goal, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-800">{goal}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Matières préférées */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Matières préférées
            </label>
            {isEditing ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {subjects.map((subject) => (
                  <label key={subject.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.preferredSubjects.includes(subject.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPreferences(prev => ({
                            ...prev,
                            preferredSubjects: [...prev.preferredSubjects, subject.value]
                          }))
                        } else {
                          setPreferences(prev => ({
                            ...prev,
                            preferredSubjects: prev.preferredSubjects.filter(s => s !== subject.value)
                          }))
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">{subject.icon} {subject.label}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {preferences.preferredSubjects.map((subject) => {
                  const subjectInfo = subjects.find(s => s.value === subject)
                  return (
                    <span key={subject} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {subjectInfo?.icon} {subjectInfo?.label}
                    </span>
                  )
                })}
              </div>
            )}
          </div>

          {/* Style d'apprentissage */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Style d'apprentissage préféré
            </label>
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {learningStyles.map((style) => (
                  <label key={style.value} className="flex items-start gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="radio"
                      name="learningStyle"
                      value={style.value}
                      checked={preferences.learningStyle === style.value}
                      onChange={(e) => setPreferences(prev => ({ ...prev, learningStyle: e.target.value as any }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{style.label}</div>
                      <div className="text-sm text-gray-600">{style.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-blue-800">
                  {learningStyles.find(s => s.value === preferences.learningStyle)?.label}
                </span>
                <p className="text-sm text-blue-600 mt-1">
                  {learningStyles.find(s => s.value === preferences.learningStyle)?.description}
                </p>
              </div>
            )}
          </div>

          {/* Niveau de difficulté */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Niveau de difficulté préféré
            </label>
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {difficultyLevels.map((level) => (
                  <label key={level.value} className="flex items-start gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="radio"
                      name="difficulty"
                      value={level.value}
                      checked={preferences.difficultyPreference === level.value}
                      onChange={(e) => setPreferences(prev => ({ ...prev, difficultyPreference: e.target.value as any }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{level.label}</div>
                      <div className="text-sm text-gray-600">{level.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-purple-50 rounded-lg">
                <span className="font-medium text-purple-800">
                  {difficultyLevels.find(l => l.value === preferences.difficultyPreference)?.label}
                </span>
                <p className="text-sm text-purple-600 mt-1">
                  {difficultyLevels.find(l => l.value === preferences.difficultyPreference)?.description}
                </p>
              </div>
            )}
          </div>

          {/* Durée et fréquence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Durée de session préférée (minutes)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={preferences.sessionDuration}
                  onChange={(e) => setPreferences(prev => ({ ...prev, sessionDuration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="p-3 bg-green-50 rounded-lg">
                  <span className="font-medium text-green-800">{preferences.sessionDuration} minutes</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Fréquence de pratique
              </label>
              {isEditing ? (
                <div className="space-y-2">
                  {frequencies.map((freq) => (
                    <label key={freq.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="frequency"
                        value={freq.value}
                        checked={preferences.practiceFrequency === freq.value}
                        onChange={(e) => setPreferences(prev => ({ ...prev, practiceFrequency: e.target.value as any }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm">{freq.label}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-green-50 rounded-lg">
                  <span className="font-medium text-green-800">
                    {frequencies.find(f => f.value === preferences.practiceFrequency)?.label}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Intérêts et besoins spéciaux */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Centres d'intérêt
              </label>
              {isEditing ? (
                <div className="space-y-2">
                  {preferences.interests.map((interest, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={interest}
                        onChange={(e) => {
                          const newInterests = [...preferences.interests]
                          newInterests[index] = e.target.value
                          setPreferences(prev => ({ ...prev, interests: newInterests }))
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => removeInterest(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      placeholder="Ajouter un intérêt..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={addInterest}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {preferences.interests.map((interest, index) => (
                    <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Besoins spéciaux
              </label>
              {isEditing ? (
                <div className="space-y-2">
                  {preferences.specialNeeds.map((need, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={need}
                        onChange={(e) => {
                          const newNeeds = [...preferences.specialNeeds]
                          newNeeds[index] = e.target.value
                          setPreferences(prev => ({ ...prev, specialNeeds: newNeeds }))
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => removeSpecialNeed(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSpecialNeed}
                      onChange={(e) => setNewSpecialNeed(e.target.value)}
                      placeholder="Ajouter un besoin..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={addSpecialNeed}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {preferences.specialNeeds.length > 0 ? (
                    preferences.specialNeeds.map((need, index) => (
                      <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                        {need}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 italic">Aucun besoin spécial spécifié</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notes pour parents et enseignants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Notes pour les parents
              </label>
              {isEditing ? (
                <textarea
                  value={preferences.parentNotes}
                  onChange={(e) => setPreferences(prev => ({ ...prev, parentNotes: e.target.value }))}
                  placeholder="Informations importantes pour les parents..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="p-3 bg-blue-50 rounded-lg min-h-[80px]">
                  {preferences.parentNotes ? (
                    <span className="text-blue-800">{preferences.parentNotes}</span>
                  ) : (
                    <span className="text-blue-600 italic">Aucune note pour les parents</span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Notes pour les enseignants
              </label>
              {isEditing ? (
                <textarea
                  value={preferences.teacherNotes}
                  onChange={(e) => setPreferences(prev => ({ ...prev, teacherNotes: e.target.value }))}
                  placeholder="Informations importantes pour les enseignants..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="p-3 bg-purple-50 rounded-lg min-h-[80px]">
                  {preferences.teacherNotes ? (
                    <span className="text-purple-800">{preferences.teacherNotes}</span>
                  ) : (
                    <span className="text-purple-600 italic">Aucune note pour les enseignants</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Informations pour le LLM */}
        <motion.div 
          className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h4 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
            <Star size={20} />
            Informations pour l'IA Coach
          </h4>
          <p className="text-green-800 text-sm mb-3">
            Ces informations détaillées permettent à l'IA de créer des plans d'apprentissage personnalisés et de fournir des conseils adaptés à votre profil.
          </p>
          <div className="text-xs text-green-700 space-y-1">
            <div>• <strong>Objectifs :</strong> {preferences.learningGoals.length} défini(s)</div>
            <div>• <strong>Matières :</strong> {preferences.preferredSubjects.length} sélectionnée(s)</div>
            <div>• <strong>Style :</strong> {learningStyles.find(s => s.value === preferences.learningStyle)?.label}</div>
            <div>• <strong>Difficulté :</strong> {difficultyLevels.find(l => l.value === preferences.difficultyPreference)?.label}</div>
            <div>• <strong>Session :</strong> {preferences.sessionDuration} min, {frequencies.find(f => f.value === preferences.practiceFrequency)?.label}</div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
} 