
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import type {
  GenerationResponse,
  AppPokemon,
  TypesResponse,
} from "@/lib/pokemon-api";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { getPokemonInEvolutionChainByName } from "@/lib/pokemon-api";

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

  let activeInitialCriteria: SearchCriteria = "name";
  if (initialSearchTermParam) {
    activeInitialCriteria = "name";
  } else if (initialSearchTypeParam) {
    activeInitialCriteria = "type";
  } else if (initialSearchGenerationParam) {
    activeInitialCriteria = "generation";
  }

  const [searchCriteria, setSearchCriteria] =
    useState<SearchCriteria>(activeInitialCriteria);
  const { toast } = useToast();

  const [evolutionSearchResults, setEvolutionSearchResults] = useState<
    AppPokemon[]
  >([]);
  const [isEvolutionSearchLoading, setIsEvolutionSearchLoading] =
    useState(false);

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

  const regularFilteredPokemon = useMemo(() => {
    const normalizedSearch = debouncedSearchTerm.toLowerCase().trim();

    if (searchCriteria === "type" && searchType) {
      return allPokemon.filter((pokemon) =>
        pokemon.types
          .map((type) => type.toLowerCase())
          .includes(searchType.toLowerCase())
      );
    } else if (searchCriteria === "generation" && searchGeneration) {
      return allPokemon.filter((pokemon) =>
        pokemon.generation
          .toLowerCase()
          .includes(searchGeneration.toLowerCase())
      );
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
    searchCriteria === "name" && isEvolutionSearchLoading;

  const handleReset = () => {
    setSearchTerm("");
    setSearchType("");
    setSearchGeneration("");
    setSearchCriteria("name");
    setEvolutionSearchResults([]);
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
    if (searchCriteria === "type" && searchType) {
      return `No Pokémon found of type "${searchType}".`;
    }
    if (searchCriteria === "generation" && searchGeneration) {
      return `No Pokémon found in "${searchGeneration}".`;
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
