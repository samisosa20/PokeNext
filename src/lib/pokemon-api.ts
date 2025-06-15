import { cache } from "react";

export interface PokemonListItem {
  name: string;
  url: string;
}

export interface TypeInfo {
  name: string;
  url: string;
}

export interface PokemonType {
  slot: number;
  type: TypeInfo;
}

export interface PokemonSprites {
  front_default: string | null;
  other?: {
    "official-artwork"?: {
      front_default: string | null;
    };
  };
}

export interface PokemonStatAPI {
  base_stat: number;
  effort: number;
  stat: { name: string; url: string };
}

export interface PokemonAbilityAPI {
  ability: { name: string; url: string };
  is_hidden: boolean;
  slot: number;
}

export interface PokemonDetails {
  id: number;
  name: string;
  height: number; // decimetres
  weight: number; // hectograms
  sprites: PokemonSprites;
  types: PokemonType[];
  stats: PokemonStatAPI[];
  abilities: PokemonAbilityAPI[];
  species: { name: string; url: string };
}

export interface PokemonSpeciesDetails {
  id: number;
  name: string;
  generation: {
    name: string;
    url: string;
  };
  evolution_chain: {
    url: string;
  };
}

export interface AppPokemon {
  id: number;
  name: string;
  imageUrl: string;
  types: string[];
  generation: string;
  evolutionChainUrl?: string;
}

// Evolution Chain Interfaces
interface EvolutionDetail {
  // Define relevant fields if needed, for now, not critical for names
}

interface ChainLink {
  species: PokemonListItem; // { name: string, url: string }
  evolves_to: ChainLink[];
  evolution_details: EvolutionDetail[];
}

export interface EvolutionChainResponse {
  id: number;
  chain: ChainLink;
}
export interface TypesResponse {
  id: string;
  name: string;
}
export interface GenerationResponse {
  id: string;
  name: string;
}

// For Pokemon Detail Page
export interface PokemonStat {
  name: string;
  base_stat: number;
}

export interface AppPokemonDetails extends AppPokemon {
  stats: PokemonStat[];
  height: number; // in decimetres
  weight: number; // in hectograms
  abilities: string[];
}

const BATCH_SIZE = 10;

const POKEAPI_BASE_URL =
  process.env.POKEAPI_BASE_URL || "https://pokeapi.co/api/v2";

export function formatGenerationName(apiName: string): string {
  if (!apiName.startsWith("generation-")) {
    return apiName;
  }
  const parts = apiName.split("-");
  return `Generation ${parts[1].toUpperCase()}`;
}

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.statusText} (${response.status})`
    );
  }
  return response.json();
}

export const getPokemonList = cache(
  async (
    limit: number = 151,
    offset: number = 0
  ): Promise<PokemonListItem[]> => {
    const data = await fetchJson<{ results: PokemonListItem[] }>(
      `${POKEAPI_BASE_URL}/pokemon?limit=${limit}&offset=${offset}`
    );
    return data.results;
  }
);

export const getTypeList = cache(
  async (limit: number = 21, offset: number = 0): Promise<TypesResponse[]> => {
    const data = await fetchJson<{ results: { name: string; url: string }[] }>(
      `${POKEAPI_BASE_URL}/type?limit=${limit}&offset=${offset}`
    );
    return data.results.map((gen, index) => {
      const genId =
        gen.url.split("/").filter(Boolean).pop() || index.toString();
      return { id: genId, name: formatGenerationName(gen.name) };
    });
  }
);

export const getTypeDetail = cache(
  async (id: number | string): Promise<PokemonListItem[]> => {
    const data = await fetchJson<{ pokemon: { pokemon: PokemonListItem }[] }>(
      `${POKEAPI_BASE_URL}/type/${id}`
    );
    return data.pokemon.map((item) => item.pokemon);
  }
);
export const getGenerationDetail = cache(
  async (id: number | string): Promise<PokemonListItem[]> => {
    const data = await fetchJson<{ pokemon_species: PokemonListItem[] }>(
      `${POKEAPI_BASE_URL}/generation/${id}`
    );
    return data.pokemon_species;
  }
);

export const getGenerationList = cache(
  async (
    limit: number = 21,
    offset: number = 0
  ): Promise<GenerationResponse[]> => {
    const data = await fetchJson<{ results: { url: string; name: string }[] }>(
      `${POKEAPI_BASE_URL}/generation?limit=${limit}&offset=${offset}`
    );
    return data.results.map((gen, index) => {
      const genId =
        gen.url.split("/").filter(Boolean).pop() || index.toString();
      return { id: genId, name: formatGenerationName(gen.name) };
    });
  }
);

export const getPokemonDetails = cache(
  async (nameOrId: string | number): Promise<PokemonDetails> => {
    return fetchJson<PokemonDetails>(`${POKEAPI_BASE_URL}/pokemon/${nameOrId}`);
  }
);

export const getPokemonSpeciesDetails = cache(
  async (nameOrId: string | number): Promise<PokemonSpeciesDetails> => {
    const query =
      typeof nameOrId === "string" ? nameOrId.toLowerCase() : nameOrId;
    return fetchJson<PokemonSpeciesDetails>(
      `${POKEAPI_BASE_URL}/pokemon-species/${query}`
    );
  }
);

export const getEvolutionChainByUrl = cache(
  async (url: string): Promise<EvolutionChainResponse | null> => {
    try {
      return await fetchJson<EvolutionChainResponse>(url);
    } catch (error) {
      console.error(`Failed to fetch evolution chain from ${url}:`, error);
      return null;
    }
  }
);

function extractNamesRecursive(chainLink: ChainLink, names: string[]): void {
  names.push(chainLink.species.name);
  for (const nextLink of chainLink.evolves_to) {
    extractNamesRecursive(nextLink, names);
  }
}

export function extractPokemonNamesFromChain(chain: ChainLink): string[] {
  const names: string[] = [];
  extractNamesRecursive(chain, names);
  return names;
}

export const fetchSingleAppPokemon = cache(
  async (nameOrId: string | number): Promise<AppPokemon | null> => {
    try {
      const details = await getPokemonDetails(nameOrId);
      const speciesId =
        details.species.url.split("/").filter(Boolean).pop() ||
        details.id.toString();
      const speciesDetails = await getPokemonSpeciesDetails(speciesId);

      const imageUrl =
        details.sprites.other?.["official-artwork"]?.front_default ||
        details.sprites.front_default ||
        `https://placehold.co/200x200.png`;

      return {
        id: details.id,
        name: capitalizeFirstLetter(details.name),
        imageUrl: imageUrl,
        types: details.types.map((t) => t.type.name),
        generation: formatGenerationName(speciesDetails.generation.name),
        evolutionChainUrl: speciesDetails.evolution_chain?.url,
      };
    } catch (error) {
      console.error(`Failed to fetch AppPokemon data for ${nameOrId}:`, error);
      return null;
    }
  }
);

export const fetchAppPokemonDetails = cache(
  async (id: string | number): Promise<AppPokemonDetails | null> => {
    try {
      const details = await getPokemonDetails(id);
      const speciesId =
        details.species.url.split("/").filter(Boolean).pop() ||
        details.id.toString();
      const speciesDetails = await getPokemonSpeciesDetails(speciesId);

      const imageUrl =
        details.sprites.other?.["official-artwork"]?.front_default ||
        details.sprites.front_default ||
        `https://placehold.co/400x400.png`;

      return {
        id: details.id,
        name: capitalizeFirstLetter(details.name),
        imageUrl: imageUrl,
        types: details.types.map((t) => capitalizeFirstLetter(t.type.name)),
        generation: formatGenerationName(speciesDetails.generation.name),
        evolutionChainUrl: speciesDetails.evolution_chain?.url,
        stats: details.stats.map((s) => ({
          name: capitalizeFirstLetter(s.stat.name.replace("-", " ")),
          base_stat: s.base_stat,
        })),
        height: details.height,
        weight: details.weight,
        abilities: details.abilities.map((a) =>
          capitalizeFirstLetter(a.ability.name.replace("-", " "))
        ),
      };
    } catch (error) {
      console.error(`Failed to fetch AppPokemonDetails for ${id}:`, error);
      return null;
    }
  }
);

export const getPokemonInEvolutionChainByName = cache(
  async (pokemonName: string): Promise<AppPokemon[]> => {
    let speciesDetails: PokemonSpeciesDetails;
    try {
      speciesDetails = await getPokemonSpeciesDetails(
        pokemonName.toLowerCase()
      );
    } catch (error) {
      console.error(
        `Failed to fetch species details for ${pokemonName}:`,
        error
      );
      throw new Error(`Pokémon "${pokemonName}" not found.`);
    }

    if (!speciesDetails.evolution_chain?.url) {
      console.warn(`No evolution chain URL for ${pokemonName}`);
      const singlePokemon = await fetchSingleAppPokemon(speciesDetails.id);
      return singlePokemon ? [singlePokemon] : [];
    }

    const evolutionChainData = await getEvolutionChainByUrl(
      speciesDetails.evolution_chain.url
    );
    if (!evolutionChainData) {
      return [];
    }

    const pokemonNamesInChain = extractPokemonNamesFromChain(
      evolutionChainData.chain
    );

    const appPokemonPromises = pokemonNamesInChain.map((name) =>
      fetchSingleAppPokemon(name)
    );
    const appPokemonResults = await Promise.all(appPokemonPromises);

    return (appPokemonResults.filter((p) => p !== null) as AppPokemon[]).sort(
      (a, b) => a.id - b.id
    );
  }
);

export const fetchAllPokemonData = cache(async (): Promise<AppPokemon[]> => {
  // Usar un límite más sensato si POKEMON_FETCH_LIMIT no está definido, o hacerlo un parámetro.
  const limit = Math.max(
    1,
    Math.min(Number(process.env.POKEMON_FETCH_LIMIT || 151), 151)
  );
  const allPokemonData: AppPokemon[] = [];
  const pokemonIdNumbers: number[] = Array.from(
    { length: limit },
    (_, i) => i + 1
  );

  for (let i = 0; i < pokemonIdNumbers.length; i += BATCH_SIZE) {
    const batchIds = pokemonIdNumbers.slice(i, i + BATCH_SIZE);
    // Usar fetchSingleAppPokemon para obtener el tipo AppPokemon y manejar errores individuales
    const batchPromises = batchIds.map((id) => fetchSingleAppPokemon(id));

    const settledResults = await Promise.allSettled(batchPromises);

    settledResults.forEach((result) => {
      if (result.status === "fulfilled" && result.value) {
        allPokemonData.push(result.value);
      }
    });
  }

  return allPokemonData.sort((a, b) => a.id - b.id);
});

export const fetchAllPokemonFilterData = cache(
  async (
    filterType: "type" | "generation", // Renombrado para mayor claridad
    id: number | string
  ): Promise<AppPokemon[]> => {
    let pokemonListItems: PokemonListItem[] = [];
    if (filterType === "type") {
      pokemonListItems = await getTypeDetail(id);
    } else if (filterType === "generation") {
      pokemonListItems = await getGenerationDetail(id);
    }

    const allPokemonData: AppPokemon[] = [];
    const pokemonToFetch: (string | number)[] = [];

    for (const item of pokemonListItems) {
      // Extraer ID de la URL si está disponible, de lo contrario usar el nombre.
      // fetchSingleAppPokemon puede manejar ambos.
      const pokemonIdOrName =
        item.url.split("/").filter(Boolean).pop() || item.name;
      if (pokemonIdOrName) {
        pokemonToFetch.push(pokemonIdOrName);
      }
    }

    for (let i = 0; i < pokemonToFetch.length; i += BATCH_SIZE) {
      const batchItems = pokemonToFetch.slice(i, i + BATCH_SIZE);
      // Usar fetchSingleAppPokemon para obtener el tipo AppPokemon y manejar errores individuales
      const batchPromises = batchItems.map((item) =>
        fetchSingleAppPokemon(item)
      );

      const settledResults = await Promise.allSettled(batchPromises);
      settledResults.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
          allPokemonData.push(result.value);
        }
      });
    }

    return allPokemonData.sort((a, b) => a.id - b.id);
  }
);
