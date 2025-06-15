"use client";
import { Search, RotateCcw, ListFilter, FilterX } from "lucide-react";

import PokemonCard from "@/components/pokemon-card";
import PokemonSkeletonCard from "@/components/pokemon-skeleton-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { galleryController, HomePageContentProps } from "@/hooks/pages";

export default function HomePageContent({
  initialAllPokemon,
  allTypes,
  allGeneration,
}: HomePageContentProps) {
  const {
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
  } = galleryController({ initialAllPokemon, allTypes, allGeneration });

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex h-auto sm:h-20 max-w-screen-2xl items-center justify-between mx-auto px-4 sm:px-6 lg:px-8 flex-wrap sm:flex-nowrap py-3 sm:py-0">
          <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary w-full sm:w-auto text-center sm:text-left mb-3 sm:mb-0">
            PokeNext Gallery
          </h1>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-end flex-wrap">
            <Select
              value={searchGeneration}
              onValueChange={(value: string) => {
                setSearchCriteria("generation");
                setSearchGeneration(value);
                setSearchTerm("");
                setSearchType("");
                setEvolutionSearchResults([]);
              }}
            >
              <SelectTrigger
                className="w-full sm:w-[150px] h-10 shadow-inner focus:ring-accent mb-2 sm:mb-0"
                aria-label="Filter by generation"
              >
                <ListFilter className="h-4 w-4 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Generation" />
              </SelectTrigger>
              <SelectContent>
                {allGeneration.map((generation, index) => (
                  <SelectItem
                    value={generation.id}
                    key={`${index}-${generation.name}`}
                  >
                    {generation.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={searchType}
              onValueChange={(value: string) => {
                setSearchCriteria("type");
                setSearchType(value);
                setSearchTerm("");
                setSearchGeneration("");
                setEvolutionSearchResults([]);
              }}
            >
              <SelectTrigger
                className="w-full sm:w-[130px] h-10 shadow-inner focus:ring-accent mb-2 sm:mb-0"
                aria-label="Type"
              >
                <ListFilter className="h-4 w-4 mr-1 text-muted-foreground" />
                <SelectValue placeholder="By Type" />
              </SelectTrigger>
              <SelectContent>
                {allTypes.map((type, index) => (
                  <SelectItem value={type.id} key={`${index}-${type.name}`}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleReset}
              className="h-10 mb-2 sm:mb-0"
              aria-label="Clear all filters and search term"
              disabled={!searchTerm && !searchType && !searchGeneration}
            >
              <FilterX className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
            <div className="relative flex-grow w-full sm:w-auto sm:max-w-xs lg:max-w-md mb-2 sm:mb-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchCriteria("name");
                  setSearchTerm(e.target.value);
                  setSearchType("");
                  setSearchGeneration("");
                }}
                className="pl-10 pr-4 py-2 w-full rounded-lg shadow-inner focus:ring-accent h-10"
                aria-label="Search Pokemon by name"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentOverallLoadingState ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {Array.from({
              length:
                searchCriteria === "name" && isEvolutionSearchLoading ? 3 : 5,
            }).map((_, index) => (
              <PokemonSkeletonCard key={index} />
            ))}
          </div>
        ) : pokemonToDisplay.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {pokemonToDisplay.map((pokemon, index) => (
              <PokemonCard
                key={`${index}-${pokemon.name}-${pokemon.id}`}
                pokemon={pokemon}
                currentSearchTerm={debouncedSearchTerm.trim()}
                currentSearchCriteria={searchCriteria}
                currentSearchType={searchType}
                currentSearchGeneration={searchGeneration}
              />
            ))}
          </div>
        ) : noResultsMessageText ? (
          <div className="text-center py-10">
            <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl font-semibold text-foreground mb-2 font-headline">
              No Pokémon Found
            </p>
            <p className="text-muted-foreground mb-4 px-4">
              {noResultsMessageText}
            </p>
            <Button onClick={handleReset} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" /> Reset Filters
            </Button>
          </div>
        ) : !debouncedSearchTerm.trim() &&
          allPokemon.length === 0 &&
          !searchType &&
          !searchGeneration ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground mb-4">
              No Pokémon data loaded. This might be an issue with the initial
              data fetching.
            </p>
          </div>
        ) : null}

        {!currentOverallLoadingState &&
          !debouncedSearchTerm.trim() &&
          !searchType &&
          !searchGeneration &&
          allPokemon.length > 0 &&
          pokemonToDisplay.length === allPokemon.length && (
            <div className="text-center py-10 text-muted-foreground">
              <p className="mb-1">
                Showing all {allPokemon.length} loaded Pokémon.
              </p>
              <p>Use the filters or search bar to find specific Pokémon.</p>
            </div>
          )}
      </main>

      <footer className="py-6 text-center border-t border-border/40">
        <p className="text-sm text-muted-foreground font-body">
          Powered by{" "}
          <a
            href="https://pokeapi.co/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            PokeAPI
          </a>
          . Created with Next.js.
        </p>
      </footer>
    </div>
  );
}
