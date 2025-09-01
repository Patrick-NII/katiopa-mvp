'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, User, Settings } from 'lucide-react'

interface AvatarSelectorProps {
  currentAvatar?: string
  onAvatarChange: (avatarPath: string) => void
  userType: 'CHILD' | 'PARENT' | 'TEACHER' | 'ADMIN'
}

export default function AvatarSelector({ 
  currentAvatar, 
  onAvatarChange, 
  userType 
}: AvatarSelectorProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar || '')
  const [isOpen, setIsOpen] = useState(false)

  // Liste des avatars disponibles
  const avatars = [
    '/avatar/DF43E25C-2338-4B0A-B541-F3C9C6749C70_1_105_c.jpeg',
    '/avatar/C680597F-C476-47A3-8AFD-5BF7480AB18F_1_105_c.jpeg',
    '/avatar/9032E0D4-24CB-43FF-A828-D73BACF6A2CB_1_105_c.jpeg',
    '/avatar/AFABF252-DC83-4CB8-96FD-F93E4848144F_1_105_c.jpeg',
    '/avatar/630F3A22-5A32-4B9D-89F2-BE41C6D06047_1_105_c.jpeg',
    '/avatar/B651627E-16E8-4B38-964C-52AC717EA8A6_1_105_c.jpeg',
    '/avatar/4585039E-FE54-402B-967A-49505261DCCA_1_105_c.jpeg',
    '/avatar/46634418-D597-4138-A12C-ED6DB610C8BD_1_105_c.jpeg',
    '/avatar/1643C2A2-D991-4327-878E-6A5B94E0C320_1_105_c.jpeg',
    '/avatar/17AF2653-1B7A-43F7-B376-0616FC6C0DBD_1_105_c.jpeg',
    '/avatar/45840AC6-AFFE-46E0-9668-51CFD4C9740B_1_105_c.jpeg',
    '/avatar/54E70A9E-8558-429D-87D6-52DECAAF983D_1_105_c.jpeg',
    '/avatar/4456CAC7-32C6-4419-967E-291D37C9B368_1_105_c.jpeg',
    '/avatar/358DF2B2-AE4E-4359-AB2E-DD45D240D78F_1_105_c.jpeg',
    '/avatar/013BDBD7-230C-4ECD-B292-2C66159ACCBC_1_105_c.jpeg',
    '/avatar/840CE97E-2237-41EE-9559-E3A152359D61_1_105_c.jpeg',
    '/avatar/01A68700-5E6F-4EA5-A6B6-2E954AD53A0D_1_105_c.jpeg'
  ]

  // Obtenir l'avatar par défaut basé sur le type d'utilisateur
  const getDefaultAvatar = () => {
    if (userType === 'CHILD') {
      // Avatars plus colorés et amusants pour les enfants
      return avatars[Math.floor(Math.random() * 8)]
    } else {
      // Avatars plus professionnels pour les parents
      return avatars[Math.floor(Math.random() * 8) + 8]
    }
  }

  // Initialiser l'avatar sélectionné
  useEffect(() => {
    if (!selectedAvatar) {
      const defaultAvatar = getDefaultAvatar()
      setSelectedAvatar(defaultAvatar)
      onAvatarChange(defaultAvatar)
    }
  }, [])

  // Gérer la sélection d'un avatar
  const handleAvatarSelect = (avatarPath: string) => {
    setSelectedAvatar(avatarPath)
    onAvatarChange(avatarPath)
    setIsOpen(false)
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
    <div className="w-full">
      {/* En-tête de la section avatar */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className={`w-10 h-10 bg-gradient-to-r ${colors.gradient} rounded-full flex items-center justify-center`}>
            <User className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Personnalisation de l'avatar</h2>
        </div>
        
      </div>

      {/* Avatar actuel */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Avatar actuel</h3>
        <div className="flex items-center space-x-4 p-4 bg-white rounded-2xl border border-gray-200">
          <img
            src={selectedAvatar}
            alt="Avatar actuel"
            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
          />
          <div>
            <p className="font-medium text-gray-900">
              Avatar sélectionné
            </p>
            <p className="text-sm text-gray-600">
              Clique sur "Changer d'avatar" pour en choisir un autre
            </p>
          </div>
        </div>
      </div>

      {/* Bouton pour ouvrir le sélecteur */}
      <button
        onClick={() => setIsOpen(true)}
        className={`w-full py-3 px-6 bg-gradient-to-r ${colors.gradient} text-white rounded-2xl font-medium hover:shadow-lg transition-shadow mb-6`}
      >
        Changer d'avatar
      </button>

      {/* Modal de sélection d'avatar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* En-tête du modal */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Choisir un avatar
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Grille d'avatars */}
              <div className="grid grid-cols-4 md:grid-cols-6 gap-4 mb-6">
                {avatars.map((avatar, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleAvatarSelect(avatar)}
                    className={`relative group p-2 rounded-2xl transition-all duration-200 ${
                      selectedAvatar === avatar 
                        ? 'ring-4 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50 hover:scale-105'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img
                      src={avatar}
                      alt={`Avatar ${index + 1}`}
                      className="w-full h-full rounded-xl object-cover"
                    />
                    
                    {/* Indicateur de sélection */}
                    {selectedAvatar === avatar && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}

                    {/* Overlay au survol */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-colors" />
                  </motion.button>
                ))}
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className={`px-6 py-2 bg-gradient-to-r ${colors.gradient} text-white rounded-xl font-medium hover:shadow-lg transition-shadow`}
                >
                  Confirmer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

     
      
    </div>
  )
}
