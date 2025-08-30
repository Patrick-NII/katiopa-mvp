'use client';

import { motion } from 'framer-motion';

// Palette de couleurs multicolores conseillée
const colors = [
  "#3B82F6", // bleu ciel - énergie, fraîcheur
  "#8B5CF6", // violet doux - créativité, magie
  "#EC4899", // rose framboise - fun, affectif
  "#10B981", // vert menthe - nature, équilibre
  "#F59E0B"  // orange pêche - dynamisme, chaleur
];

interface MulticolorTextProps {
  text: string;
  variant?: 'h1' | 'h2' | 'h3' | 'logo';
  className?: string;
  staggerDelay?: number;
  animate?: boolean;
}

export function MulticolorText({ 
  text, 
  variant = 'h1', 
  className = '', 
  staggerDelay = 0.1,
  animate = true 
}: MulticolorTextProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'h1':
        return 'h1-multicolor font-title text-5xl md:text-7xl leading-tight';
      case 'h2':
        return 'h2-multicolor font-title text-4xl md:text-6xl leading-tight';
      case 'h3':
        return 'h2-multicolor font-title text-3xl md:text-5xl leading-tight';
      case 'logo':
        return 'logo-multicolor font-title text-4xl';
      default:
        return 'h1-multicolor font-title text-5xl md:text-7xl leading-tight';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: animate ? staggerDelay : 0,
        delayChildren: 0.1
      }
    }
  };

  const letterVariants = {
    hidden: { 
      opacity: 0, 
      y: 20, 
      scale: 0.8,
      rotate: -5
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  return (
    <motion.div
      className={`${getVariantClasses()} ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          variants={animate ? letterVariants : {}}
          style={{ 
            color: colors[i % colors.length],
            display: char === ' ' ? 'inline' : 'inline-block'
          }}
          whileHover={animate ? {
            scale: 1.1,
            rotate: 2,
            transition: { type: "spring", stiffness: 300, damping: 15 }
          } : {}}
          className={char === ' ' ? 'mx-1' : ''}
        >
          {char}
        </motion.span>
      ))}
    </motion.div>
  );
}

// Composant spécialisé pour le logo CubeAI
export function CubeAILogo({ className = '' }: { className?: string }) {
  return (
    <div className={`logo-multicolor ${className}`}>
      <span>C</span>
      <span>u</span>
      <span>b</span>
      <span>e</span>
      <span>A</span>
      <span>I</span>
    </div>
  );
}

// Composant pour les titres H1 multicolores
export function H1Multicolor({ text, className = '' }: { text: string; className?: string }) {
  return (
    <MulticolorText 
      text={text} 
      variant="h1" 
      className={className}
      staggerDelay={0.1}
    />
  );
}

// Composant pour les titres H2 multicolores
export function H2Multicolor({ text, className = '' }: { text: string; className?: string }) {
  return (
    <MulticolorText 
      text={text} 
      variant="h2" 
      className={className}
      staggerDelay={0.08}
    />
  );
}

// Composant pour les titres H3 multicolores
export function H3Multicolor({ text, className = '' }: { text: string; className?: string }) {
  return (
    <MulticolorText 
      text={text} 
      variant="h3" 
      className={className}
      staggerDelay={0.06}
    />
  );
}

// Composant pour les textes multicolores animés
export function AnimatedMulticolorText({ 
  text, 
  variant = 'h1', 
  className = '',
  staggerDelay = 0.1 
}: MulticolorTextProps) {
  return (
    <MulticolorText 
      text={text} 
      variant={variant} 
      className={`${className} multicolor-animate`}
      staggerDelay={staggerDelay}
      animate={true}
    />
  );
}
