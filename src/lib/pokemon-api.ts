
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
    'official-artwork'?: {
      front_default: string | null;
    };
  };
}

export interface PokemonDetails {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: PokemonSprites;
  types: PokemonType[];
  species: { name: string; url: string };
}

export interface PokemonSpeciesDetails {
  id: number;
  name: string;
  generation: {
    name: string; // e.g., "generation-i"
    url: string;
  };
}

export interface AppPokemon {
  id: number;
  name: string;
  imageUrl: string;
  types: string[];
  generation: string;
}

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

export function formatGenerationName(apiName: string): string {
  if (!apiName.startsWith('generation-')) {
    return apiName;
  }
  const parts = apiName.split('-');
  return `Generation ${parts[1].toUpperCase()}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.json();
}

export async function getPokemonList(limit: number = 151, offset: number = 0): Promise<PokemonListItem[]> {
  const data = await fetchJson<{ results: PokemonListItem[] }>(`${POKEAPI_BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
  return data.results;
}

export async function getPokemonDetails(nameOrId: string | number): Promise<PokemonDetails> {
  return fetchJson<PokemonDetails>(`${POKEAPI_BASE_URL}/pokemon/${nameOrId}`);
}

export async function getPokemonSpeciesDetails(nameOrId: string | number): Promise<PokemonSpeciesDetails> {
  return fetchJson<PokemonSpeciesDetails>(`${POKEAPI_BASE_URL}/pokemon-species/${nameOrId}`);
}

export async function fetchAllPokemonData(limit: number = 151): Promise<AppPokemon[]> {
  const list = await getPokemonList(limit);
  const pokemonPromises = list.map(async (pItem) => {
    try {
      const details = await getPokemonDetails(pItem.name);
      const speciesDetails = await getPokemonSpeciesDetails(details.id);

      const imageUrl = details.sprites.other?.['official-artwork']?.front_default ||
                       details.sprites.front_default ||
                       `https://placehold.co/200x200.png`; // Fallback placeholder

      return {
        id: details.id,
        name: details.name.charAt(0).toUpperCase() + details.name.slice(1),
        imageUrl: imageUrl,
        types: details.types.map(t => t.type.name),
        generation: formatGenerationName(speciesDetails.generation.name),
      };
    } catch (error) {
      console.error(`Failed to fetch data for ${pItem.name}:`, error);
      // Return a partial object or null to filter out later if needed
      return null; 
    }
  });

  const results = await Promise.all(pokemonPromises);
  return results.filter(p => p !== null) as AppPokemon[];
}
