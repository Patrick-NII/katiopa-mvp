'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minimize2, Maximize2, Square, RotateCcw, MessageCircle, Send, Bot, User, ChevronLeft, ChevronRight, Settings, History, Star } from 'lucide-react'

interface BubixModalProps {
  isOpen: boolean
  onClose: () => void
  onMinimize: () => void
  onMaximize: () => void
  onFullscreen: () => void
  onReset: () => void
  isMinimized: boolean
  isMaximized: boolean
  isFullscreen: boolean
  position: { x: number; y: number }
  size: { width: number; height: number }
  zIndex: number
}

interface Message {
  id: string
  content: string
  sender: 'user' | 'bubix'
  timestamp: Date
}

export default function BubixModal({
  isOpen,
  onClose,
  onMinimize,
  onMaximize,
  onFullscreen,
  onReset,
  isMinimized,
  isMaximized,
  isFullscreen,
  position,
  size,
  zIndex
}: BubixModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Bonjour ! Je suis Bubix, votre assistant pédagogique. Comment puis-je vous aider aujourd\'hui ?',
      sender: 'bubix',
      timestamp: new Date()
    }
  ])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

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

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed bottom-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-xl shadow-lg cursor-pointer"
        onClick={onReset}
        style={{ zIndex: zIndex + 1000 }}
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Bubix</span>
        </div>
      </motion.div>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && !isMinimized && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 rounded-3xl shadow-2xl overflow-hidden flex"
          style={{
            left: isFullscreen ? 0 : isMaximized ? '5vw' : position.x,
            top: isFullscreen ? 0 : isMaximized ? '5vh' : position.y,
            width: isFullscreen ? '100vw' : isMaximized ? '90vw' : size.width,
            height: isFullscreen ? '100vh' : isMaximized ? '90vh' : size.height,
            zIndex: isFullscreen ? zIndex + 2000 : zIndex
          }}
        >
          {/* Sidebar pliable */}
          <motion.div
            initial={{ width: sidebarCollapsed ? 0 : 250 }}
            animate={{ width: sidebarCollapsed ? 0 : 250 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-gradient-to-b from-purple-500 to-pink-500 text-white overflow-hidden"
          >
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 h-full flex flex-col"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Bubix</h3>
                    <p className="text-purple-100 text-sm">Assistant IA</p>
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/20 transition-colors">
                    <History className="w-5 h-5" />
                    <span className="text-sm">Historique</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/20 transition-colors">
                    <Star className="w-5 h-5" />
                    <span className="text-sm">Favoris</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/20 transition-colors">
                    <Settings className="w-5 h-5" />
                    <span className="text-sm">Paramètres</span>
                  </button>
                </div>

                <div className="mt-auto">
                  <div className="bg-white/20 rounded-xl p-3">
                    <p className="text-xs text-purple-100 mb-2">Statut</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm">En ligne</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Zone principale */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title={sidebarCollapsed ? "Développer la sidebar" : "Réduire la sidebar"}
                >
                  {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
                <div className="relative">
                  <MessageCircle className="w-6 h-6" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Bubix Assistant</h3>
                  <p className="text-purple-100 text-sm">Assistant pédagogique IA</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={onMinimize}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Réduire"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onMaximize}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Agrandir"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onFullscreen}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Plein écran"
                >
                  <Square className="w-4 h-4" />
                </button>
                <button
                  onClick={onReset}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Réinitialiser"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                  title="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-800/50">
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
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tapez votre message..."
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}