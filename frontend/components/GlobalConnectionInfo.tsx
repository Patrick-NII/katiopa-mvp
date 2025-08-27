'use client'
import { useSession } from '../hooks/useSession'

interface GlobalConnectionInfoProps {
  registrationDate: string
  totalConnectionTime: number
}

export default function GlobalConnectionInfo({ registrationDate, totalConnectionTime }: GlobalConnectionInfoProps) {
  const { currentSessionTime } = useSession()

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

  const formatTotalTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / 3600000)
    const minutes = Math.floor((milliseconds % 3600000) / 60000)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  const formatRegistrationDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  return (
    <div className="flex items-center space-x-4 text-sm text-gray-600">
      {/* Session actuelle */}
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="font-mono">Session: {formatTime(currentSessionTime)}</span>
      </div>
      
      {/* Temps total depuis inscription */}
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        <span className="font-mono">Total: {formatTotalTime(totalConnectionTime)}</span>
      </div>
      
      {/* Date d'inscription */}
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
        <span>Membre depuis le {formatRegistrationDate(registrationDate)}</span>
      </div>
    </div>
  )
} 