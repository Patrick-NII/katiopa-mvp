"use client";

import Navbar from '@/components/NavBar';
import CubeMatch from '@/components/CubeMatch';

export default function CubeMatchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
      <Navbar />
      <div className="max-w-7xl mx-auto px-0 py-8 relative z-10">
        {/* Zone de jeu */}
        <div className="relative">
          <div className="relative z-10">
            <CubeMatch />
          </div>
        </div>
      </div>
    </div>
  );
}

