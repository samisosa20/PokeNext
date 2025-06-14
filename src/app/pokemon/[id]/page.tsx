
'use server';

import {Suspense } from 'react';
import PokemonDetailPageContent from '../_components/pokemon.detail';

export default function PokemonDetailPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 max-w-3xl text-center">Loading Pokémon details...</div>}>
      <PokemonDetailPageContent />
    </Suspense>
  );
}
