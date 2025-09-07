"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/NavBar';
import CubeMatch from '@/components/CubeMatch';
import DecorativeCubes from '@/components/DecorativeCubes';
import { ArrowLeft, ChevronRight, X } from 'lucide-react';

export default function CubeMatchPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      <div className="h-screen pt-16">
        {/* Boutons de navigation */}
        <div className="absolute top-20 left-6 z-20 flex gap-3">
          <button
            onClick={() => router.push('/dashboard/mathcube')}
            className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 hover:bg-white transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600 transition-all duration-200"
          >
            <X className="w-4 h-4" />
            Stop
          </button>
        </div>

        {/* Zone de jeu */}
        <div className="h-full">
          <CubeMatch />
        </div>
      </div>
    </div>
  );
}

