'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface CompetenceData {
  competence: string
  score: number
  maxScore: number
}

interface ChildProfile {
  id: string
  name: string
  color: string
  data: CompetenceData[]
}

interface RadarDataContextType {
  profiles: ChildProfile[]
  setProfiles: (profiles: ChildProfile[]) => void
  focusedCompetence: string
  setFocusedCompetence: (competence: string) => void
  selectedChildId: string
  setSelectedChildId: (childId: string) => void
}

const RadarDataContext = createContext<RadarDataContextType | undefined>(undefined)

export function RadarDataProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<ChildProfile[]>([])
  const [focusedCompetence, setFocusedCompetence] = useState<string>('')
  const [selectedChildId, setSelectedChildId] = useState<string>('')

  return (
    <RadarDataContext.Provider value={{
      profiles,
      setProfiles,
      focusedCompetence,
      setFocusedCompetence,
      selectedChildId,
      setSelectedChildId
    }}>
      {children}
    </RadarDataContext.Provider>
  )
}

export function useRadarDataContext() {
  const context = useContext(RadarDataContext)
  if (context === undefined) {
    throw new Error('useRadarDataContext must be used within a RadarDataProvider')
  }
  return context
}
