'use server'
import { Suspense } from 'react';

import { fetchAllPokemonData } from '@/lib/pokemon-api';
import type { AppPokemon } from '@/lib/pokemon-api';
import HomePageContent from './pokemon/_components/home.gallery';

// This is now a Server Component
export default async function HomePage() {
  let initialAllPokemon: AppPokemon[] = [];
  const POKEMON_FETCH_LIMIT = 250; // Updated limit

  try {
    initialAllPokemon = await fetchAllPokemonData(POKEMON_FETCH_LIMIT);
  } catch (error) {
    console.error("Failed to fetch initial Pokemon data on server:", error);
    // Optionally, handle error state here, e.g., pass an error flag or empty array
    // For now, it will proceed with an empty array if fetch fails.
  }

  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading Pokedex...</div>}>
      <HomePageContent initialAllPokemon={initialAllPokemon} />
    </Suspense>
  );
}
    
