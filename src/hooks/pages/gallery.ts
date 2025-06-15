
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
  const initialSearchTerm = searchParams.get("searchTerm") || "";
  const initialSearchCriteria =
    (searchParams.get("searchCriteria") as SearchCriteria | null) || "name";

  const [allPokemon, _] = useState<AppPokemon[]>(initialAllPokemon);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [searchType, setSearchType] = useState("");
  const [searchGeneration, setSearchGeneration] = useState("");
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>(
    initialSearchCriteria
  );
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
        // Check if the search term fully matches a Pokemon in the main list to trigger evolution search
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
            // Using a Set to store unique Pokémon names to avoid redundant fetches
            const uniquePokemonNamesToFetchEvolutionsFor = new Set<string>();
            potentialMatchInAllPokemons.forEach(p => uniquePokemonNamesToFetchEvolutionsFor.add(p.name));

            const allEvolutionResults: AppPokemon[] = [];
            for (const pokemonName of uniquePokemonNamesToFetchEvolutionsFor) {
              const results = await getPokemonInEvolutionChainByName(
                pokemonName
              );
              allEvolutionResults.push(...results);
            }
            
            // Filter for unique Pokémon by ID after all fetches are done
            const uniqueResultsById = allEvolutionResults.filter(
              (pokemon, index, self) =>
                index === self.findIndex((p) => p.id === pokemon.id)
            );
            setEvolutionSearchResults(uniqueResultsById);

            if (uniqueResultsById.length === 0 && trimmedDebouncedSearch) {
              toast({
                title: "No Pokémon Evolutions Found",
                description: `No evolutions found for "${trimmedDebouncedSearch}". It might be a unique Pokémon or its data is unavailable.`,
              });
            }
          } catch (error: any) {
            console.error("Failed to fetch evolution chain:", error);
            if (error.message && error.message.includes("not found")) {
              // This toast might be too noisy if a user is just typing. Consider if needed.
              // toast({
              //   title: "Evolution Search Info",
              //   description: `Could not find Pokémon "${trimmedDebouncedSearch}" to get evolutions.`,
              // });
            } else {
              toast({
                variant: "destructive",
                title: "Evolution Search Error",
                description:
                  error.message || "Could not perform evolution search.",
              });
            }
            setEvolutionSearchResults([]); // Ensure it's cleared on error
          } finally {
            setIsEvolutionSearchLoading(false);
          }
        } else {
          // If not a full match or too short, clear evolution results and stop loading
          setEvolutionSearchResults([]);
          setIsEvolutionSearchLoading(false);
        }
      } else {
        // If search criteria is not 'name' or search term is empty, clear evolution results
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
        pokemon.generation.toLowerCase().includes(searchGeneration.toLowerCase())
      );
    } else if (searchCriteria === "name") {
      if (!normalizedSearch) return allPokemon; // Show all if search term is empty for name criteria
      return allPokemon.filter((pokemon) =>
        pokemon.name.toLowerCase().includes(normalizedSearch)
      );
    }
    return allPokemon; // Default to all Pokemon if no specific criteria match or no search term for name
  }, [
    allPokemon,
    debouncedSearchTerm,
    searchCriteria,
    searchType,
    searchGeneration,
  ]);

  const pokemonToDisplay = useMemo(() => {
    const trimmedDebouncedSearch = debouncedSearchTerm.trim().toLowerCase();
    // Prioritize evolution search results if available and loading is complete
    if (
      searchCriteria === "name" &&
      trimmedDebouncedSearch &&
      evolutionSearchResults.length > 0 &&
      !isEvolutionSearchLoading
    ) {
      return evolutionSearchResults;
    }
    // If evolution search is loading for a name search, show regular filtered (which shows partial name matches)
    // or if evolution search is done but yielded no results, also show regular filtered.
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
    if (
      currentOverallLoadingState || // If loading, don't show "no results" yet
      pokemonToDisplay.length > 0 // If there are results, don't show "no results"
    ) {
      return "";
    }

    // Only show "no results" if not loading AND there are no items to display AND a search/filter is active
    if (!trimmedSearch && !searchType && !searchGeneration) {
        return ""; // No active search/filter, so don't show "no results"
    }

    if (searchCriteria === "name" && trimmedSearch) {
      // Message when evolution search attempted but yielded no results OR simple name search yielded no results
      return `No Pokémon found matching "${searchTerm}". Try checking the spelling or a different name.`;
    }
    if (searchCriteria === "type" && searchType) {
        return `No Pokémon found of type "${searchType}".`;
    }
    if (searchCriteria === "generation" && searchGeneration) {
        return `No Pokémon found in "${searchGeneration}".`;
    }
    
    // Fallback for any other case where filters are active but no results
    if (trimmedSearch || searchType || searchGeneration) {
        return `Your search or filter criteria did not match any Pokémon.`;
    }

    return ""; // Default to no message
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
