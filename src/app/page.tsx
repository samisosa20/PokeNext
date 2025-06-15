"use server";
import { Suspense } from "react";

import {
  fetchAllPokemonData,
  getGenerationList,
  getTypeList,
} from "@/lib/pokemon-api";
import type {
  AppPokemon,
  GenerationResponse,
  TypesResponse,
} from "@/lib/pokemon-api";
import HomePageContent from "./pokemon/_components/home.gallery";

// This is now a Server Component
export default async function HomePage() {
  let initialAllPokemon: AppPokemon[] = [];
  let allTypes: TypesResponse[] = [];
  let allGeneration: GenerationResponse[] = [];
  const POKEMON_FETCH_LIMIT = 651; // Updated limit

  try {
    allTypes = await getTypeList();
    allGeneration = await getGenerationList();
    initialAllPokemon = await fetchAllPokemonData(POKEMON_FETCH_LIMIT);
  } catch (error) {
    console.error("Failed to fetch initial Pokemon data on server:", error);
  }

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          Loading Pokedex...
        </div>
      }
    >
      <HomePageContent
        initialAllPokemon={initialAllPokemon}
        allTypes={allTypes}
        allGeneration={allGeneration}
      />
    </Suspense>
  );
}
