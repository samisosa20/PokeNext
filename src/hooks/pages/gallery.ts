import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import type {
  GenerationResponse,
  AppPokemon,
  TypesResponse,
} from "@/lib/pokemon-api";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import {
  fetchAllPokemonFilterData,
  getPokemonInEvolutionChainByName,
} from "@/lib/pokemon-api";

export type SearchCriteria = "name" | "type" | "generation" | "id";

export interface HomePageContentProps {
  initialAllPokemon: AppPokemon[];
  allTypes: TypesResponse[];
  allGeneration: GenerationResponse[];
}

export const galleryController = ({
  initialAllPokemon,
}: HomePageContentProps) => {
  const searchParams = useSearchParams();
  const initialSearchTermParam = searchParams.get("searchTerm") || "";
  const initialSearchTypeParam = searchParams.get("searchType") || "";
  const initialSearchGenerationParam =
    searchParams.get("searchGeneration") || "";

  const [allPokemon, _] = useState<AppPokemon[]>(initialAllPokemon);
  const [searchTerm, setSearchTerm] = useState(initialSearchTermParam);
  const [searchType, setSearchType] = useState(initialSearchTypeParam);
  const [searchGeneration, setSearchGeneration] = useState(
    initialSearchGenerationParam
  );

  const getInitialSearchCriteria = (): SearchCriteria => {
    if (initialSearchTypeParam) return "type";
    if (initialSearchGenerationParam) return "generation";
    return "name"; // Default to name if searchTerm is present or no other filter
  };

  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>(
    getInitialSearchCriteria()
  );
  const { toast } = useToast();

  const [evolutionSearchResults, setEvolutionSearchResults] = useState<
    AppPokemon[]
  >([]);
  const [isEvolutionSearchLoading, setIsEvolutionSearchLoading] =
    useState(false);

  // Estado para los Pokémon filtrados externamente (tipo o generación)
  const [externallyFilteredPokemon, setExternallyFilteredPokemon] = useState<
    AppPokemon[] | null
  >(null);
  const [isExternalFilterLoading, setIsExternalFilterLoading] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const handleEvolutionSearch = async () => {
      const trimmedDebouncedSearch = debouncedSearchTerm.trim().toLowerCase();
      if (searchCriteria === "name" && trimmedDebouncedSearch) {
        const potentialMatchInAllPokemons = allPokemon.filter((p) =>
          p.name.toLowerCase().includes(trimmedDebouncedSearch)
        );
        if (
          trimmedDebouncedSearch.length > 2 &&
          potentialMatchInAllPokemons.length
        ) {
          setIsEvolutionSearchLoading(true);
          setEvolutionSearchResults([]);
          try {
            const uniquePokemonNamesToFetchEvolutionsFor = new Set<string>();
            potentialMatchInAllPokemons.forEach((p) =>
              uniquePokemonNamesToFetchEvolutionsFor.add(p.name)
            );

            const allEvolutionResults: AppPokemon[] = [];
            for (const pokemonName of uniquePokemonNamesToFetchEvolutionsFor) {
              const results = await getPokemonInEvolutionChainByName(
                pokemonName
              );
              allEvolutionResults.push(...results);
            }

            const uniqueResultsById = allEvolutionResults.filter(
              (pokemon, index, self) =>
                index === self.findIndex((p) => p.id === pokemon.id)
            );
            setEvolutionSearchResults(uniqueResultsById);

            if (uniqueResultsById.length === 0 && trimmedDebouncedSearch) {
            }
          } catch (error: any) {
            console.error("Failed to fetch evolution chain:", error);
            if (!error.message || !error.message.includes("not found")) {
              toast({
                variant: "destructive",
                title: "Evolution Search Error",
                description:
                  error.message || "Could not perform evolution search.",
              });
            }
            setEvolutionSearchResults([]);
          } finally {
            setIsEvolutionSearchLoading(false);
          }
        } else {
          setEvolutionSearchResults([]);
          setIsEvolutionSearchLoading(false);
        }
      } else {
        setEvolutionSearchResults([]);
        setIsEvolutionSearchLoading(false);
      }
    };

    handleEvolutionSearch();
  }, [debouncedSearchTerm, searchCriteria, toast, allPokemon]);

  // useEffect para cargar Pokémon cuando se filtra por tipo o generación
  useEffect(() => {
    const loadExternalData = async () => {
      if (
        (searchCriteria === "type" && searchType) ||
        (searchCriteria === "generation" && searchGeneration)
      ) {
        setIsExternalFilterLoading(true);
        setExternallyFilteredPokemon(null);
        try {
          const currentFilterValue =
            searchCriteria === "type" ? searchType : searchGeneration;
          // Aseguramos que filterApiType sea 'type' o 'generation' para la llamada a la API
          const filterApiType = searchCriteria as "type" | "generation";

          if (!currentFilterValue) {
            setExternallyFilteredPokemon([]);
            setIsExternalFilterLoading(false);
            return;
          }

          const data = await fetchAllPokemonFilterData(
            filterApiType,
            currentFilterValue
          );
          setExternallyFilteredPokemon(data);
        } catch (error) {
          console.error(
            `Failed to fetch ${searchCriteria}-filtered Pokémon:`,
            error
          );
          toast({
            variant: "destructive",
            title: `${
              searchCriteria.charAt(0).toUpperCase() + searchCriteria.slice(1)
            } Filter Error`,
            description: `Could not load Pokémon for the selected ${searchCriteria}.`,
          });
          setExternallyFilteredPokemon([]);
        } finally {
          setIsExternalFilterLoading(false);
        }
      } else {
        setExternallyFilteredPokemon(null); // Limpiar si no se filtra por tipo/gen
      }
    };
    loadExternalData();
  }, [searchCriteria, searchGeneration, toast]);

  const regularFilteredPokemon = useMemo(() => {
    const normalizedSearch = debouncedSearchTerm.toLowerCase().trim();
    if (
      (searchCriteria === "type" && searchType) ||
      (searchCriteria === "generation" && searchGeneration)
    ) {
      return externallyFilteredPokemon || [];
    } else if (searchCriteria === "name") {
      if (!normalizedSearch) return allPokemon;
      return allPokemon.filter((pokemon) =>
        pokemon.name.toLowerCase().includes(normalizedSearch)
      );
    }
    return allPokemon;
  }, [
    allPokemon,
    debouncedSearchTerm,
    searchCriteria,
    searchType,
    searchGeneration,
    externallyFilteredPokemon,
  ]);

  const pokemonToDisplay = useMemo(() => {
    const trimmedDebouncedSearch = debouncedSearchTerm.trim().toLowerCase();
    if (
      searchCriteria === "name" &&
      trimmedDebouncedSearch &&
      evolutionSearchResults.length > 0 &&
      !isEvolutionSearchLoading
    ) {
      return evolutionSearchResults;
    }
    return regularFilteredPokemon;
  }, [
    searchCriteria,
    debouncedSearchTerm,
    evolutionSearchResults,
    isEvolutionSearchLoading,
    regularFilteredPokemon,
  ]);

  const currentOverallLoadingState =
    (searchCriteria === "name" && isEvolutionSearchLoading) ||
    ((searchCriteria === "type" || searchCriteria === "generation") &&
      isExternalFilterLoading);

  const handleReset = () => {
    setSearchTerm("");
    setSearchType("");
    setSearchGeneration("");
    setSearchCriteria("name");
    setEvolutionSearchResults([]);
    setExternallyFilteredPokemon(null);
  };

  const noResultsMessageText = useMemo(() => {
    const trimmedSearch = debouncedSearchTerm.trim();
    if (currentOverallLoadingState || pokemonToDisplay.length > 0) {
      return "";
    }

    if (!trimmedSearch && !searchType && !searchGeneration) {
      return "";
    }

    if (searchCriteria === "name" && trimmedSearch) {
      return `No Pokémon found matching "${searchTerm}". Try checking the spelling or a different name.`;
    }
    if (
      searchCriteria === "type" &&
      searchType &&
      !isExternalFilterLoading &&
      externallyFilteredPokemon &&
      externallyFilteredPokemon.length === 0
    ) {
      return `No Pokémon found of type "${searchType}".`;
    }
    if (
      searchCriteria === "generation" &&
      searchGeneration &&
      !isExternalFilterLoading &&
      externallyFilteredPokemon &&
      externallyFilteredPokemon.length === 0
    ) {
      return `No Pokémon found in generation "${searchGeneration}".`;
    }

    if (trimmedSearch || searchType || searchGeneration) {
      return `Your search or filter criteria did not match any Pokémon.`;
    }

    return "";
  }, [
    searchCriteria,
    searchTerm,
    searchType,
    searchGeneration,
    debouncedSearchTerm,
    pokemonToDisplay.length,
    currentOverallLoadingState,
    isExternalFilterLoading,
    externallyFilteredPokemon,
  ]);

  return {
    searchCriteria,
    setSearchCriteria,
    setEvolutionSearchResults,
    searchTerm,
    setSearchTerm,
    currentOverallLoadingState,
    isEvolutionSearchLoading,
    pokemonToDisplay,
    debouncedSearchTerm,
    noResultsMessageText,
    handleReset,
    allPokemon,
    setSearchType,
    searchType,
    searchGeneration,
    setSearchGeneration,
  };
};
