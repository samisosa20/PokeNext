
'use client';

import { useEffect, useState, useMemo } from 'react';
import type { AppPokemon } from '@/lib/pokemon-api';
import { fetchAllPokemonData, getPokemonInEvolutionChainByName } from '@/lib/pokemon-api';
import PokemonCard from '@/components/pokemon-card';
import PokemonSkeletonCard from '@/components/pokemon-skeleton-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from '@/hooks/use-debounce';
import { Search, RotateCcw, ListFilter } from 'lucide-react';

const POKEMON_FETCH_LIMIT = 151; // Fetching Gen 1 Pokemon (default load)
type SearchCriteria = 'name' | 'type' | 'generation' | 'id';

export default function HomePage() {
  const [allPokemon, setAllPokemon] = useState<AppPokemon[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>('name');
  const [isLoading, setIsLoading] = useState(true); // For initial allPokemon fetch
  const { toast } = useToast();

  const [evolutionSearchResults, setEvolutionSearchResults] = useState<AppPokemon[]>([]);
  const [isEvolutionSearchLoading, setIsEvolutionSearchLoading] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchInitialPokemon = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllPokemonData(POKEMON_FETCH_LIMIT);
      setAllPokemon(data);
    } catch (error) {
      console.error("Failed to fetch initial Pokemon data:", error);
      toast({
        variant: "destructive",
        title: "Error fetching Pokémon",
        description: "Could not load initial Pokémon data. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchInitialPokemon();
  }, []);

  useEffect(() => {
    const handleEvolutionSearch = async () => {
      const trimmedDebouncedSearch = debouncedSearchTerm.trim();
      if (searchCriteria === 'name' && trimmedDebouncedSearch) {
        setIsEvolutionSearchLoading(true);
        setEvolutionSearchResults([]); // Clear previous evolution results for new search
        try {
          const results = await getPokemonInEvolutionChainByName(trimmedDebouncedSearch);
          setEvolutionSearchResults(results);
          if (results.length === 0 && trimmedDebouncedSearch) {
             toast({ // This toast is specifically for when evolution API is called and returns nothing.
              title: "No Pokémon Evolutions Found",
              description: `No evolutions found for "${trimmedDebouncedSearch}". It might be a unique Pokémon or the name is misspelled.`,
            });
          }
        } catch (error: any) {
          console.error("Failed to fetch evolution chain:", error);
          // Toast for API error if name was likely valid but lookup failed
          if (error.message && error.message.includes("not found")) {
            // This is already handled by the toast above if results.length is 0.
            // If it's a different error, like network.
          } else if (trimmedDebouncedSearch.length > 2) { // Avoid toast for very short/partial inputs that are expected to fail species lookup
             toast({
              variant: "destructive",
              title: "Evolution Search Error",
              description: error.message || "Could not perform evolution search.",
            });
          }
          setEvolutionSearchResults([]); // Ensure it's empty on error
        } finally {
          setIsEvolutionSearchLoading(false);
        }
      } else {
        setEvolutionSearchResults([]); // Clear if not name search or no term
      }
    };

    handleEvolutionSearch();
  }, [debouncedSearchTerm, searchCriteria, toast]);

  const regularFilteredPokemon = useMemo(() => {
    const normalizedSearch = debouncedSearchTerm.toLowerCase().trim();
    if (!normalizedSearch) {
      return allPokemon; // Return all initially loaded Pokémon if no search term
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
      if (searchCriteria === 'name') {
         return pokemon.name.toLowerCase().includes(normalizedSearch);
      }
      return false;
    });
  }, [allPokemon, debouncedSearchTerm, searchCriteria]);

  const pokemonToDisplay = useMemo(() => {
    const trimmedDebouncedSearch = debouncedSearchTerm.trim();
    if (searchCriteria === 'name' && trimmedDebouncedSearch) {
      // If evolution search has successfully completed and found results
      if (evolutionSearchResults.length > 0 && !isEvolutionSearchLoading) {
        return evolutionSearchResults;
      }
      // Otherwise (evolution search is loading, or failed/returned empty, or term was too partial for it)
      // show the locally filtered suggestions from allPokemon.
      return regularFilteredPokemon;
    }
    // For other criteria (type, gen, id) or if search term is empty (which shows allPokemon via regularFilteredPokemon)
    return regularFilteredPokemon;
  }, [searchCriteria, debouncedSearchTerm, evolutionSearchResults, isEvolutionSearchLoading, regularFilteredPokemon]);
  
  const currentOverallLoadingState = isLoading || (searchCriteria === 'name' && debouncedSearchTerm.trim() && isEvolutionSearchLoading);

  const handleReset = () => {
    setSearchTerm('');
    setSearchCriteria('name');
    setEvolutionSearchResults([]);
    // fetchInitialPokemon(); // Re-fetch only if needed, currently allPokemon is kept.
  };

  const getSearchPlaceholder = () => {
    switch (searchCriteria) {
      case 'name': return "Pokémon Name (e.g., Pikachu)";
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
      return `No Pokémon found matching "${searchTerm}". Try checking the spelling. If you entered a full name, it might be a unique Pokémon or its evolutions aren't listed by the API.`;
    }
    return `Your search for "${searchTerm}" using filter "${searchCriteria}" did not match any Pokémon. Try a different term or criteria.`;
  }, [searchCriteria, searchTerm, debouncedSearchTerm, pokemonToDisplay.length, currentOverallLoadingState]);


  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex h-20 sm:h-16 max-w-screen-2xl items-center justify-between mx-auto px-4 sm:px-6 lg:px-8 flex-wrap sm:flex-nowrap py-2 sm:py-0">
          <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary w-full sm:w-auto text-center sm:text-left mb-2 sm:mb-0">PokeNext Gallery</h1>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-end">
            <Select value={searchCriteria} onValueChange={(value: SearchCriteria) => setSearchCriteria(value)}>
              <SelectTrigger className="w-[130px] h-10 shadow-inner focus:ring-accent" aria-label="Search criteria">
                <ListFilter className="h-4 w-4 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Filter by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="type">Type</SelectItem>
                <SelectItem value="generation">Generation</SelectItem>
                <SelectItem value="id">ID</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-grow max-w-xs sm:max-w-sm lg:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder={getSearchPlaceholder()}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-lg shadow-inner focus:ring-accent h-10"
                aria-label="Search Pokemon"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentOverallLoadingState ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {/* Show fewer skeletons if actively loading evolutions, more for initial load or general filtering */}
            {Array.from({ length: (searchCriteria === 'name' && isEvolutionSearchLoading) ? 3 : (isLoading ? 10 : 5) }).map((_, index) => (
              <PokemonSkeletonCard key={index} />
            ))}
          </div>
        ) : pokemonToDisplay.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {pokemonToDisplay.map(pokemon => (
              <PokemonCard key={`${pokemon.id}-${pokemon.name}`} pokemon={pokemon} />
            ))}
          </div>
        ) : debouncedSearchTerm.trim() && noResultsMessageText ? ( // Show "no results" only if a search was performed and message exists
            <div className="text-center py-10">
              <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-foreground mb-2 font-headline">No Pokémon Found</p>
              <p className="text-muted-foreground mb-4 px-4">
                {noResultsMessageText}
              </p>
              <Button onClick={handleReset} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset Search
              </Button>
            </div>
        ) : !debouncedSearchTerm.trim() && allPokemon.length === 0 && !isLoading ? ( // Edge case: initial load failed and no search term
             <div className="text-center py-10">
               <p className="text-muted-foreground mb-4">
                 Failed to load Pokémon. Please try refreshing the page or check your connection.
               </p>
               <Button onClick={fetchInitialPokemon} variant="outline">
                 <RotateCcw className="mr-2 h-4 w-4" /> Try Again
              </Button>
             </div>
        ) : null /* Default: no search term, Pokemon loaded: show nothing or a prompt */ }
        
        {!debouncedSearchTerm.trim() && allPokemon.length > 0 && !isLoading && ( // Prompt to search if list is loaded and no search term
           <div className="text-center py-10">
             <p className="text-muted-foreground mb-4">
               Use the search bar to find Pokémon by name, type, generation, or ID.
             </p>
           </div>
        )}
      </main>

      <footer className="py-6 text-center border-t border-border/40">
        <p className="text-sm text-muted-foreground font-body">
          Powered by <a href="https://pokeapi.co/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">PokeAPI</a>. Created with Next.js.
        </p>
      </footer>
    </div>
  );
}
    