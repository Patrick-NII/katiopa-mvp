"use client";

import React, { useState, useEffect } from 'react';
import CubeMatchModal from '@/components/modals/CubeMatchModal';

export default function CubeMatchPage() {
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    }
  }, []);

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden flex items-center justify-center">
        <div className="text-lg text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
      <CubeMatchModal
        isOpen={true}
        onClose={handleClose}
        onMinimize={() => {}}
        onMaximize={() => {}}
        onFullscreen={() => {}}
        isMinimized={false}
        isMaximized={false}
        isFullscreen={false}
        zIndex={1000}
        position={{ x: 0, y: 0 }}
        size={dimensions}
      />
    </div>
  );
}

