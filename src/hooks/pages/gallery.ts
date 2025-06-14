import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

import type { AppPokemon } from '@/lib/pokemon-api';
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from '@/hooks/use-debounce';
import { getPokemonInEvolutionChainByName } from '@/lib/pokemon-api';

export type SearchCriteria = 'name' | 'type' | 'generation' | 'id';

export interface HomePageContentProps {
    initialAllPokemon: AppPokemon[];
  }

export const galleryController = ({ initialAllPokemon }: HomePageContentProps) => {
    const searchParams = useSearchParams();
    const initialSearchTerm = searchParams.get('searchTerm') || '';
    const initialSearchCriteria = (searchParams.get('searchCriteria') as SearchCriteria | null) || 'name';
  
    const [allPokemon, _] = useState<AppPokemon[]>(initialAllPokemon);
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
    const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>(initialSearchCriteria);
    const { toast } = useToast();
  
    const [evolutionSearchResults, setEvolutionSearchResults] = useState<AppPokemon[]>([]);
    const [isEvolutionSearchLoading, setIsEvolutionSearchLoading] = useState(false);
  
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
    useEffect(() => {
      const handleEvolutionSearch = async () => {
        const trimmedDebouncedSearch = debouncedSearchTerm.trim().toLowerCase();
        if (searchCriteria === 'name' && trimmedDebouncedSearch) {
          // Check if the search term fully matches a Pokemon in the main list to trigger evolution search
          const potentialMatchInAllPokemon = allPokemon.find(p => p.name.toLowerCase() === trimmedDebouncedSearch);
          
          if (trimmedDebouncedSearch.length > 2 && potentialMatchInAllPokemon) {
            setIsEvolutionSearchLoading(true);
            setEvolutionSearchResults([]); // Clear previous evolution results
            try {
              const results = await getPokemonInEvolutionChainByName(trimmedDebouncedSearch);
              setEvolutionSearchResults(results);
              if (results.length === 0 && trimmedDebouncedSearch) {
                 toast({
                  title: "No Pokémon Evolutions Found",
                  description: `No evolutions found for "${trimmedDebouncedSearch}". It might be a unique Pokémon or its data is unavailable.`,
                });
              }
            } catch (error: any) {
              console.error("Failed to fetch evolution chain:", error);
              if (error.message && error.message.includes("not found")) {
                 toast({
                  title: "Evolution Search Error",
                  description: `Could not find Pokémon "${trimmedDebouncedSearch}" to get evolutions.`,
                });
              } else {
                 toast({
                  variant: "destructive",
                  title: "Evolution Search Error",
                  description: error.message || "Could not perform evolution search.",
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
    }, [debouncedSearchTerm, searchCriteria, toast, allPokemon]); // Added allPokemon dependency
  
    const regularFilteredPokemon = useMemo(() => {
      const normalizedSearch = debouncedSearchTerm.toLowerCase().trim();
      if (!normalizedSearch) {
        return allPokemon;
      }
  
      return allPokemon.filter(pokemon => {
        if (searchCriteria === 'type') {
          return pokemon.types.some(type => type.toLowerCase().includes(normalizedSearch));
        }
        if (searchCriteria === 'generation') {
          const genSearch = normalizedSearch.replace("generation ", "generation-").replace("gen ", "generation-");
          return pokemon.generation.toLowerCase().includes(genSearch);
        }
        if (searchCriteria === 'id') {
          return String(pokemon.id) === normalizedSearch || `#${String(pokemon.id).padStart(3,'0')}` === normalizedSearch;
        }
        // For 'name' criteria, this is for partial matching / suggestions before evolution search takes over
        if (searchCriteria === 'name') {
           return pokemon.name.toLowerCase().includes(normalizedSearch);
        }
        return false;
      });
    }, [allPokemon, debouncedSearchTerm, searchCriteria]);
  
  
    const pokemonToDisplay = useMemo(() => {
      const trimmedDebouncedSearch = debouncedSearchTerm.trim().toLowerCase();
      // Prioritize evolution search results if available and loading is complete
      if (searchCriteria === 'name' && trimmedDebouncedSearch && evolutionSearchResults.length > 0 && !isEvolutionSearchLoading) {
        return evolutionSearchResults;
      }
      // If evolution search is loading for a name search, or no evolution results yet, show regular filtered results (which handles partial name matches)
      return regularFilteredPokemon;
    }, [searchCriteria, debouncedSearchTerm, evolutionSearchResults, isEvolutionSearchLoading, regularFilteredPokemon]);
    
    // Overall loading state now primarily reflects evolution search loading
    const currentOverallLoadingState = searchCriteria === 'name' && isEvolutionSearchLoading;
  
    const handleReset = () => {
      setSearchTerm('');
      setSearchCriteria('name');
      setEvolutionSearchResults([]);
      // window.history.pushState({}, '', '/'); // Consider if this is still needed or how to handle with server props
    };
  
    const getSearchPlaceholder = () => {
      switch (searchCriteria) {
        case 'name': return "Name (e.g., Pikachu for evolutions)";
        case 'type': return "Type (e.g., Fire)";
        case 'generation': return "Gen (e.g., Gen 1 or generation-i)";
        case 'id': return "ID (e.g., 25 or #025)";
        default: return "Search Pokémon...";
      }
    };
  
    const noResultsMessageText = useMemo(() => {
      const trimmedSearch = debouncedSearchTerm.trim();
      if (!trimmedSearch || pokemonToDisplay.length > 0 || currentOverallLoadingState) return "";
    
      if (searchCriteria === 'name') {
        const potentialMatchInAllPokemon = allPokemon.find(p => p.name.toLowerCase() === trimmedSearch.toLowerCase());
        // Message when evolution search attempted but yielded no results for a full name match
        if (potentialMatchInAllPokemon && evolutionSearchResults.length === 0 && !isEvolutionSearchLoading && trimmedSearch.length > 2) {
          return `No evolutions found for "${searchTerm}". It might be a unique Pokémon or its evolution data isn't available. Displaying original Pokémon if found.`;
        }
        // Generic no match for name
        return `No Pokémon found matching "${searchTerm}". Try checking the spelling or a different name.`;
      }
      // Generic no match for other criteria
      return `Your search for "${searchTerm}" using filter "${searchCriteria}" did not match any Pokémon. Try a different term or criteria.`;
    }, [searchCriteria, searchTerm, debouncedSearchTerm, pokemonToDisplay.length, currentOverallLoadingState, evolutionSearchResults.length, isEvolutionSearchLoading, allPokemon]);
  return {searchCriteria, setSearchCriteria, setEvolutionSearchResults, getSearchPlaceholder, searchTerm, setSearchTerm, currentOverallLoadingState, isEvolutionSearchLoading, pokemonToDisplay, debouncedSearchTerm, noResultsMessageText, handleReset, allPokemon}
}