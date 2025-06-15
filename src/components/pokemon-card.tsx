import Image from "next/image";
import Link from "next/link";
import { type AppPokemon } from "@/lib/pokemon-api";
import PokemonTypeBadge from "./pokemon-type-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PokemonCardProps {
  pokemon: AppPokemon;
  currentSearchTerm?: string;
  currentSearchCriteria?: string;
  currentSearchType?: string;
  currentSearchGeneration?: string;
  isCurrentPokemonInChain?: boolean;
}

const PokemonCard: React.FC<PokemonCardProps> = ({
  pokemon,
  currentSearchTerm = "",
  currentSearchCriteria = "name",
  currentSearchType = "",
  currentSearchGeneration = "",
  isCurrentPokemonInChain = false,
}) => {
  const queryParams = new URLSearchParams();
  if (currentSearchTerm) queryParams.set("searchTerm", currentSearchTerm);
  if (currentSearchCriteria)
    queryParams.set("searchCriteria", currentSearchCriteria);
  if (currentSearchType && currentSearchCriteria === "type")
    queryParams.set("searchType", currentSearchType);
  if (currentSearchGeneration && currentSearchCriteria === "generation")
    queryParams.set("searchGeneration", currentSearchGeneration);

  const linkHref = `/pokemon/${pokemon?.id}?${queryParams.toString()}`;

  return (
    <Link
      href={linkHref}
      className={cn(
        "block group",
        isCurrentPokemonInChain &&
          "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg"
      )}
    >
      <Card
        className={cn(
          "flex flex-col items-center text-center shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out animate-subtle-scale-up transform hover:-translate-y-1 h-full"
        )}
      >
        <CardHeader className="p-4 w-full">
          <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-2">
            {pokemon && (
              <Image
                src={`${pokemon?.imageUrl}`}
                alt={`${pokemon?.name}`}
                fill
                sizes="(max-width: 768px) 128px, 160px"
                className="object-contain transition-transform duration-300 group-hover:scale-105"
                unoptimized={pokemon?.imageUrl.startsWith(
                  "https://placehold.co"
                )}
                data-ai-hint={
                  pokemon?.imageUrl.startsWith("https://placehold.co")
                    ? "pokemon character"
                    : undefined
                }
                loading="lazy"
              />
            )}
          </div>
          <CardTitle className="font-headline text-xl md:text-2xl">
            {pokemon?.name}
          </CardTitle>
          <CardDescription className="text-sm">
            ID: #{String(pokemon?.id).padStart(3, "0")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 w-full flex flex-col flex-grow justify-end">
          <div className="flex justify-center space-x-2 mb-3">
            {pokemon?.types?.map((type) => (
              <PokemonTypeBadge key={type} type={type} size="sm" />
            ))}
          </div>
          <Badge variant="secondary" className="font-body text-xs">
            {pokemon?.generation}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
};

export default PokemonCard;
