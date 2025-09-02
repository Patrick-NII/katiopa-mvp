"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CubeMatch from '@/components/CubeMatch';
import DecorativeCubes from '@/components/DecorativeCubes';
import { ArrowLeft, ChevronRight } from 'lucide-react';

export default function CubeMatchPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
      <DecorativeCubes variant="intense" />

      <Navbar />
      <div className="max-w-7xl mx-auto px-0 py-16 relative z-10">
        {/* Fil d'Ariane + Retour avec effet gloss */}
        <div className="flex items-center justify-between mb-6">
          <nav aria-label="Fil d'Ariane" className="text-sm text-gray-600">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/dashboard" className="hover:underline text-gray-700 font-medium">Dashboard</Link>
              </li>
              <li className="text-gray-400">
                <ChevronRight className="inline-block w-4 h-4" />
              </li>
              <li>
                <Link href="/dashboard/mathcube" className="hover:underline text-gray-700 font-medium">MathCube</Link>
              </li>
              <li className="text-gray-400">
                <ChevronRight className="inline-block w-4 h-4" />
              </li>
              <li className="text-gray-900 font-bold text-lg">Cube Match</li>
            </ol>
          </nav>
        </div>

        {/* Zone de jeu avec effet gloss */}
        <div className="relative">
          {/* Effet de brillance/gloss */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-y-6 -translate-y-10 pointer-events-none"></div>
          
          <div className="r">
            {/* Effet de reflet */}
            
            {/* Contenu du jeu */}
            <div className="relative z-10">
              <CubeMatch />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

