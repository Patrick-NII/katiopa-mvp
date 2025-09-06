import { useState, useEffect } from 'react'

interface LimitationState {
  isVisible: boolean
  message: string
  isCommercial: boolean
  showUpgrade: boolean
  childName?: string
}

interface LimitationSettings {
  dismissed: boolean
  remindLaterCount: number
  lastShown: number
}

const STORAGE_KEY = 'limitation-popup-settings'
const REMIND_INTERVAL = 24 * 60 * 60 * 1000 // 24 heures
const MAX_REMIND_LATER = 3 // Maximum 3 "voir plus tard"

export function useLimitationPopup() {
  const [limitationState, setLimitationState] = useState<LimitationState>({
    isVisible: false,
    message: '',
    isCommercial: false,
    showUpgrade: false
  })

  const [settings, setSettings] = useState<LimitationSettings>({
    dismissed: false,
    remindLaterCount: 0,
    lastShown: 0
  })

  // Charger les paramètres depuis le localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEY)
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error)
      }
    }
  }, [])

  // Sauvegarder les paramètres
  const saveSettings = (newSettings: LimitationSettings) => {
    setSettings(newSettings)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
  }

  // Vérifier si le popup doit être affiché
  const shouldShowPopup = (subscriptionInfo: any, userType: string): boolean => {
    // Ne pas afficher si déjà rejeté définitivement
    if (settings.dismissed) return false

    // Ne pas afficher pour les enfants
    if (userType === 'CHILD') return false

    // Ne pas afficher si pas de message de limitation
    if (!subscriptionInfo?.limitationMessage || !subscriptionInfo?.isCommercial) return false

    // Vérifier l'intervalle de rappel
    const now = Date.now()
    const timeSinceLastShown = now - settings.lastShown

    // Si "voir plus tard" utilisé trop de fois, ne plus afficher
    if (settings.remindLaterCount >= MAX_REMIND_LATER) return false

    // Afficher si jamais montré ou si intervalle écoulé
    return settings.lastShown === 0 || timeSinceLastShown >= REMIND_INTERVAL
  }

  // Afficher le popup
  const showPopup = (subscriptionInfo: any, userType: string, childName?: string) => {
    if (!shouldShowPopup(subscriptionInfo, userType)) return

    setLimitationState({
      isVisible: true,
      message: subscriptionInfo.limitationMessage,
      isCommercial: subscriptionInfo.isCommercial,
      showUpgrade: subscriptionInfo.showUpgrade,
      childName
    })

    // Mettre à jour la date de dernière affichage
    saveSettings({
      ...settings,
      lastShown: Date.now()
    })
  }

  // Fermer le popup
  const closePopup = () => {
    setLimitationState(prev => ({ ...prev, isVisible: false }))
  }

  // Action "Voir plus tard"
  const remindLater = () => {
    closePopup()
    saveSettings({
      ...settings,
      remindLaterCount: settings.remindLaterCount + 1,
      lastShown: Date.now()
    })
  }

  // Action "Non, merci" - Dismiss définitivement
  const dismiss = () => {
    closePopup()
    saveSettings({
      ...settings,
      dismissed: true
    })
  }

  // Action "Upgrade"
  const upgrade = () => {
    closePopup()
    // Rediriger vers la page d'abonnement
    window.location.href = '/register'
  }

  // Réinitialiser les paramètres (pour les tests)
  const resetSettings = () => {
    localStorage.removeItem(STORAGE_KEY)
    setSettings({
      dismissed: false,
      remindLaterCount: 0,
      lastShown: 0
    })
  }

  return {
    limitationState,
    showPopup,
    closePopup,
    remindLater,
    dismiss,
    upgrade,
    resetSettings,
    settings
  }
}
