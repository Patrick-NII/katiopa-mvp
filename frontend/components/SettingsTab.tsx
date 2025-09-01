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
  CheckCircle
} from 'lucide-react'
import AvatarSelector from './AvatarSelector'
import { authAPI } from '@/lib/api'

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
  }
  privacy: {
    profileVisible: boolean
    activityVisible: boolean
    allowMessages: boolean
  }
  appearance: {
    theme: 'light' | 'dark' | 'auto'
    language: 'fr' | 'en' | 'es'
    fontSize: 'small' | 'medium' | 'large'
  }
  accessibility: {
    highContrast: boolean
    reduceMotion: boolean
    screenReader: boolean
  }
}

export default function SettingsTab({ userType }: SettingsTabProps) {
  const [settings, setSettings] = useState<UserSettings>({
    avatarPath: '',
    notifications: {
      email: true,
      push: true,
      daily: false,
      weekly: true
    },
    privacy: {
      profileVisible: true,
      activityVisible: true,
      allowMessages: true
    },
    appearance: {
      theme: 'auto',
      language: 'fr',
      fontSize: 'medium'
    },
    accessibility: {
      highContrast: false,
      reduceMotion: false,
      screenReader: false
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

  // Sauvegarder les réglages
  const saveSettings = async () => {
    setIsLoading(true)
    setSaveStatus('saving')

    try {
      // Simuler une sauvegarde API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Sauvegarder dans le localStorage
      localStorage.setItem('userSettings', JSON.stringify(settings))
      
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  // Gérer le changement d'avatar
  const handleAvatarChange = (avatarPath: string) => {
    setSettings(prev => ({ ...prev, avatarPath }))
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

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section Avatar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <AvatarSelector
            currentAvatar={settings.avatarPath}
            onAvatarChange={handleAvatarChange}
            userType={userType}
          />
        </div>

        {/* Section Notifications */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3 mb-6">
            <div className={`w-10 h-10 bg-gradient-to-r ${colors.gradient} rounded-full flex items-center justify-center`}>
              <Bell className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.email}
                onChange={(e) => updateSetting('notifications', 'email', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Notifications par email</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.push}
                onChange={(e) => updateSetting('notifications', 'push', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Notifications push</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.daily}
                onChange={(e) => updateSetting('notifications', 'daily', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Résumé quotidien</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.weekly}
                onChange={(e) => updateSetting('notifications', 'weekly', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Résumé hebdomadaire</span>
            </label>
          </div>
        </div>

        {/* Section Confidentialité */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3 mb-6">
            <div className={`w-10 h-10 bg-gradient-to-r ${colors.gradient} rounded-full flex items-center justify-center`}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Confidentialité</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.privacy.profileVisible}
                onChange={(e) => updateSetting('privacy', 'profileVisible', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Profil visible par les autres</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.privacy.activityVisible}
                onChange={(e) => updateSetting('privacy', 'activityVisible', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Activités visibles</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.privacy.allowMessages}
                onChange={(e) => updateSetting('privacy', 'allowMessages', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Autoriser les messages</span>
            </label>
          </div>
        </div>

        {/* Section Apparence */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3 mb-6">
            <div className={`w-10 h-10 bg-gradient-to-r ${colors.gradient} rounded-full flex items-center justify-center`}>
              <Palette className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Apparence</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thème
              </label>
              <select
                value={settings.appearance.theme}
                onChange={(e) => updateSetting('appearance', 'theme', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="light">Clair</option>
                <option value="dark">Sombre</option>
                <option value="auto">Automatique</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Langue
              </label>
              <select
                value={settings.appearance.language}
                onChange={(e) => updateSetting('appearance', 'language', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taille de police
              </label>
              <select
                value={settings.appearance.fontSize}
                onChange={(e) => updateSetting('appearance', 'fontSize', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="small">Petite</option>
                <option value="medium">Moyenne</option>
                <option value="large">Grande</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section Accessibilité */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3 mb-6">
            <div className={`w-10 h-10 bg-gradient-to-r ${colors.gradient} rounded-full flex items-center justify-center`}>
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Accessibilité</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.accessibility.highContrast}
                onChange={(e) => updateSetting('accessibility', 'highContrast', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Contraste élevé</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.accessibility.reduceMotion}
                onChange={(e) => updateSetting('accessibility', 'reduceMotion', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Réduire les animations</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.accessibility.screenReader}
                onChange={(e) => updateSetting('accessibility', 'screenReader', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Mode lecteur d'écran</span>
            </label>
          </div>
        </div>
      </div>

      {/* Informations sur la sauvegarde */}
      <div className="mt-8 text-center">
        <div className={`inline-flex items-center px-4 py-2 rounded-full ${colors.bg} ${colors.border}`}>
          <CheckCircle className={`w-4 h-4 ${colors.text} mr-2`} />
          <span className={`text-sm ${colors.text}`}>
            Tous les réglages sont sauvegardés automatiquement dans ton navigateur
          </span>
        </div>
      </div>
    </div>
  )
}
