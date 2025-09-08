'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe,
  CheckCircle,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Monitor,
  Languages,
  Type,
  Accessibility,
  Zap,
  Smartphone,
  Mail,
  Calendar,
  Users,
  Lock,
  Unlock,
  Heart,
  Brain,
  Target,
  Gamepad2,
  Save,
  RotateCcw
} from 'lucide-react'
import AvatarSelector from '../AvatarSelector'
import { useAvatar } from '@/contexts/AvatarContext'
import { useTheme } from '@/contexts/ThemeContext'

interface UserSettings {
  avatarPath: string
  notifications: {
    email: boolean
    push: boolean
    daily: boolean
    weekly: boolean
    achievements: boolean
    reminders: boolean
    social: boolean
  }
  privacy: {
    profileVisible: boolean
    activityVisible: boolean
    allowMessages: boolean
    showProgress: boolean
    shareStats: boolean
    allowFriendRequests: boolean
  }
  appearance: {
    theme: 'light' | 'dark' | 'auto'
    language: 'fr' | 'en' | 'es'
    fontSize: 'small' | 'medium' | 'large'
    colorBlind: boolean
    highContrast: boolean
    reduceAnimations: boolean
    compactMode: boolean
  }
  accessibility: {
    screenReader: boolean
    keyboardNavigation: boolean
    voiceCommands: boolean
    textToSpeech: boolean
    audioDescriptions: boolean
    focusIndicators: boolean
    motionReduction: boolean
    colorBlindSupport: boolean
    dyslexiaFriendly: boolean
    largeCursors: boolean
  }
  learning: {
    difficulty: 'easy' | 'medium' | 'hard' | 'adaptive'
    autoSave: boolean
    hints: boolean
    explanations: boolean
    practiceMode: boolean
    timeLimit: boolean
    soundEffects: boolean
    backgroundMusic: boolean
  }
}

interface SettingsModalProps {
  sectionId: string
  title: string
  icon: React.ReactNode
  color: string
  userType: 'CHILD' | 'PARENT' | 'TEACHER' | 'ADMIN'
  onClose: () => void
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  sectionId, 
  title, 
  icon, 
  color, 
  userType, 
  onClose 
}) => {
  const { selectedAvatar, updateAvatar } = useAvatar()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<string>('general')
  const [settings, setSettings] = useState<UserSettings>({
    avatarPath: selectedAvatar || '',
    notifications: {
      email: true,
      push: true,
      daily: true,
      weekly: false,
      achievements: true,
      reminders: true,
      social: false
    },
    privacy: {
      profileVisible: true,
      activityVisible: true,
      allowMessages: true,
      showProgress: true,
      shareStats: false,
      allowFriendRequests: true
    },
    appearance: {
      theme: theme || 'auto',
      language: 'fr',
      fontSize: 'medium',
      colorBlind: false,
      highContrast: false,
      reduceAnimations: false,
      compactMode: false
    },
    accessibility: {
      screenReader: false,
      keyboardNavigation: true,
      voiceCommands: false,
      textToSpeech: false,
      audioDescriptions: false,
      focusIndicators: true,
      motionReduction: false,
      colorBlindSupport: false,
      dyslexiaFriendly: false,
      largeCursors: false
    },
    learning: {
      difficulty: 'adaptive',
      autoSave: true,
      hints: true,
      explanations: true,
      practiceMode: false,
      timeLimit: false,
      soundEffects: true,
      backgroundMusic: true
    }
  })

  const isChild = userType === 'CHILD'

  // Charger les paramètres sauvegardés
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error)
      }
    }
  }, [])

  // Composant Switch
  const Switch = ({ 
    checked, 
    onChange, 
    label, 
    description 
  }: { 
    checked: boolean
    onChange: (checked: boolean) => void
    label: string
    description?: string
  }) => (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <div className="flex-1 min-w-0">
        <label className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer block">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )

  // Composant Select
  const Select = ({ 
    value, 
    onChange, 
    options, 
    label, 
    description 
  }: { 
    value: string
    onChange: (value: string) => void
    options: { value: string; label: string }[]
    label: string
    description?: string
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-900 dark:text-white">
        {label}
      </label>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )

  // Mettre à jour un paramètre
  const updateSetting = (category: keyof UserSettings, key: string, value: any) => {
    setSettings(prev => {
      const currentCategory = prev[category] as Record<string, any>
      const newSettings = {
        ...prev,
        [category]: {
          ...currentCategory,
          [key]: value
        }
      }
      
      // Sauvegarder automatiquement
      localStorage.setItem('userSettings', JSON.stringify(newSettings))
      
      // Appliquer le thème immédiatement
      if (category === 'appearance' && key === 'theme') {
        setTheme(value)
      }
      
      return newSettings
    })
  }

  // Sauvegarder tous les paramètres
  const saveSettings = () => {
    localStorage.setItem('userSettings', JSON.stringify(settings))
    if (settings.avatarPath) {
      updateAvatar(settings.avatarPath)
    }
    // Afficher une notification de succès
    console.log('Paramètres sauvegardés avec succès!')
  }

  // Réinitialiser les paramètres
  const resetSettings = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
      localStorage.removeItem('userSettings')
      setSettings({
        avatarPath: '',
        notifications: {
          email: true,
          push: true,
          daily: true,
          weekly: false,
          achievements: true,
          reminders: true,
          social: false
        },
        privacy: {
          profileVisible: true,
          activityVisible: true,
          allowMessages: true,
          showProgress: true,
          shareStats: false,
          allowFriendRequests: true
        },
        appearance: {
          theme: 'auto',
          language: 'fr',
          fontSize: 'medium',
          colorBlind: false,
          highContrast: false,
          reduceAnimations: false,
          compactMode: false
        },
        accessibility: {
          screenReader: false,
          keyboardNavigation: true,
          voiceCommands: false,
          textToSpeech: false,
          audioDescriptions: false,
          focusIndicators: true,
          motionReduction: false,
          colorBlindSupport: false,
          dyslexiaFriendly: false,
          largeCursors: false
        },
        learning: {
          difficulty: 'adaptive',
          autoSave: true,
          hints: true,
          explanations: true,
          practiceMode: false,
          timeLimit: false,
          soundEffects: true,
          backgroundMusic: true
        }
      })
    }
  }

  // Définir les onglets selon la section
  const getTabs = () => {
    switch (sectionId) {
      case 'profile':
        return [
          { id: 'avatar', label: 'Avatar', icon: <User className="w-4 h-4" /> },
          { id: 'personal', label: 'Informations', icon: <User className="w-4 h-4" /> }
        ]
      case 'notifications':
        return [
          { id: 'general', label: 'Général', icon: <Bell className="w-4 h-4" /> },
          { id: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
          { id: 'push', label: 'Notifications Push', icon: <Smartphone className="w-4 h-4" /> }
        ]
      case 'privacy':
        return [
          { id: 'profile', label: 'Profil', icon: <User className="w-4 h-4" /> },
          { id: 'activity', label: 'Activité', icon: <Target className="w-4 h-4" /> },
          { id: 'social', label: 'Social', icon: <Users className="w-4 h-4" /> }
        ]
      case 'appearance':
        return [
          { id: 'theme', label: 'Thème', icon: <Palette className="w-4 h-4" /> },
          { id: 'display', label: 'Affichage', icon: <Monitor className="w-4 h-4" /> },
          { id: 'language', label: 'Langue', icon: <Globe className="w-4 h-4" /> }
        ]
      case 'accessibility':
        return [
          { id: 'general', label: 'Général', icon: <Accessibility className="w-4 h-4" /> },
          { id: 'visual', label: 'Visuel', icon: <Eye className="w-4 h-4" /> },
          { id: 'audio', label: 'Audio', icon: <Volume2 className="w-4 h-4" /> }
        ]
      case 'learning':
        return [
          { id: 'difficulty', label: 'Difficulté', icon: <Target className="w-4 h-4" /> },
          { id: 'preferences', label: 'Préférences', icon: <Heart className="w-4 h-4" /> },
          { id: 'audio', label: 'Audio', icon: <Volume2 className="w-4 h-4" /> }
        ]
      default:
        return [{ id: 'general', label: 'Général', icon: <Settings className="w-4 h-4" /> }]
    }
  }

  const tabs = getTabs()

  // Rendu du contenu selon l'onglet actif
  const renderTabContent = () => {
    switch (sectionId) {
      case 'profile':
        if (activeTab === 'avatar') {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Choisir votre avatar
                </h3>
                <AvatarSelector />
              </div>
            </div>
          )
        }
        return (
          <div className="space-y-4">
            <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Informations personnelles
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre prénom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre nom"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-4">
            <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Paramètres de notifications
              </h3>
              <div className="space-y-2">
                <Switch
                  checked={settings.notifications.email}
                  onChange={(checked) => updateSetting('notifications', 'email', checked)}
                  label="Notifications par email"
                  description="Recevez des notifications importantes par email"
                />
                <Switch
                  checked={settings.notifications.push}
                  onChange={(checked) => updateSetting('notifications', 'push', checked)}
                  label="Notifications push"
                  description="Recevez des notifications sur votre appareil"
                />
                <Switch
                  checked={settings.notifications.daily}
                  onChange={(checked) => updateSetting('notifications', 'daily', checked)}
                  label="Rappels quotidiens"
                  description="Rappels pour les activités quotidiennes"
                />
                <Switch
                  checked={settings.notifications.achievements}
                  onChange={(checked) => updateSetting('notifications', 'achievements', checked)}
                  label="Nouvelles récompenses"
                  description="Notifications pour les nouveaux badges et récompenses"
                />
              </div>
            </div>
          </div>
        )

      case 'appearance':
        if (activeTab === 'theme') {
          return (
            <div className="space-y-4">
              <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-700/50 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Thème et apparence
                </h3>
                <div className="space-y-4">
                  <Select
                    value={settings.appearance.theme}
                    onChange={(value) => updateSetting('appearance', 'theme', value)}
                    options={[
                      { value: 'light', label: 'Clair' },
                      { value: 'dark', label: 'Sombre' },
                      { value: 'auto', label: 'Automatique' }
                    ]}
                    label="Thème"
                    description="Choisissez le thème de l'interface"
                  />
                  <Select
                    value={settings.appearance.fontSize}
                    onChange={(value) => updateSetting('appearance', 'fontSize', value)}
                    options={[
                      { value: 'small', label: 'Petit' },
                      { value: 'medium', label: 'Moyen' },
                      { value: 'large', label: 'Grand' }
                    ]}
                    label="Taille de police"
                    description="Ajustez la taille du texte"
                  />
                  <Switch
                    checked={settings.appearance.highContrast}
                    onChange={(checked) => updateSetting('appearance', 'highContrast', checked)}
                    label="Contraste élevé"
                    description="Améliore la lisibilité avec un contraste plus élevé"
                  />
                  <Switch
                    checked={settings.appearance.reduceAnimations}
                    onChange={(checked) => updateSetting('appearance', 'reduceAnimations', checked)}
                    label="Réduire les animations"
                    description="Désactive les animations pour une meilleure performance"
                  />
                </div>
              </div>
            </div>
          )
        }
        return (
          <div className="space-y-4">
            <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Paramètres d'affichage
              </h3>
              <div className="space-y-4">
                <Select
                  value={settings.appearance.language}
                  onChange={(value) => updateSetting('appearance', 'language', value)}
                  options={[
                    { value: 'fr', label: 'Français' },
                    { value: 'en', label: 'English' },
                    { value: 'es', label: 'Español' }
                  ]}
                  label="Langue"
                  description="Choisissez la langue de l'interface"
                />
                <Switch
                  checked={settings.appearance.compactMode}
                  onChange={(checked) => updateSetting('appearance', 'compactMode', checked)}
                  label="Mode compact"
                  description="Réduit l'espacement pour afficher plus de contenu"
                />
              </div>
            </div>
          </div>
        )

      case 'learning':
        return (
          <div className="space-y-4">
            <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Préférences d'apprentissage
              </h3>
              <div className="space-y-4">
                <Select
                  value={settings.learning.difficulty}
                  onChange={(value) => updateSetting('learning', 'difficulty', value)}
                  options={[
                    { value: 'easy', label: 'Facile' },
                    { value: 'medium', label: 'Moyen' },
                    { value: 'hard', label: 'Difficile' },
                    { value: 'adaptive', label: 'Adaptatif' }
                  ]}
                  label="Niveau de difficulté"
                  description="Ajustez la difficulté des exercices"
                />
                <Switch
                  checked={settings.learning.hints}
                  onChange={(checked) => updateSetting('learning', 'hints', checked)}
                  label="Afficher les indices"
                  description="Montre des indices pour vous aider"
                />
                <Switch
                  checked={settings.learning.explanations}
                  onChange={(checked) => updateSetting('learning', 'explanations', checked)}
                  label="Explications détaillées"
                  description="Affiche des explications après chaque exercice"
                />
                <Switch
                  checked={settings.learning.soundEffects}
                  onChange={(checked) => updateSetting('learning', 'soundEffects', checked)}
                  label="Effets sonores"
                  description="Active les sons de l'interface"
                />
                <Switch
                  checked={settings.learning.backgroundMusic}
                  onChange={(checked) => updateSetting('learning', 'backgroundMusic', checked)}
                  label="Musique de fond"
                  description="Joue une musique douce en arrière-plan"
                />
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-4">
            <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-700/50 p-6">
              <div className="text-center py-8">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Configuration {title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Les paramètres détaillés pour {title.toLowerCase()} seront disponibles ici.
                </p>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className={`w-16 h-16 bg-gradient-to-r ${
          color === 'blue' ? 'from-blue-500 to-blue-600' :
          color === 'green' ? 'from-green-500 to-green-600' :
          color === 'purple' ? 'from-purple-500 to-purple-600' :
          color === 'orange' ? 'from-orange-500 to-orange-600' :
          color === 'pink' ? 'from-pink-500 to-pink-600' :
          'from-indigo-500 to-indigo-600'
        } rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
          {icon}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h2>
      </div>

      {/* Onglets */}
      {tabs.length > 1 && (
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Contenu */}
      <div className="max-h-96 overflow-y-auto">
        {renderTabContent()}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={resetSettings}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Réinitialiser
        </button>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={saveSettings}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Save className="w-4 h-4" />
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
