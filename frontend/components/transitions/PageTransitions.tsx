'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
  pageKey: string
  direction?: 'left' | 'right' | 'up' | 'down'
  duration?: number
}

export default function PageTransition({ 
  children, 
  pageKey, 
  direction = 'right',
  duration = 0.3 
}: PageTransitionProps) {
  const variants = {
    enter: (direction: string) => ({
      x: direction === 'left' ? -300 : direction === 'right' ? 300 : 0,
      y: direction === 'up' ? -300 : direction === 'down' ? 300 : 0,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      y: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: string) => ({
      x: direction === 'left' ? 300 : direction === 'right' ? -300 : 0,
      y: direction === 'up' ? 300 : direction === 'down' ? -300 : 0,
      opacity: 0,
      scale: 1.05
    })
  }

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={pageKey}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          duration,
          ease: [0.4, 0, 0.2, 1]
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Composant pour les transitions de liste (stagger)
interface StaggerTransitionProps {
  children: ReactNode[]
  delay?: number
  duration?: number
}

export function StaggerTransition({ 
  children, 
  delay = 0.1,
  duration = 0.2 
}: StaggerTransitionProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: delay
      }
    }
  }

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration,
        ease: "easeOut" as const
      }
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
          className="w-full"
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}

// Composant pour les transitions de chargement
interface LoadingTransitionProps {
  isLoading: boolean
  children: ReactNode
  loadingComponent?: ReactNode
}

export function LoadingTransition({ 
  isLoading, 
  children, 
  loadingComponent 
}: LoadingTransitionProps) {
  const defaultLoadingComponent = (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Chargement...</span>
    </div>
  )

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {loadingComponent || defaultLoadingComponent}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Composant pour les transitions de modal
interface ModalTransitionProps {
  isOpen: boolean
  children: ReactNode
  onClose?: () => void
}

export function ModalTransition({ 
  isOpen, 
  children, 
  onClose 
}: ModalTransitionProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
