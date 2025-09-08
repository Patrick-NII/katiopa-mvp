'use client'

import React, { useState } from 'react'
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
  ChevronRight
} from 'lucide-react'
import { useModals } from '@/hooks/useModals'
import ModalSystem from '@/components/modals/ModalSystem'
import SettingsModal from '@/components/modals/SettingsModal'
import SummaryCard from '@/components/cards/SummaryCard'

interface SettingsTabProps {
  userType: 'CHILD' | 'PARENT' | 'TEACHER' | 'ADMIN'
}

export default function SettingsTab({ userType }: SettingsTabProps) {
  const { modals, modalStates, openModal, closeModal, updateModal } = useModals()
  const [activeSection, setActiveSection] = useState<string>('profile')

  const isChild = userType === 'CHILD'

  const settingsSections = [
    {
      id: 'profile',
      title: 'Profil & Avatar',
      description: 'Personnalisez votre profil et choisissez votre avatar',
      icon: <User className="w-6 h-6 text-white" />,
      color: 'blue' as const
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Configurez vos préférences de notifications',
      icon: <Bell className="w-6 h-6 text-white" />,
      color: 'orange' as const
    },
    {
      id: 'privacy',
      title: 'Confidentialité',
      description: 'Gérez vos paramètres de confidentialité et sécurité',
      icon: <Shield className="w-6 h-6 text-white" />,
      color: 'green' as const
    },
    {
      id: 'appearance',
      title: 'Apparence',
      description: 'Personnalisez le thème et l\'apparence de l\'application',
      icon: <Palette className="w-6 h-6 text-white" />,
      color: 'purple' as const
    },
    {
      id: 'accessibility',
      title: 'Accessibilité',
      description: 'Adaptez l\'interface à vos besoins spécifiques',
      icon: <Accessibility className="w-6 h-6 text-white" />,
      color: 'indigo' as const
    },
    {
      id: 'language',
      title: 'Langue & Région',
      description: 'Choisissez votre langue et vos préférences régionales',
      icon: <Globe className="w-6 h-6 text-white" />,
      color: 'pink' as const
    }
  ]

  const childSpecificSections = [
    {
      id: 'learning',
      title: 'Préférences d\'Apprentissage',
      description: 'Adaptez l\'apprentissage à votre style',
      icon: <Brain className="w-6 h-6 text-white" />,
      color: 'blue' as const
    },
    {
      id: 'games',
      title: 'Jeux & Activités',
      description: 'Configurez vos jeux préférés',
      icon: <Gamepad2 className="w-6 h-6 text-white" />,
      color: 'orange' as const
    }
  ]

  const parentSpecificSections = [
    {
      id: 'family',
      title: 'Gestion Familiale',
      description: 'Gérez les profils et paramètres de votre famille',
      icon: <Users className="w-6 h-6 text-white" />,
      color: 'green' as const
    },
    {
      id: 'monitoring',
      title: 'Suivi & Contrôle',
      description: 'Configurez le suivi des activités de vos enfants',
      icon: <Target className="w-6 h-6 text-white" />,
      color: 'purple' as const
    }
  ]

  const allSections = isChild 
    ? [...settingsSections, ...childSpecificSections]
    : [...settingsSections, ...parentSpecificSections]

  const openSettingsModal = (sectionId: string) => {
    const section = allSections.find(s => s.id === sectionId)
    if (!section) return

    openModal({
      id: `settings-${sectionId}`,
      title: section.title,
      size: 'large',
      closable: true,
      minimizable: true,
      maximizable: true,
      onClose: () => closeModal(`settings-${sectionId}`),
      children: (
        <SettingsModal
          sectionId={sectionId}
          title={section.title}
          icon={section.icon}
          color={section.color}
          userType={userType}
          onClose={() => closeModal(`settings-${sectionId}`)}
        />
      )
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Paramètres
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Personnalisez votre expérience {isChild ? 'd\'apprentissage' : 'parentale'}
        </p>
      </div>

      {/* Sections Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
          {allSections.map((section) => (
            <SummaryCard
              key={section.id}
              title={section.title}
              description={section.description}
              icon={section.icon}
              color={section.color}
              actionLabel="Configurer"
              onAction={() => openSettingsModal(section.id)}
            />
          ))}
        </div>
      </div>

      {/* Modal System */}
      <ModalSystem 
        modals={modals}
        modalStates={modalStates}
        onModalChange={(id, updates) => updateModal(id, updates)}
      />
    </div>
  )
}
