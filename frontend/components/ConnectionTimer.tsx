'use client'
import { useState, useEffect } from 'react'

export default function ConnectionTimer() {
  const [connectionTime, setConnectionTime] = useState(0)

  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setConnectionTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span className="font-mono">{formatTime(connectionTime)}</span>
    </div>
  )
} 