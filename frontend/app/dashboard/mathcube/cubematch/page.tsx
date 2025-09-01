"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CubeMatch from '@/components/CubeMatch';
import { ArrowLeft, ChevronRight } from 'lucide-react';

export default function CubeMatchPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Fil d'Ariane + Retour */}
        <div className="flex items-center justify-between mb-4">
          <nav aria-label="Fil d'Ariane" className="text-sm text-gray-600">
            <ol className="flex items-center gap-1">
              <li>
                <Link href="/dashboard" className="hover:underline text-gray-700">Dashboard</Link>
              </li>
              <li className="text-gray-400">
                <ChevronRight className="inline-block w-4 h-4" />
              </li>
              <li>
                <Link href="/dashboard/mathcube" className="hover:underline text-gray-700">MathCube</Link>
              </li>
              <li className="text-gray-400">
                <ChevronRight className="inline-block w-4 h-4" />
              </li>
              <li className="text-gray-900 font-semibold">Cube Match</li>
            </ol>
          </nav>
          <button
            onClick={() => router.push('/dashboard/mathcube')}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>

        {/* Zone de jeu */}
        <div className="bg-white border rounded-xl shadow-sm p-2 sm:p-4">
          <CubeMatch />
        </div>
      </div>
    </div>
  );
}

