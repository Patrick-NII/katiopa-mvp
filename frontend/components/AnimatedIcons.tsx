import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Trophy, Rocket, Sparkles } from 'lucide-react';

interface AnimatedIconProps {
  type: 'gift' | 'star' | 'crown' | 'home' | 'cube';
  className?: string;
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({ type, className = '' }) => {
  const getIconPath = () => {
    switch (type) {
      case 'gift':
        return '/icons/gift-icon.svg';
      case 'star':
        return '/icons/star-icon.svg';
      case 'crown':
        return '/icons/crown-icon.svg';
      case 'home':
        return '/icons/home-icon.svg';
      case 'cube':
        return '/icons/cube-icon.svg';
      default:
        return '/icons/gift-icon.svg';
    }
  };

  return (
    <div className={`w-12 h-12 ${className}`}>
      <img 
        src={getIconPath()} 
        alt={`${type} icon`}
        className="w-full h-full"
      />
    </div>
  );
};

export default AnimatedIcon;

// Composants d'icônes spécialisées avec animations
export function AnimatedCrown({ size = 24, className = "" }) {
  return (
    <motion.div
      whileHover={{ 
        scale: 1.2, 
        rotateY: 180,
        transition: { duration: 0.5 }
      }}
      animate={{ 
        y: [0, -5, 0],
        rotate: [0, 5, -5, 0]
      }}
      transition={{ 
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Crown size={size} className={className} />
    </motion.div>
  )
}

export function AnimatedStar({ size = 24, className = "" }) {
  return (
    <motion.div
      whileHover={{ scale: 1.3 }}
      animate={{ 
        rotate: [0, 360],
        scale: [1, 1.2, 1]
      }}
      transition={{ 
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Star size={size} className={className} />
    </motion.div>
  )
}

export function AnimatedTrophy({ size = 24, className = "" }) {
  return (
    <motion.div
      whileHover={{ scale: 1.2 }}
      animate={{ 
        y: [0, -3, 0],
        rotate: [0, 2, -2, 0]
      }}
      transition={{ 
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Trophy size={size} className={className} />
    </motion.div>
  )
}

export function AnimatedRocket({ size = 24, className = "" }) {
  return (
    <motion.div
      whileHover={{ scale: 1.3 }}
      animate={{ 
        x: [0, 10, 0],
        y: [0, -5, 0],
        rotate: [0, 5, -5, 0]
      }}
      transition={{ 
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Rocket size={size} className={className} />
    </motion.div>
  )
}

export function AnimatedSparkles({ size = 24, className = "" }) {
  return (
    <motion.div
      whileHover={{ scale: 1.4 }}
      animate={{ 
        rotate: [0, 180, 360],
        scale: [1, 1.3, 1]
      }}
      transition={{ 
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Sparkles size={size} className={className} />
    </motion.div>
  )
} 