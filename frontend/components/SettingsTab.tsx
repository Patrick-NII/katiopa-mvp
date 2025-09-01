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
  Save,
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
  Target
} from 'lucide-react'
import AvatarSelector from './AvatarSelector'
import { authAPI } from '@/lib/api'
import { useAvatar } from '@/contexts/AvatarContext'

interface SettingsTabProps {
  userType: 'CHILD' | 'PARENT' | 'TEACHER' | 'ADMIN'
}

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
  performance: {
    autoOptimize: boolean
    cacheData: boolean
    preloadContent: boolean
    lowBandwidth: boolean
    offlineMode: boolean
  }
}

type SettingsTabType = 'avatar' | 'notifications' | 'privacy' | 'appearance' | 'accessibility' | 'learning' | 'performance'

export default function SettingsTab({ userType }: SettingsTabProps) {
  const { selectedAvatar, updateAvatarFromSettings } = useAvatar()
  const [activeTab, setActiveTab] = useState<SettingsTabType>('avatar')
  
  const [settings, setSettings] = useState<UserSettings>({
    avatarPath: '',
    notifications: {
      email: true,
      push: true,
      daily: false,
      weekly: true,
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
      backgroundMusic: false
    },
    performance: {
      autoOptimize: true,
      cacheData: true,
      preloadContent: true,
      lowBandwidth: false,
      offlineMode: false
    }
  })

  const [isLoading, setIsLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Charger les réglages depuis le localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.error('Erreur lors du chargement des réglages:', error)
      }
    }
  }, [])

  // Synchroniser l'avatar avec le contexte global
  useEffect(() => {
    if (selectedAvatar && selectedAvatar !== settings.avatarPath) {
      setSettings(prev => ({ ...prev, avatarPath: selectedAvatar }))
    }
  }, [selectedAvatar, settings.avatarPath])

  // Sauvegarder les réglages
  const saveSettings = async () => {
    setIsLoading(true)
    setSaveStatus('saving')

    try {
      // Simuler une sauvegarde API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Sauvegarder dans le localStorage
      localStorage.setItem('userSettings', JSON.stringify(settings))
      
      // Appliquer les réglages en temps réel
      applySettings(settings)
      
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  // Appliquer les réglages en temps réel
  const applySettings = (newSettings: UserSettings) => {
    // Appliquer le thème
    if (newSettings.appearance.theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (newSettings.appearance.theme === 'light') {
      document.documentElement.classList.remove('dark')
    }

    // Appliquer la taille de police
    const fontSizeMap = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg'
    }
    document.body.className = fontSizeMap[newSettings.appearance.fontSize] || 'text-base'

    // Appliquer le contraste élevé
    if (newSettings.appearance.highContrast) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }

    // Appliquer la réduction d'animations
    if (newSettings.accessibility.motionReduction) {
      document.documentElement.classList.add('reduce-motion')
    } else {
      document.documentElement.classList.remove('reduce-motion')
    }
  }

  // Gérer le changement d'avatar
  const handleAvatarChange = (avatarPath: string) => {
    if (avatarPath && avatarPath.trim() !== '') {
      setSettings(prev => ({ ...prev, avatarPath }))
      // Mettre à jour le contexte global immédiatement
      updateAvatarFromSettings(avatarPath)
    }
  }

  // Gérer les changements de réglages
  const updateSetting = (category: keyof UserSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  // Composant Switch personnalisé
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
    <div className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-900 cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
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

  // Obtenir les couleurs selon le type d'utilisateur
  const getUserTypeColors = () => {
    switch (userType) {
      case 'CHILD':
        return {
          gradient: 'from-purple-500 to-pink-500',
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-600'
        }
      case 'PARENT':
        return {
          gradient: 'from-blue-500 to-indigo-500',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-600'
        }
      case 'TEACHER':
        return {
          gradient: 'from-green-500 to-emerald-500',
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-600'
        }
      case 'ADMIN':
        return {
          gradient: 'from-red-500 to-pink-500',
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-600'
        }
      default:
        return {
          gradient: 'from-gray-500 to-slate-500',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-600'
        }
    }
  }

  const colors = getUserTypeColors()

  // Configuration des onglets
  const tabs = [
    { id: 'avatar', label: 'Avatar', icon: User, color: 'from-purple-500 to-pink-500' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'from-blue-500 to-indigo-500' },
    { id: 'privacy', label: 'Confidentialité', icon: Shield, color: 'from-green-500 to-emerald-500' },
    { id: 'appearance', label: 'Apparence', icon: Palette, color: 'from-orange-500 to-red-500' },
    { id: 'accessibility', label: 'Accessibilité', icon: Accessibility, color: 'from-teal-500 to-cyan-500' },
    { id: 'learning', label: 'Apprentissage', icon: Brain, color: 'from-indigo-500 to-purple-500' },
    { id: 'performance', label: 'Performance', icon: Zap, color: 'from-yellow-500 to-orange-500' }
  ]

  // Rendu du contenu des onglets
  const renderTabContent = () => {
    switch (activeTab) {
      case 'avatar':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">👤 Personnalisation de l'avatar</h2>
              <p className="text-gray-600">Choisis l'avatar qui te représente le mieux</p>
            </div>
            <AvatarSelector
              currentAvatar={settings.avatarPath}
              onAvatarChange={handleAvatarChange}
              userType={userType}
            />
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">🔔 Gestion des notifications</h2>
              <p className="text-gray-600">Configure tes préférences de notifications</p>
            </div>
            <div className="space-y-3">
              <Switch
                checked={settings.notifications.email}
                onChange={(checked) => updateSetting('notifications', 'email', checked)}
                label="Notifications par email"
                description="Recevoir des emails pour les activités importantes"
              />
              <Switch
                checked={settings.notifications.push}
                onChange={(checked) => updateSetting('notifications', 'push', checked)}
                label="Notifications push"
                description="Notifications instantanées sur ton appareil"
              />
              <Switch
                checked={settings.notifications.daily}
                onChange={(checked) => updateSetting('notifications', 'daily', checked)}
                label="Résumé quotidien"
                description="Récapitulatif de tes activités de la journée"
              />
              <Switch
                checked={settings.notifications.weekly}
                onChange={(checked) => updateSetting('notifications', 'weekly', checked)}
                label="Résumé hebdomadaire"
                description="Bilan de ta semaine d'apprentissage"
              />
              <Switch
                checked={settings.notifications.achievements}
                onChange={(checked) => updateSetting('notifications', 'achievements', checked)}
                label="Nouveaux succès"
                description="Être informé de tes nouvelles récompenses"
              />
              <Switch
                checked={settings.notifications.reminders}
                onChange={(checked) => updateSetting('notifications', 'reminders', checked)}
                label="Rappels d'activité"
                description="Rappels pour maintenir ton rythme d'apprentissage"
              />
              <Switch
                checked={settings.notifications.social}
                onChange={(checked) => updateSetting('notifications', 'social', checked)}
                label="Activités sociales"
                description="Nouvelles amitiés et messages de la communauté"
              />
            </div>
          </div>
        )

      case 'privacy':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">🔒 Contrôle de la confidentialité</h2>
              <p className="text-gray-600">Gère qui peut voir tes informations et activités</p>
            </div>
            <div className="space-y-3">
              <Switch
                checked={settings.privacy.profileVisible}
                onChange={(checked) => updateSetting('privacy', 'profileVisible', checked)}
                label="Profil visible"
                description="Permettre aux autres de voir ton profil"
              />
              <Switch
                checked={settings.privacy.activityVisible}
                onChange={(checked) => updateSetting('privacy', 'activityVisible', checked)}
                label="Activités visibles"
                description="Partager tes activités d'apprentissage"
              />
              <Switch
                checked={settings.privacy.allowMessages}
                onChange={(checked) => updateSetting('privacy', 'allowMessages', checked)}
                label="Autoriser les messages"
                description="Recevoir des messages des autres utilisateurs"
              />
              <Switch
                checked={settings.privacy.showProgress}
                onChange={(checked) => updateSetting('privacy', 'showProgress', checked)}
                label="Afficher la progression"
                description="Partager tes progrès avec la communauté"
              />
              <Switch
                checked={settings.privacy.shareStats}
                onChange={(checked) => updateSetting('privacy', 'shareStats', checked)}
                label="Partager les statistiques"
                description="Partager tes performances et statistiques"
              />
              <Switch
                checked={settings.privacy.allowFriendRequests}
                onChange={(checked) => updateSetting('privacy', 'allowFriendRequests', checked)}
                label="Demandes d'amis"
                description="Autoriser les demandes d'amis"
              />
            </div>
          </div>
        )

      case 'appearance':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">🎨 Personnalisation de l'apparence</h2>
              <p className="text-gray-600">Adapte l'interface à tes préférences visuelles</p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Thème
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => updateSetting('appearance', 'theme', 'light')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      settings.appearance.theme === 'light'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Sun className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Clair</span>
                  </button>
                  <button
                    onClick={() => updateSetting('appearance', 'theme', 'dark')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      settings.appearance.theme === 'dark'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Moon className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Sombre</span>
                  </button>
                  <button
                    onClick={() => updateSetting('appearance', 'theme', 'auto')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      settings.appearance.theme === 'auto'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Monitor className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Auto</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Langue
                </label>
                <select
                  value={settings.appearance.language}
                  onChange={(e) => updateSetting('appearance', 'language', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="fr">🇫🇷 Français</option>
                  <option value="en">🇬🇧 English</option>
                  <option value="es">🇪🇸 Español</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Taille de police
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => updateSetting('appearance', 'fontSize', 'small')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      settings.appearance.fontSize === 'small'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Type className="w-5 h-5 mx-auto mb-2" />
                    <span className="text-sm font-medium">Petite</span>
                  </button>
                  <button
                    onClick={() => updateSetting('appearance', 'fontSize', 'medium')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      settings.appearance.fontSize === 'medium'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Type className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Moyenne</span>
                  </button>
                  <button
                    onClick={() => updateSetting('appearance', 'fontSize', 'large')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      settings.appearance.fontSize === 'large'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Type className="w-7 h-7 mx-auto mb-2" />
                    <span className="text-sm font-medium">Grande</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <Switch
                  checked={settings.appearance.colorBlind}
                  onChange={(checked) => updateSetting('appearance', 'colorBlind', checked)}
                  label="Mode daltonien"
                  description="Adapter les couleurs pour les utilisateurs daltoniens"
                />
                <Switch
                  checked={settings.appearance.highContrast}
                  onChange={(checked) => updateSetting('appearance', 'highContrast', checked)}
                  label="Contraste élevé"
                  description="Améliorer la lisibilité du texte"
                />
                <Switch
                  checked={settings.appearance.reduceAnimations}
                  onChange={(checked) => updateSetting('appearance', 'reduceAnimations', checked)}
                  label="Réduire les animations"
                  description="Minimiser les effets visuels"
                />
                <Switch
                  checked={settings.appearance.compactMode}
                  onChange={(checked) => updateSetting('appearance', 'compactMode', checked)}
                  label="Mode compact"
                  description="Interface plus dense pour plus d'informations"
                />
              </div>
            </div>
          </div>
        )

      case 'accessibility':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">♿ Options d'accessibilité</h2>
              <p className="text-gray-600">Adapte l'interface à tes besoins d'accessibilité</p>
            </div>
            <div className="space-y-3">
              <Switch
                checked={settings.accessibility.screenReader}
                onChange={(checked) => updateSetting('accessibility', 'screenReader', checked)}
                label="Lecteur d'écran"
                description="Support complet des lecteurs d'écran"
              />
              <Switch
                checked={settings.accessibility.keyboardNavigation}
                onChange={(checked) => updateSetting('accessibility', 'keyboardNavigation', checked)}
                label="Navigation clavier"
                description="Navigation complète au clavier"
              />
              <Switch
                checked={settings.accessibility.voiceCommands}
                onChange={(checked) => updateSetting('accessibility', 'voiceCommands', checked)}
                label="Commandes vocales"
                description="Contrôler l'application par la voix"
              />
              <Switch
                checked={settings.accessibility.textToSpeech}
                onChange={(checked) => updateSetting('accessibility', 'textToSpeech', checked)}
                label="Synthèse vocale"
                description="Lire le texte à haute voix"
              />
              <Switch
                checked={settings.accessibility.audioDescriptions}
                onChange={(checked) => updateSetting('accessibility', 'audioDescriptions', checked)}
                label="Descriptions audio"
                description="Descriptions audio des éléments visuels"
              />
              <Switch
                checked={settings.accessibility.focusIndicators}
                onChange={(checked) => updateSetting('accessibility', 'focusIndicators', checked)}
                label="Indicateurs de focus"
                description="Mise en évidence claire de l'élément actif"
              />
              <Switch
                checked={settings.accessibility.motionReduction}
                onChange={(checked) => updateSetting('accessibility', 'motionReduction', checked)}
                label="Réduction des mouvements"
                description="Minimiser les animations et transitions"
              />
              <Switch
                checked={settings.accessibility.colorBlindSupport}
                onChange={(checked) => updateSetting('accessibility', 'colorBlindSupport', checked)}
                label="Support daltonien"
                description="Interface adaptée aux daltoniens"
              />
              <Switch
                checked={settings.accessibility.dyslexiaFriendly}
                onChange={(checked) => updateSetting('accessibility', 'dyslexiaFriendly', checked)}
                label="Mode dyslexie"
                description="Police et espacement adaptés"
              />
              <Switch
                checked={settings.accessibility.largeCursors}
                onChange={(checked) => updateSetting('accessibility', 'largeCursors', checked)}
                label="Curseurs agrandis"
                description="Curseurs plus visibles"
              />
            </div>
          </div>
        )

      case 'learning':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">🧠 Préférences d'apprentissage</h2>
              <p className="text-gray-600">Personnalise ton expérience d'apprentissage</p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Niveau de difficulté
                </label>
                <select
                  value={settings.learning.difficulty}
                  onChange={(e) => updateSetting('learning', 'difficulty', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="easy">🟢 Facile - Débutant</option>
                  <option value="medium">🟡 Moyen - Intermédiaire</option>
                  <option value="hard">🔴 Difficile - Avancé</option>
                  <option value="adaptive">🎯 Adaptatif - S'ajuste automatiquement</option>
                </select>
              </div>

              <div className="space-y-3">
                <Switch
                  checked={settings.learning.autoSave}
                  onChange={(checked) => updateSetting('learning', 'autoSave', checked)}
                  label="Sauvegarde automatique"
                  description="Sauvegarder automatiquement ta progression"
                />
                <Switch
                  checked={settings.learning.hints}
                  onChange={(checked) => updateSetting('learning', 'hints', checked)}
                  label="Indices et conseils"
                  description="Recevoir des indices pour t'aider"
                />
                <Switch
                  checked={settings.learning.explanations}
                  onChange={(checked) => updateSetting('learning', 'explanations', checked)}
                  label="Explications détaillées"
                  description="Explications complètes des concepts"
                />
                <Switch
                  checked={settings.learning.practiceMode}
                  onChange={(checked) => updateSetting('learning', 'practiceMode', checked)}
                  label="Mode entraînement"
                  description="S'entraîner sans pression de temps"
                />
                <Switch
                  checked={settings.learning.timeLimit}
                  onChange={(checked) => updateSetting('learning', 'timeLimit', checked)}
                  label="Limite de temps"
                  description="Ajouter une pression temporelle"
                />
                <Switch
                  checked={settings.learning.soundEffects}
                  onChange={(checked) => updateSetting('learning', 'soundEffects', checked)}
                  label="Effets sonores"
                  description="Sons pour les interactions"
                />
                <Switch
                  checked={settings.learning.backgroundMusic}
                  onChange={(checked) => updateSetting('learning', 'backgroundMusic', checked)}
                  label="Musique de fond"
                  description="Musique d'ambiance pendant l'apprentissage"
                />
              </div>
            </div>
          </div>
        )

      case 'performance':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">⚡ Optimisation des performances</h2>
              <p className="text-gray-600">Configure les paramètres de performance de l'application</p>
            </div>
            <div className="space-y-3">
              <Switch
                checked={settings.performance.autoOptimize}
                onChange={(checked) => updateSetting('performance', 'autoOptimize', checked)}
                label="Optimisation automatique"
                description="Optimiser automatiquement les performances"
              />
              <Switch
                checked={settings.performance.cacheData}
                onChange={(checked) => updateSetting('performance', 'cacheData', checked)}
                label="Mise en cache"
                description="Mettre en cache les données pour un accès plus rapide"
              />
              <Switch
                checked={settings.performance.preloadContent}
                onChange={(checked) => updateSetting('performance', 'preloadContent', checked)}
                label="Préchargement"
                description="Précharger le contenu pour une navigation fluide"
              />
              <Switch
                checked={settings.performance.lowBandwidth}
                onChange={(checked) => updateSetting('performance', 'lowBandwidth', checked)}
                label="Mode basse bande passante"
                description="Optimiser pour les connexions lentes"
              />
              <Switch
                checked={settings.performance.offlineMode}
                onChange={(checked) => updateSetting('performance', 'offlineMode', checked)}
                label="Mode hors ligne"
                description="Fonctionner sans connexion internet"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* En-tête des réglages */}
      <div className="text-center mb-8">
        <div className={`inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r ${colors.gradient} text-white shadow-lg mb-4`}>
          <Settings className="w-6 h-6 mr-2" />
          <span className="font-bold text-xl">Réglages</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          ⚙️ Configuration & Personnalisation
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Personnalise ton expérience CubeAI selon tes préférences et besoins.
        </p>
      </div>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-center mb-8">
        <button
          onClick={saveSettings}
          disabled={isLoading}
          className={`px-8 py-3 bg-gradient-to-r ${colors.gradient} text-white rounded-2xl font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-2 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {saveStatus === 'saving' && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {saveStatus === 'saved' && <CheckCircle className="w-5 h-5" />}
          {saveStatus === 'error' && <div className="w-5 h-5">⚠️</div>}
          {saveStatus === 'idle' && <Save className="w-5 h-5" />}
          <span>
            {saveStatus === 'saving' ? 'Sauvegarde...' :
             saveStatus === 'saved' ? 'Sauvegardé !' :
             saveStatus === 'error' ? 'Erreur' : 'Sauvegarder les réglages'}
          </span>
        </button>
      </div>

      {/* Navigation par onglets */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-wrap justify-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTabType)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg transform scale-105`
                    : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-md'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Contenu de l'onglet actif */}
      <div className="max-w-4xl mx-auto">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-8 rounded-2xl"
        >
          {renderTabContent()}
        </motion.div>
      </div>

      {/* Informations sur la sauvegarde */}
      <div className="mt-8 text-center">
        <div className={`inline-flex items-center px-4 py-2 rounded-full ${colors.bg} ${colors.border}`}>
          <CheckCircle className={`w-4 h-4 ${colors.text} mr-2`} />
          <span className={`text-sm ${colors.text}`}>
            Tous les réglages sont sauvegardés automatiquement et appliqués en temps réel
          </span>
        </div>
      </div>
    </div>
  )
}
