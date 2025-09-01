"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CubeMatch from '@/components/CubeMatch';
import { ArrowLeft, ChevronRight } from 'lucide-react';

export default function CubeMatchPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Cubes flottants colorés avec effet 3D */}
      <div className="absolute inset-0 pointer-events-none" style={{ top: '80px' }}>
        {/* Cube rouge - grand */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-xl transform rotate-12 animate-pulse opacity-70" style={{ animationDuration: '4s', boxShadow: '0 8px 32px rgba(239, 68, 68, 0.3)' }}></div>
        
        {/* Cube orange - moyen */}
        <div className="absolute top-60 right-20 w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl transform -rotate-12 animate-bounce opacity-80" style={{ animationDuration: '6s', boxShadow: '0 6px 24px rgba(251, 146, 60, 0.3)' }}></div>
        
        {/* Cube jaune - petit */}
        <div className="absolute top-100 left-1/4 w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl transform rotate-45 animate-pulse opacity-60" style={{ animationDuration: '5s', boxShadow: '0 4px 16px rgba(251, 191, 36, 0.3)' }}></div>
        
        {/* Cube vert - très grand */}
        <div className="absolute top-140 right-1/3 w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-xl transform -rotate-45 animate-bounce opacity-75" style={{ animationDuration: '7s', boxShadow: '0 12px 40px rgba(34, 197, 94, 0.3)' }}></div>
        
        {/* Cube bleu - moyen */}
        <div className="absolute top-180 left-1/2 w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl transform rotate-30 animate-pulse opacity-65" style={{ animationDuration: '4.5s', boxShadow: '0 8px 28px rgba(59, 130, 246, 0.3)' }}></div>
        
        {/* Cube violet - petit */}
        <div className="absolute top-220 right-10 w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl transform -rotate-30 animate-bounce opacity-70" style={{ animationDuration: '6.5s', boxShadow: '0 6px 20px rgba(147, 51, 234, 0.3)' }}></div>
        
        {/* Cube rose - très petit */}
        <div className="absolute top-260 left-1/3 w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl transform rotate-60 animate-pulse opacity-55" style={{ animationDuration: '3.5s', boxShadow: '0 3px 12px rgba(236, 72, 153, 0.3)' }}></div>
        
        {/* Cube cyan - grand */}
        <div className="absolute top-300 right-1/4 w-18 h-18 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl transform -rotate-60 animate-bounce opacity-80" style={{ animationDuration: '5.5s', boxShadow: '0 10px 32px rgba(34, 211, 238, 0.3)' }}></div>
        
        {/* Cube indigo - moyen */}
        <div className="absolute top-340 left-20 w-15 h-15 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl transform rotate-15 animate-pulse opacity-75" style={{ animationDuration: '4.8s', boxShadow: '0 7px 24px rgba(99, 102, 241, 0.3)' }}></div>
        
        {/* Cube émeraude - très grand */}
        <div className="absolute top-380 right-1/2 w-22 h-22 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl transform -rotate-75 animate-bounce opacity-70" style={{ animationDuration: '6.8s', boxShadow: '0 14px 44px rgba(16, 185, 129, 0.3)' }}></div>
        
        {/* Cube lime - petit */}
        <div className="absolute top-420 left-1/5 w-11 h-11 bg-gradient-to-br from-lime-400 to-lime-600 rounded-xl transform rotate-25 animate-pulse opacity-65" style={{ animationDuration: '4.2s', boxShadow: '0 5px 18px rgba(132, 204, 22, 0.3)' }}></div>
        
        {/* Cube teal - moyen */}
        <div className="absolute top-460 right-1/6 w-13 h-13 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl transform -rotate-40 animate-bounce opacity-85" style={{ animationDuration: '5.8s', boxShadow: '0 7px 26px rgba(20, 184, 166, 0.3)' }}></div>
        
        {/* Cube amber - grand */}
        <div className="absolute top-500 left-1/7 w-19 h-19 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl transform rotate-50 animate-pulse opacity-60" style={{ animationDuration: '4.6s', boxShadow: '0 9px 30px rgba(245, 158, 11, 0.3)' }}></div>
        
        {/* Cube sky - très petit */}
        <div className="absolute top-540 right-1/8 w-9 h-9 bg-gradient-to-br from-sky-400 to-sky-600 rounded-xl transform -rotate-20 animate-bounce opacity-70" style={{ animationDuration: '3.8s', boxShadow: '0 4px 14px rgba(14, 165, 233, 0.3)' }}></div>
        
        {/* Cube violet - moyen */}
        <div className="absolute top-580 left-1/9 w-17 h-17 bg-gradient-to-br from-violet-400 to-violet-600 rounded-xl transform rotate-35 animate-pulse opacity-75" style={{ animationDuration: '5.2s', boxShadow: '0 8px 28px rgba(139, 92, 246, 0.3)' }}></div>
        
                 {/* Cube fuchsia - petit */}
         <div className="absolute top-620 right-1/10 w-12 h-12 bg-gradient-to-br from-fuchsia-400 to-fuchsia-600 rounded-xl transform -rotate-55 animate-bounce opacity-80" style={{ animationDuration: '6.2s', boxShadow: '0 6px 22px rgba(217, 70, 239, 0.3)' }}></div>
         
         {/* GROS CUBE en bas à droite */}
         <div className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl transform rotate-20 animate-pulse opacity-90" style={{ animationDuration: '8s', boxShadow: '0 20px 60px rgba(59, 130, 246, 0.4)' }}></div>
         
         {/* Cubes sous la zone de jeux */}
         <div className="absolute top-700 left-1/4 w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl transform -rotate-15 animate-bounce opacity-75" style={{ animationDuration: '5.5s', boxShadow: '0 8px 24px rgba(251, 146, 60, 0.3)' }}></div>
         
         <div className="absolute top-750 right-1/3 w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl transform rotate-40 animate-pulse opacity-70" style={{ animationDuration: '6.3s', boxShadow: '0 10px 28px rgba(34, 197, 94, 0.3)' }}></div>
         
         <div className="absolute top-800 left-1/2 w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl transform -rotate-30 animate-bounce opacity-80" style={{ animationDuration: '4.7s', boxShadow: '0 6px 20px rgba(236, 72, 153, 0.3)' }}></div>
         
         <div className="absolute top-850 right-1/5 w-18 h-18 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl transform rotate-25 animate-pulse opacity-65" style={{ animationDuration: '7.1s', boxShadow: '0 12px 32px rgba(34, 211, 238, 0.3)' }}></div>
         
         <div className="absolute top-900 left-1/6 w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl transform -rotate-50 animate-bounce opacity-85" style={{ animationDuration: '5.9s', boxShadow: '0 5px 16px rgba(251, 191, 36, 0.3)' }}></div>
         
         {/* Cubes supplémentaires sous la zone de jeu */}
         <div className="absolute top-950 right-1/7 w-15 h-15 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl transform rotate-35 animate-pulse opacity-70" style={{ animationDuration: '6.8s', boxShadow: '0 9px 26px rgba(99, 102, 241, 0.3)' }}></div>
         
         <div className="absolute top-1000 left-1/8 w-13 h-13 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl transform -rotate-25 animate-bounce opacity-80" style={{ animationDuration: '5.3s', boxShadow: '0 7px 22px rgba(20, 184, 166, 0.3)' }}></div>
         
         <div className="absolute top-1050 right-1/9 w-11 h-11 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl transform rotate-45 animate-pulse opacity-75" style={{ animationDuration: '4.9s', boxShadow: '0 6px 18px rgba(244, 63, 94, 0.3)' }}></div>
         
         <div className="absolute top-1100 left-1/10 w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl transform -rotate-40 animate-bounce opacity-65" style={{ animationDuration: '7.2s', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)' }}></div>
         
         <div className="absolute top-1150 right-1/11 w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl transform rotate-30 animate-pulse opacity-85" style={{ animationDuration: '5.6s', boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)' }}></div>
       </div>

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

