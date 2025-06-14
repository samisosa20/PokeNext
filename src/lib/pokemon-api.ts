
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
    throw new Error(`Failed to fetch ${url}: ${response.statusText} (${response.status})`);
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
  // Species API often expects lowercase names or ID
  const query = typeof nameOrId === 'string' ? nameOrId.toLowerCase() : nameOrId;
  return fetchJson<PokemonSpeciesDetails>(`${POKEAPI_BASE_URL}/pokemon-species/${query}`);
}

export async function getEvolutionChainByUrl(url: string): Promise<EvolutionChainResponse | null> {
  try {
    return await fetchJson<EvolutionChainResponse>(url);
  } catch (error) {
    console.error(`Failed to fetch evolution chain from ${url}:`, error);
    return null;
  }
}

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

export async function fetchSingleAppPokemon(nameOrId: string | number): Promise<AppPokemon | null> {
  try {
    const details = await getPokemonDetails(nameOrId);
    // Extract ID from species URL (e.g. "https://pokeapi.co/api/v2/pokemon-species/25/") or use pokemon ID
    const speciesId = details.species.url.split('/').filter(Boolean).pop() || details.id.toString();
    const speciesDetails = await getPokemonSpeciesDetails(speciesId);

    const imageUrl = details.sprites.other?.['official-artwork']?.front_default ||
                     details.sprites.front_default ||
                     `https://placehold.co/200x200.png`;

    return {
      id: details.id,
      name: details.name.charAt(0).toUpperCase() + details.name.slice(1),
      imageUrl: imageUrl,
      types: details.types.map(t => t.type.name),
      generation: formatGenerationName(speciesDetails.generation.name),
      evolutionChainUrl: speciesDetails.evolution_chain?.url,
    };
  } catch (error) {
    console.error(`Failed to fetch AppPokemon data for ${nameOrId}:`, error);
    return null;
  }
}

export async function getPokemonInEvolutionChainByName(pokemonName: string): Promise<AppPokemon[]> {
  let speciesDetails: PokemonSpeciesDetails;
  try {
    speciesDetails = await getPokemonSpeciesDetails(pokemonName.toLowerCase());
  } catch (error) {
    console.error(`Failed to fetch species details for ${pokemonName}:`, error);
    // This error will be caught by the calling function to show a toast
    throw new Error(`Pokémon "${pokemonName}" not found.`);
  }

  if (!speciesDetails.evolution_chain?.url) {
    console.warn(`No evolution chain URL for ${pokemonName}`);
    // If the Pokemon exists but has no evolution chain, just return that single Pokemon.
    const singlePokemon = await fetchSingleAppPokemon(speciesDetails.id);
    return singlePokemon ? [singlePokemon] : [];
  }

  const evolutionChainData = await getEvolutionChainByUrl(speciesDetails.evolution_chain.url);
  if (!evolutionChainData) {
    return [];
  }

  const pokemonNamesInChain = extractPokemonNamesFromChain(evolutionChainData.chain);
  
  const appPokemonPromises = pokemonNamesInChain.map(name => fetchSingleAppPokemon(name));
  const appPokemonResults = await Promise.all(appPokemonPromises);
  
  // Sort by ID to maintain a somewhat logical order (e.g., Pichu -> Pikachu -> Raichu)
  return (appPokemonResults.filter(p => p !== null) as AppPokemon[]).sort((a,b) => a.id - b.id);
}


export async function fetchAllPokemonData(limit: number = 151): Promise<AppPokemon[]> {
  const list = await getPokemonList(limit);
  const pokemonPromises = list.map(async (pItem) => {
    try {
      const details = await getPokemonDetails(pItem.name);
      // Extract ID from species URL (e.g. "https://pokeapi.co/api/v2/pokemon-species/25/") or use pokemon ID
      const speciesId = details.species.url.split('/').filter(Boolean).pop() || details.id.toString();
      const speciesDetails = await getPokemonSpeciesDetails(speciesId);

      const imageUrl = details.sprites.other?.['official-artwork']?.front_default ||
                       details.sprites.front_default ||
                       `https://placehold.co/200x200.png`; 

      return {
        id: details.id,
        name: details.name.charAt(0).toUpperCase() + details.name.slice(1),
        imageUrl: imageUrl,
        types: details.types.map(t => t.type.name),
        generation: formatGenerationName(speciesDetails.generation.name),
        evolutionChainUrl: speciesDetails.evolution_chain?.url,
      };
    } catch (error) {
      console.error(`Failed to fetch data for ${pItem.name}:`, error);
      return null; 
    }
  });

  const results = await Promise.all(pokemonPromises);
  return (results.filter(p => p !== null) as AppPokemon[]).sort((a,b) => a.id - b.id);
}
