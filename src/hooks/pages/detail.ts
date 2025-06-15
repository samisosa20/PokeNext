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
    // Si no hay currentPokemonId, reseteamos estados y salimos.
    if (currentPokemonId) {
      const loadPokemonDetails = async () => {
        setIsLoading(true);
        setError(null);
        setPokemon(null); // Limpiar datos del Pokémon anterior
        setEvolutionChain([]); // Limpiar cadena de evolución anterior
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
          setPokemon(null); // Asegurar que pokemon sea null en caso de error
        } finally {
          setIsLoading(false);
        }
      };
      loadPokemonDetails();
    } else {
      // Manejar el caso donde currentPokemonId no está disponible
      setIsLoading(false);
      setError("No Pokémon ID specified.");
      setPokemon(null);
      setEvolutionChain([]);
    }
  }, [currentPokemonId]);

  useEffect(() => {
    const fetchEvolutions = async () => {
      // Solo intentar buscar evoluciones si tenemos un Pokémon con nombre.
      if (pokemon?.name) {
        setIsEvolutionChainLoading(true);
        setEvolutionChain([]); // Limpiar cadena anterior antes de buscar una nueva
        try {
          const chainData = await getPokemonInEvolutionChainByName(
            pokemon.name
          );
          setEvolutionChain(chainData);
        } catch (error) {
          console.error(
            "Failed to fetch evolution chain for detail page:",
            error
          );
          // Opcionalmente, podrías establecer un estado de error específico para la cadena de evolución aquí.
          setEvolutionChain([]); // Asegurar que la cadena esté vacía en caso de error
        } finally {
          setIsEvolutionChainLoading(false);
        }
      } else {
        // Si no hay Pokémon (o no tiene nombre), asegurarse de que la cadena de evolución esté vacía.
        setEvolutionChain([]);
        setIsEvolutionChainLoading(false); // Y que no esté cargando.
      }
    };
    fetchEvolutions();
  }, [pokemon]); // Depender directamente del objeto pokemon.
  // Si pokemon cambia (o se vuelve null), este efecto se re-ejecutará.

  const backSearchTerm = searchParamsHook.get("searchTerm") || "";
  const backSearchCriteria = searchParamsHook.get("searchCriteria") || "name";
  const backSearchType = searchParamsHook.get("searchType") || "";
  const backSearchGeneration = searchParamsHook.get("searchGeneration") || "";

  const queryParams = new URLSearchParams();
  if (backSearchTerm) queryParams.set("searchTerm", backSearchTerm);
  if (backSearchCriteria) queryParams.set("searchCriteria", backSearchCriteria);
  if (backSearchType) queryParams.set("searchType", backSearchType);
  if (backSearchGeneration)
    queryParams.set("searchGeneration", backSearchGeneration);

  const backLinkHref = `/?${queryParams.toString()}`;

  return {
    isLoading,
    error,
    pokemon,
    evolutionChain,
    isEvolutionChainLoading,
    backSearchTerm,
    backSearchCriteria,
    backSearchType,
    backSearchGeneration,
    backLinkHref,
  };
};
