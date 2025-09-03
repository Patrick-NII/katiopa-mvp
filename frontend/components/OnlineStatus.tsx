'use client'

import { motion } from 'framer-motion'

interface OnlineStatusProps {
  isOnline: boolean
  lastActivity?: Date
  size?: 'sm' | 'md' | 'lg'
}

export default function OnlineStatus({ isOnline, lastActivity, size = 'md' }: OnlineStatusProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-2 h-2'
      case 'md':
        return 'w-3 h-3'
      case 'lg':
        return 'w-4 h-4'
      default:
        return 'w-3 h-3'
    }
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'À l\'instant'
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`
    return `Il y a ${Math.floor(diffInMinutes / 1440)}j`
  }

  return (
    <div className="flex items-center gap-2">
      <motion.div
        className={`${getSizeClasses()} rounded-full ${
          isOnline 
            ? 'bg-green-500 shadow-lg shadow-green-500/50' 
            : 'bg-gray-400'
        }`}
        animate={{
          scale: isOnline ? [1, 1.2, 1] : 1,
          opacity: isOnline ? [0.8, 1, 0.8] : 0.6
        }}
        transition={{
          duration: 2,
          repeat: isOnline ? Infinity : 0,
          ease: "easeInOut"
        }}
      />
      
      <span className={`text-xs font-medium ${
        isOnline ? 'text-green-600' : 'text-gray-500'
      }`}>
        {isOnline ? 'En ligne' : 'Hors ligne'}
      </span>
      
      {lastActivity && (
        <span className="text-xs text-gray-400">
          {getTimeAgo(lastActivity)}
        </span>
      )}
    </div>
  )
}

