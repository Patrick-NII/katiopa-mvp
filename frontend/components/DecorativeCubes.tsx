"use client";

import React, { useState, useEffect } from 'react';

interface DecorativeCubesProps {
  variant?: 'default' | 'minimal' | 'intense' | 'glassmorphism';
  className?: string;
}

const DecorativeCubes: React.FC<DecorativeCubesProps> = ({ 
  variant = 'default', 
  className = '' 
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Générateur de nombres pseudo-aléatoires déterministe
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const getCubeStyles = (type: string, size: number, color: string, position: string, index: number) => {
    const baseStyles = {
      position: 'absolute' as const,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '12px',
      pointerEvents: 'none' as const,
      zIndex: 0,
    };

    switch (type) {
      case '3d':
        return {
          ...baseStyles,
          background: `linear-gradient(135deg, ${color}40, ${color}80)`,
          transform: `rotate(${seededRandom(index + 1) * 45}deg)`,
          boxShadow: `0 ${size/3}px ${size/2}px ${color}30, inset 0 2px 4px rgba(255,255,255,0.3)`,
          animation: 'float 6s ease-in-out infinite',
        };
      case 'relief':
        return {
          ...baseStyles,
          background: `linear-gradient(145deg, ${color}60, ${color}40)`,
          transform: `rotate(${seededRandom(index + 2) * 30}deg)`,
          boxShadow: `0 4px 8px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.4)`,
          animation: 'breathe 8s ease-in-out infinite',
        };
      case 'hollow':
        return {
          ...baseStyles,
          background: 'transparent',
          border: `2px solid ${color}60`,
          transform: `rotate(${seededRandom(index + 3) * 60}deg)`,
          boxShadow: `0 2px 4px ${color}20`,
          animation: 'pulse 5s ease-in-out infinite',
        };
      case 'gradient':
        return {
          ...baseStyles,
          background: `linear-gradient(45deg, ${color}50, ${color}80, ${color}60)`,
          transform: `rotate(${seededRandom(index + 4) * 90}deg)`,
          boxShadow: `0 ${size/4}px ${size/3}px ${color}40`,
          animation: 'rotate 12s linear infinite',
        };
      case 'glass':
        return {
          ...baseStyles,
          background: `linear-gradient(135deg, ${color}20, ${color}40)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${color}30`,
          transform: `rotate(${seededRandom(index + 5) * 45}deg)`,
          boxShadow: `0 8px 32px ${color}20, inset 0 1px 0 rgba(255,255,255,0.2)`,
          animation: 'glassFloat 8s ease-in-out infinite',
        };
      case 'neon':
        return {
          ...baseStyles,
          background: `radial-gradient(circle, ${color}60, ${color}30)`,
          transform: `rotate(${seededRandom(index + 6) * 30}deg)`,
          boxShadow: `0 0 ${size/2}px ${color}80, 0 0 ${size}px ${color}60, 0 0 ${size*1.5}px ${color}40`,
          animation: 'neonPulse 4s ease-in-out infinite',
        };
      case 'crystal':
        return {
          ...baseStyles,
          borderRadius: '50%',
          background: `conic-gradient(from 0deg, ${color}40, ${color}80, ${color}40)`,
          transform: `rotate(${seededRandom(index + 7) * 360}deg)`,
          boxShadow: `0 4px 16px ${color}30, inset 0 2px 4px rgba(255,255,255,0.3)`,
          animation: 'crystalSpin 10s linear infinite',
        };
      case 'floating':
        return {
          ...baseStyles,
          background: `linear-gradient(135deg, ${color}30, ${color}60)`,
          transform: `rotate(${seededRandom(index + 8) * 60}deg)`,
          boxShadow: `0 ${size/3}px ${size/2}px ${color}20`,
          animation: 'floatingMove 9s ease-in-out infinite',
        };
      default:
        return {
          ...baseStyles,
          background: `linear-gradient(135deg, ${color}60, ${color}80)`,
          transform: `rotate(${seededRandom(index + 9) * 45}deg)`,
          boxShadow: `0 ${size/4}px ${size/3}px ${color}30`,
          animation: 'float 7s ease-in-out infinite',
        };
    }
  };

  const colors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B',
    '#EF4444', '#06B6D4', '#84CC16', '#F97316', '#A855F7'
  ];

  const cubeTypes = ['3d', 'relief', 'hollow', 'gradient', 'glass', 'neon', 'crystal', 'floating', 'default'];
  const sizes = [8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 74, 78, 82, 86, 90];

  const getCubesForVariant = () => {
    switch (variant) {
      case 'minimal':
        return 8;
      case 'intense':
        return 25;
      case 'glassmorphism':
        return 20;
      default:
        return 15;
    }
  };

  // Zones de distribution pour une meilleure répartition
  const distributionZones = [
    // Zone supérieure gauche
    { top: { min: 50, max: 150 }, left: { min: 5, max: 25 } },
    // Zone supérieure centre-gauche
    { top: { min: 80, max: 180 }, left: { min: 25, max: 45 } },
    // Zone supérieure centre-droite
    { top: { min: 60, max: 160 }, left: { min: 45, max: 65 } },
    // Zone supérieure droite
    { top: { min: 70, max: 170 }, left: { min: 65, max: 85 } },
    // Zone centrale gauche
    { top: { min: 200, max: 350 }, left: { min: 8, max: 28 } },
    // Zone centrale centre-gauche
    { top: { min: 220, max: 370 }, left: { min: 28, max: 48 } },
    // Zone centrale centre-droite
    { top: { min: 240, max: 390 }, left: { min: 48, max: 68 } },
    // Zone centrale droite
    { top: { min: 260, max: 410 }, left: { min: 68, max: 88 } },
    // Zone inférieure gauche
    { top: { min: 400, max: 600 }, left: { min: 10, max: 30 } },
    // Zone inférieure centre-gauche
    { top: { min: 420, max: 620 }, left: { min: 30, max: 50 } },
    // Zone inférieure centre-droite
    { top: { min: 440, max: 640 }, left: { min: 50, max: 70 } },
    // Zone inférieure droite
    { top: { min: 460, max: 660 }, left: { min: 70, max: 90 } },
    // Zones supplémentaires pour les variantes intenses
    { top: { min: 300, max: 450 }, left: { min: 15, max: 35 } },
    { top: { min: 320, max: 470 }, left: { min: 35, max: 55 } },
    { top: { min: 340, max: 490 }, left: { min: 55, max: 75 } },
    { top: { min: 360, max: 510 }, left: { min: 75, max: 95 } },
    { top: { min: 500, max: 700 }, left: { min: 20, max: 40 } },
    { top: { min: 520, max: 720 }, left: { min: 40, max: 60 } },
    { top: { min: 540, max: 740 }, left: { min: 60, max: 80 } },
    { top: { min: 560, max: 760 }, left: { min: 80, max: 95 } },
  ];

  const cubes = Array.from({ length: getCubesForVariant() }, (_, i) => {
    const color = colors[i % colors.length];
    const size = sizes[i % sizes.length];
    const type = cubeTypes[i % cubeTypes.length];
    
    // Utiliser les zones de distribution pour une meilleure répartition
    const zone = distributionZones[i % distributionZones.length];
    const top = zone.top.min + seededRandom(i + 10) * (zone.top.max - zone.top.min);
    const left = zone.left.min + seededRandom(i + 11) * (zone.left.max - zone.left.min);
    
    return {
      id: i,
      style: getCubeStyles(type, size, color, `${top}px ${left}%`, i),
      top,
      left: `${left}%`,
    };
  });

  return (
    <>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(var(--rotation)); }
          50% { transform: translateY(-10px) rotate(var(--rotation)); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1) rotate(var(--rotation)); opacity: 0.7; }
          50% { transform: scale(1.1) rotate(var(--rotation)); opacity: 0.9; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: rotate(var(--rotation)); }
          50% { opacity: 0.8; transform: rotate(var(--rotation)); }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes glassFloat {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(var(--rotation)); opacity: 0.6; }
          25% { transform: translateY(-8px) translateX(4px) rotate(var(--rotation)); opacity: 0.8; }
          50% { transform: translateY(-12px) translateX(0px) rotate(var(--rotation)); opacity: 0.9; }
          75% { transform: translateY(-6px) translateX(-3px) rotate(var(--rotation)); opacity: 0.7; }
        }
        @keyframes neonPulse {
          0%, 100% { opacity: 0.5; transform: scale(1) rotate(var(--rotation)); }
          50% { opacity: 1; transform: scale(1.2) rotate(var(--rotation)); }
        }
        @keyframes crystalSpin {
          from { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
          to { transform: rotate(360deg) scale(1); }
        }
        @keyframes floatingMove {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(var(--rotation)); }
          25% { transform: translateY(-15px) translateX(8px) rotate(var(--rotation)); }
          50% { transform: translateY(-20px) translateX(0px) rotate(var(--rotation)); }
          75% { transform: translateY(-10px) translateX(-5px) rotate(var(--rotation)); }
        }
      `}</style>
      
      {/* Ne render que côté client pour éviter les problèmes d'hydratation */}
      {isClient && (
        <div className={`absolute inset-0 pointer-events-none ${className}`} style={{ top: '0px' }}>
          {cubes.map((cube) => (
            <div
              key={cube.id}
              className="absolute"
              style={{
                ...cube.style,
                top: `${cube.top}px`,
                left: cube.left,
                ['--rotation' as string]: `${seededRandom(cube.id + 12) * 360}deg`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default DecorativeCubes;
