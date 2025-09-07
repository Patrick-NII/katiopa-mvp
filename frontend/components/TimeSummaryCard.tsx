'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, TrendingUp, Calendar, Users, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react'

interface TimeSummaryCardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ComponentType<any>
  color: string
  children?: React.ReactNode
  isExpandable?: boolean
}

export default function TimeSummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  children,
  isExpandable = false
}: TimeSummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r from-${color}-50 to-${color}-100 p-6 rounded-xl border border-${color}-200 shadow-sm hover:shadow-md transition-all duration-300`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg bg-${color}-200`}>
            <Icon className={`w-6 h-6 text-${color}-700`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
        </div>
        
        {isExpandable && (
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-lg transition-colors ${
              isExpanded 
                ? `bg-${color}-200 text-${color}-700` 
                : `text-${color}-600 hover:bg-${color}-100`
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </motion.button>
        )}
      </div>

      <div className="mb-4">
        <div className={`text-3xl font-bold text-${color}-800 mb-2`}>
          {value}
        </div>
        <div className={`text-sm text-${color}-600`}>
          {subtitle}
        </div>
      </div>

      {/* Contenu expandable */}
      {isExpandable && (
        <motion.div
          initial={false}
          animate={{ 
            height: isExpanded ? 'auto' : 0,
            opacity: isExpanded ? 1 : 0
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className={`border-t border-${color}-200 pt-4`}>
            {children}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
