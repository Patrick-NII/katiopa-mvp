'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Send, Bot, User, ChevronLeft, ChevronRight, Settings, History, Star, Search, Plus, Archive } from 'lucide-react'

interface Message {
  id: string
  content: string
  sender: 'user' | 'bubix'
  timestamp: Date
}

interface BubixDedicatedWindowProps {
  user: any
  userType: 'CHILD' | 'PARENT'
}

export default function BubixDedicatedWindow({ user, userType }: BubixDedicatedWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Bonjour ${user?.firstName || 'cher utilisateur'} ! Je suis Bubix, votre assistant pédagogique. Comment puis-je vous aider aujourd'hui ?`,
      sender: 'bubix',
      timestamp: new Date()
    }
  ])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const startNewConversation = () => {
    setMessages([
      {
        id: '1',
        content: `Bonjour ${user?.firstName || 'cher utilisateur'} ! Je suis Bubix, votre assistant pédagogique. Comment puis-je vous aider aujourd'hui ?`,
        sender: 'bubix',
        timestamp: new Date()
      }
    ])
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setNewMessage('')
    setIsTyping(true)

    // Simulation de réponse de Bubix
    setTimeout(() => {
      const bubixResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `Merci pour votre message : "${newMessage}". Je suis là pour vous accompagner dans votre apprentissage !`,
        sender: 'bubix',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, bubixResponse])
      setIsTyping(false)
    }, 1500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="absolute inset-0 flex bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl  dark:border-gray-700/30 rounded-2xl shadow-2xl overflow-hidden">
      {/* Sidebar pliable */}
      <motion.div
        initial={{ width: sidebarCollapsed ? 0 : (window.innerWidth <= 768 ? 200 : 250) }}
        animate={{ width: sidebarCollapsed ? 0 : (window.innerWidth <= 768 ? 200 : 250) }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-gradient-to-b from-purple-500 to-pink-500 text-white overflow-hidden"
      >
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-3 md:p-4 h-full flex flex-col"
          >
            {/* Header avec recherche */}
            <div className="flex items-center gap-2 md:gap-3 mb-4">
              <div className="w-6 h-6 md:w-10 md:h-10 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center">
                <Search className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-thin text-white text-xs md:text-base hidden md:block">Recherche</h3>
              </div>
            </div>

            <div className="space-y-1 md:space-y-2 flex-1">
              <button className="w-full flex items-center gap-2 md:gap-3 p-1.5 md:p-3 rounded-xl hover:bg-white/20 transition-colors text-white">
                <History className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xs md:text-sm text-white hidden md:inline">Historique</span>
              </button>
              <button className="w-full flex items-center gap-2 md:gap-3 p-1.5 md:p-3 rounded-xl hover:bg-white/20 transition-colors text-white">
                <Star className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xs md:text-sm text-white hidden md:inline">Favoris</span>
              </button>
              <button className="w-full flex items-center gap-2 md:gap-3 p-1.5 md:p-3 rounded-xl hover:bg-white/20 transition-colors text-white">
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xs md:text-sm text-white hidden md:inline">Paramètres</span>
              </button>
            </div>

            <div className="mt-auto">
              <div className="bg-white/20 rounded-xl p-1.5 md:p-3">
                <p className="text-xs text-purple-100 mb-2 hidden md:block">Statut</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-white hidden md:inline">En ligne</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Zone principale */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-800 text-white p-2 md:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative">
              <MessageCircle className="w-4 h-4 md:w-6 md:h-6 text-white" />
              <div className="absolute -top-1 -right-1 w-2 h-2 md:w-3 md:h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
            <div className="hidden md:block">
              <h3 className="font-bold text-lg">Bubix Assistant</h3>
              <p className="text-purple-100 text-sm">Assistant pédagogique IA</p>
            </div>
            <div className="md:hidden">
              <h3 className="font-bold text-sm">Bubix</h3>
            </div>
          </div>
          
          {/* Boutons en haut à droite */}
          <div className="flex items-center gap-2">
            <button
              onClick={startNewConversation}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title="Nouvelle conversation"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => {/* Fonction pour ouvrir les conversations archivées */}}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title="Conversations archivées"
            >
              <Archive className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 md:space-y-4 bg-gray-50/50 dark:bg-gray-800/50">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-3 max-w-[80%] ${
                message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                }`}>
                  {message.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`rounded-2xl px-4 py-2 ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-gray-700 rounded-2xl px-4 py-2 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-2 md:p-4 border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2">
            {/* Bouton chevron pour mobile uniquement */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="md:hidden p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={sidebarCollapsed ? "Développer la sidebar" : "Réduire la sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" /> : <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />}
            </button>
            
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              className="flex-1 p-1.5 md:p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="p-1.5 md:p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg md:rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
