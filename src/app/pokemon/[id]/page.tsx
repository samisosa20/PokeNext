"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BarChart2, Ruler, Users } from "lucide-react";

import PokemonTypeBadge from "@/components/pokemon-type-badge";
import PokemonCard from "@/components/pokemon-card";
import PokemonSkeletonCard from "@/components/pokemon-skeleton-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PokemonStatDisplay from "../_components/pokemon.stat";
import { detailController } from "@/hooks/pages";

export default function PokemonDetailPageContent() {
  const {
    isLoading,
    error,
    pokemon,
    evolutionChain,
    isEvolutionChainLoading,
    backSearchTerm,
    backSearchCriteria,
    backLinkHref,
  } = detailController();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Skeleton className="h-10 w-40 mb-6" />
        <Card className="shadow-xl">
          <CardHeader className="flex flex-col items-center p-6">
            <Skeleton className="w-60 h-60 rounded-lg mb-4" />
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Skeleton className="h-6 w-24 mb-3" />
                {Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="mb-3">
                      <div className="flex justify-between mb-1">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
              </div>
              <div>
                <Skeleton className="h-6 w-24 mb-3" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-4 w-28 mb-4" />
                <Skeleton className="h-6 w-20 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mb-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center max-w-3xl">
        <p className="text-xl text-destructive mb-4">{error}</p>
        <Link href={backLinkHref}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Gallery
          </Button>
        </Link>
      </div>
    );
  }

  if (!pokemon) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Pokémon data not available.</p>
        <Link href={backLinkHref}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Gallery
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href={backLinkHref}>
        <Button variant="outline" className="mb-6 group">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />{" "}
          Back to Gallery
        </Button>
      </Link>

      <Card className="shadow-xl overflow-hidden rounded-xl mb-8">
        <CardHeader className="p-0">
          <div className="relative w-full h-72 sm:h-80 md:h-96 bg-muted/30 flex items-center justify-center overflow-hidden">
            <Image
              src={pokemon.imageUrl}
              alt={pokemon.name}
              width={400}
              height={400}
              className="object-contain max-w-full max-h-full transition-transform duration-300 hover:scale-105"
              priority // Prioritize loading image for current pokemon
              unoptimized={pokemon.imageUrl.startsWith("https://placehold.co")}
              data-ai-hint={
                pokemon.imageUrl.startsWith("https://placehold.co")
                  ? "pokemon character render"
                  : undefined
              }
            />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <CardTitle className="text-4xl md:text-5xl font-headline font-bold text-primary">
              {pokemon.name}
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              ID: #{String(pokemon.id).padStart(3, "0")} &bull;{" "}
              {pokemon.generation}
            </CardDescription>
          </div>

          <div className="flex justify-center space-x-2 mb-6">
            {pokemon.types.map((type) => (
              <PokemonTypeBadge key={type} type={type} size="md" />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3 font-headline text-foreground flex items-center">
                <BarChart2 className="w-5 h-5 mr-2 text-accent" /> Base Stats
              </h3>
              {pokemon.stats.map((stat) => (
                <PokemonStatDisplay
                  key={stat.name}
                  name={stat.name}
                  value={stat.base_stat}
                />
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2 font-headline text-foreground flex items-center">
                  <Ruler className="w-5 h-5 mr-2 text-accent" /> Physical
                </h3>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Height:</strong>{" "}
                  {(pokemon.height / 10).toFixed(1)} m
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Weight:</strong>{" "}
                  {(pokemon.weight / 10).toFixed(1)} kg
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2 font-headline text-foreground">
                  Abilities
                </h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground pl-1">
                  {pokemon.abilities.map((ability) => (
                    <li key={ability} className="mb-1">
                      {ability}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isEvolutionChainLoading && (
        <div className="mt-8">
          <h3 className="text-2xl md:text-3xl font-semibold mb-6 font-headline text-foreground flex items-center">
            <Users className="w-6 h-6 mr-2 text-accent" /> Loading Evolution
            Chain...
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <PokemonSkeletonCard key={`evo-skeleton-${index}`} />
            ))}
          </div>
        </div>
      )}

      {!isEvolutionChainLoading && evolutionChain.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl md:text-3xl font-semibold mb-6 font-headline text-foreground flex items-center">
            <Users className="w-6 h-6 mr-2 text-accent" /> Evolution Chain
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6">
            {evolutionChain.map((evoPokemon) => (
              <PokemonCard
                key={`evo-${evoPokemon.id}`}
                pokemon={evoPokemon}
                currentSearchTerm={backSearchTerm}
                currentSearchCriteria={backSearchCriteria}
                isCurrentPokemonInChain={evoPokemon.id === pokemon.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
