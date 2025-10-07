'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useModals, UseModalsReturn } from '@/hooks/useModals'

interface ModalContextType extends UseModalsReturn {}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: { children: ReactNode }) {
  const modalsHook = useModals()
  
  return (
    <ModalContext.Provider value={modalsHook}>
      {children}
    </ModalContext.Provider>
  )
}

export function useModalContext(): ModalContextType {
  const context = useContext(ModalContext)
  if (context === undefined) {
    throw new Error('useModalContext must be used within a ModalProvider')
  }
  return context
}

