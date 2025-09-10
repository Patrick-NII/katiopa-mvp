"use client";

import React, { useState, useEffect } from 'react';
import CubeMatchModal from '@/components/modals/CubeMatchModal';

export default function CubeMatchPage() {
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    setDimensions({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
      <CubeMatchModal
        isOpen={true}
        onClose={() => window.history.back()}
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

