
'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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

const POKEMON_FETCH_LIMIT = 151;
type SearchCriteria = 'name' | 'type' | 'generation' | 'id';


function HomePageContent() {
  const searchParams = useSearchParams();
  const initialSearchTerm = searchParams.get('searchTerm') || '';
  const initialSearchCriteria = (searchParams.get('searchCriteria') as SearchCriteria | null) || 'name';

  const [allPokemon, setAllPokemon] = useState<AppPokemon[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>(initialSearchCriteria);
  const [isLoading, setIsLoading] = useState(true);
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
      const trimmedDebouncedSearch = debouncedSearchTerm.trim().toLowerCase();
      if (searchCriteria === 'name' && trimmedDebouncedSearch) {
        const potentialMatchInAllPokemon = allPokemon.find(p => p.name.toLowerCase() === trimmedDebouncedSearch);

        if (trimmedDebouncedSearch.length > 2 && potentialMatchInAllPokemon) {
          setIsEvolutionSearchLoading(true);
          setEvolutionSearchResults([]);
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
      if (searchCriteria === 'name') {
         return pokemon.name.toLowerCase().includes(normalizedSearch);
      }
      return false;
    });
  }, [allPokemon, debouncedSearchTerm, searchCriteria]);

  const pokemonToDisplay = useMemo(() => {
    const trimmedDebouncedSearch = debouncedSearchTerm.trim().toLowerCase();
    if (searchCriteria === 'name' && trimmedDebouncedSearch) {
      if (evolutionSearchResults.length > 0 && !isEvolutionSearchLoading) {
        return evolutionSearchResults;
      }
      return regularFilteredPokemon;
    }
    return regularFilteredPokemon;
  }, [searchCriteria, debouncedSearchTerm, evolutionSearchResults, isEvolutionSearchLoading, regularFilteredPokemon]);

  const currentOverallLoadingState = isLoading || (searchCriteria === 'name' && isEvolutionSearchLoading);


  const handleReset = () => {
    setSearchTerm('');
    setSearchCriteria('name');
    setEvolutionSearchResults([]);
    // window.history.pushState({}, '', '/');
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
      if (potentialMatchInAllPokemon && evolutionSearchResults.length === 0 && !isEvolutionSearchLoading && trimmedSearch.length > 2) {
        return `No evolutions found for "${searchTerm}". It might be a unique Pokémon or its evolution data isn't available.`;
      }
      return `No Pokémon found matching "${searchTerm}". Try checking the spelling or a different name.`;
    }
    return `Your search for "${searchTerm}" using filter "${searchCriteria}" did not match any Pokémon. Try a different term or criteria.`;
  }, [searchCriteria, searchTerm, debouncedSearchTerm, pokemonToDisplay.length, currentOverallLoadingState, evolutionSearchResults.length, isEvolutionSearchLoading, allPokemon]);


  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex h-20 sm:h-16 max-w-screen-2xl items-center justify-between mx-auto px-4 sm:px-6 lg:px-8 flex-wrap sm:flex-nowrap py-2 sm:py-0">
          <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary w-full sm:w-auto text-center sm:text-left mb-2 sm:mb-0">PokeNext Gallery</h1>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-end">
            <Select value={searchCriteria} onValueChange={(value: SearchCriteria) => { setSearchCriteria(value); setEvolutionSearchResults([]); }}>
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
            {Array.from({ length: (searchCriteria === 'name' && isEvolutionSearchLoading) ? 3 : (isLoading ? 10 : Math.min(pokemonToDisplay.length, 5) || 5) }).map((_, index) => (
              <PokemonSkeletonCard key={index} />
            ))}
          </div>
        ) : pokemonToDisplay.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {pokemonToDisplay.map(pokemon => (
              <PokemonCard
                key={`${pokemon.id}-${pokemon.name}`}
                pokemon={pokemon}
                currentSearchTerm={debouncedSearchTerm.trim()}
                currentSearchCriteria={searchCriteria}
              />
            ))}
          </div>
        ) : debouncedSearchTerm.trim() && noResultsMessageText ? (
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
        ) : !debouncedSearchTerm.trim() && allPokemon.length === 0 && !isLoading ? (
             <div className="text-center py-10">
               <p className="text-muted-foreground mb-4">
                 Failed to load Pokémon. Please try refreshing the page or check your connection.
               </p>
               <Button onClick={fetchInitialPokemon} variant="outline">
                 <RotateCcw className="mr-2 h-4 w-4" /> Try Again
              </Button>
             </div>
        ) : null }

        {!debouncedSearchTerm.trim() && allPokemon.length > 0 && !isLoading && pokemonToDisplay.length === allPokemon.length && (
           <div className="text-center py-10 text-muted-foreground">
             <p className="mb-1">
               Showing all {allPokemon.length} loaded Pokémon.
             </p>
             <p>
               Use the search bar to find Pokémon by name (for evolutions), type, generation, or ID.
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

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading Pokedex...</div>}>
      <HomePageContent />
    </Suspense>
  );
}

    