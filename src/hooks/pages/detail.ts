import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

import type { AppPokemon, AppPokemonDetails } from "@/lib/pokemon-api";
import {
  fetchAppPokemonDetails,
  getPokemonInEvolutionChainByName,
} from "@/lib/pokemon-api";

export const detailController = () => {
  const params = useParams();
  const searchParamsHook = useSearchParams();
  const currentPokemonId = params.id as string;
  const [pokemon, setPokemon] = useState<AppPokemonDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [evolutionChain, setEvolutionChain] = useState<AppPokemon[]>([]);
  const [isEvolutionChainLoading, setIsEvolutionChainLoading] = useState(false);

  useEffect(() => {
    if (currentPokemonId) {
      const loadPokemonDetails = async () => {
        setIsLoading(true);
        setError(null);
        setEvolutionChain([]);
        try {
          const data = await fetchAppPokemonDetails(currentPokemonId);
          if (data) {
            setPokemon(data);
          } else {
            setError("Pokémon not found.");
          }
        } catch (err) {
          console.error("Failed to fetch Pokémon details:", err);
          setError("Failed to load Pokémon details. Please try again.");
        } finally {
          setIsLoading(false);
        }
      };
      loadPokemonDetails();
    }
  }, [currentPokemonId]);

  useEffect(() => {
    const fetchEvolutions = async () => {
      if (pokemon && pokemon.name) {
        setIsEvolutionChainLoading(true);
        try {
          // Use pokemon.name to fetch its evolution chain.
          // The fetched chain will include the current pokemon as well.
          const chainData = await getPokemonInEvolutionChainByName(
            pokemon.name
          );
          setEvolutionChain(chainData);
        } catch (error) {
          console.error(
            "Failed to fetch evolution chain for detail page:",
            error
          );
          // Optionally set an error state for evolutions here
        } finally {
          setIsEvolutionChainLoading(false);
        }
      }
    };

    if (pokemon && !isLoading) {
      fetchEvolutions();
    }
  }, [pokemon, isLoading]);

  const backSearchTerm = searchParamsHook.get("searchTerm") || "";
  const backSearchCriteria = searchParamsHook.get("searchCriteria") || "name";
  const backLinkHref = `/?searchTerm=${encodeURIComponent(
    backSearchTerm
  )}&searchCriteria=${encodeURIComponent(backSearchCriteria)}`;

  return {
    isLoading,
    error,
    pokemon,
    evolutionChain,
    isEvolutionChainLoading,
    backSearchTerm,
    backSearchCriteria,
    backLinkHref,
  };
};
