
'use client';

import { useEffect, useState, useMemo } from 'react';
import type { AppPokemon } from '@/lib/pokemon-api';
import { fetchAllPokemonData } from '@/lib/pokemon-api';
import PokemonCard from '@/components/pokemon-card';
import PokemonSkeletonCard from '@/components/pokemon-skeleton-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from '@/hooks/use-debounce';
import { Search, RotateCcw } from 'lucide-react';

const POKEMON_FETCH_LIMIT = 151; // Fetching Gen 1 Pokemon

export default function HomePage() {
  const [allPokemon, setAllPokemon] = useState<AppPokemon[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchPokemon = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllPokemonData(POKEMON_FETCH_LIMIT);
      setAllPokemon(data.sort((a, b) => a.id - b.id)); // Default sort by ID
    } catch (error) {
      console.error("Failed to fetch Pokemon data:", error);
      toast({
        variant: "destructive",
        title: "Error fetching Pokémon",
        description: "Could not load Pokémon data. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPokemon();
  }, []);

  const filteredPokemon = useMemo(() => {
    const normalizedSearch = debouncedSearchTerm.toLowerCase().trim();
    if (!normalizedSearch) {
      return allPokemon;
    }

    return allPokemon.filter(pokemon => {
      const nameMatch = pokemon.name.toLowerCase().includes(normalizedSearch);
      const typeMatch = pokemon.types.some(type => type.toLowerCase().includes(normalizedSearch));
      const generationMatch = pokemon.generation.toLowerCase().includes(normalizedSearch.replace("generation ", "generation-").replace("gen ", "generation-")); // Handle "gen 1", "generation 1", "generation-i"
      const idMatch = String(pokemon.id) === normalizedSearch || `#${String(pokemon.id).padStart(3,'0')}` === normalizedSearch;

      return nameMatch || typeMatch || generationMatch || idMatch;
    });
  }, [allPokemon, debouncedSearchTerm]);

  const handleReset = () => {
    setSearchTerm('');
    if (allPokemon.length === 0 && !isLoading) {
      fetchPokemon();
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary">PokeNext Gallery</h1>
          <div className="relative w-full max-w-xs sm:max-w-sm lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, type, ID, or generation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-lg shadow-inner focus:ring-accent"
              aria-label="Search Pokemon"
            />
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && filteredPokemon.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <PokemonSkeletonCard key={index} />
            ))}
          </div>
        ) : filteredPokemon.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {filteredPokemon.map(pokemon => (
              <PokemonCard key={pokemon.id} pokemon={pokemon} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl font-semibold text-foreground mb-2 font-headline">No Pokémon Found</p>
            <p className="text-muted-foreground mb-4">
              Your search for "{searchTerm}" did not match any Pokémon. Try a different term or reset your search.
            </p>
            <Button onClick={handleReset} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" /> Reset Search
            </Button>
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
