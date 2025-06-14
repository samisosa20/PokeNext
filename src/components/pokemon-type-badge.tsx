
import type { ElementType } from 'react';
import {
  Flame, Droplets, Leaf, Zap, Snowflake, Hand, Bot, Mountain, Bird, Brain, Bug, Ghost, Shield, Sparkles, CircleDot, Dna, Package, HelpCircle, Eye, Moon, Skull, Anchor, Diamond, VenetianMask, Grip, Swords, Sun, Cloudy, Star, Puzzle, Ban, TrendingUp, ZapOff, Type, CircleSlashed, FlaskConical
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PokemonTypeBadgeProps {
  type: string;
  size?: 'sm' | 'md';
}

export const typeColors: { [key: string]: string } = {
  normal: 'bg-gray-400 dark:bg-gray-500',
  fire: 'bg-red-500 dark:bg-red-600',
  water: 'bg-blue-500 dark:bg-blue-600',
  grass: 'bg-green-500 dark:bg-green-600',
  electric: 'bg-yellow-400 dark:bg-yellow-500',
  ice: 'bg-cyan-400 dark:bg-cyan-500',
  fighting: 'bg-orange-600 dark:bg-orange-700',
  poison: 'bg-purple-600 dark:bg-purple-700',
  ground: 'bg-amber-600 dark:bg-amber-700', // Changed from yellow to amber for distinction
  flying: 'bg-indigo-400 dark:bg-indigo-500',
  psychic: 'bg-pink-500 dark:bg-pink-600',
  bug: 'bg-lime-500 dark:bg-lime-600',
  rock: 'bg-stone-500 dark:bg-stone-600', // Changed from yellow to stone
  ghost: 'bg-violet-700 dark:bg-violet-800', // Changed from indigo to violet
  dragon: 'bg-fuchsia-700 dark:bg-fuchsia-800', // Changed from purple to fuchsia
  dark: 'bg-neutral-700 dark:bg-neutral-800', // Changed from gray to neutral
  steel: 'bg-slate-500 dark:bg-slate-600', // Changed from gray to slate
  fairy: 'bg-rose-400 dark:bg-rose-500', // Changed from pink to rose
  unknown: 'bg-gray-300 dark:bg-gray-400',
  shadow: 'bg-neutral-800 dark:bg-neutral-900',
};

export const typeIcons: { [key: string]: ElementType } = {
  normal: CircleDot,
  fire: Flame,
  water: Droplets,
  grass: Leaf,
  electric: Zap,
  ice: Snowflake,
  fighting: Hand,
  poison: FlaskConical,
  ground: Mountain,
  flying: Bird,
  psychic: Brain,
  bug: Bug,
  rock: Diamond,
  ghost: Ghost,
  dragon: Dna,
  dark: Moon,
  steel: Shield,
  fairy: Sparkles,
  unknown: HelpCircle,
  shadow: Eye, // Placeholder
};

const PokemonTypeBadge: React.FC<PokemonTypeBadgeProps> = ({ type, size = 'md' }) => {
  const bgColor = typeColors[type.toLowerCase()] || typeColors.unknown;
  const IconComponent = typeIcons[type.toLowerCase()] || typeIcons.unknown;

  const badgeSizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-xs rounded' : 'px-2.5 py-1 text-sm rounded-md';
  const iconSizeClasses = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium text-white capitalize shadow-md',
        badgeSizeClasses,
        bgColor
      )}
      aria-label={`Pokemon type: ${type}`}
    >
      <IconComponent className={cn('mr-1', iconSizeClasses)} />
      {type}
    </span>
  );
};

export default PokemonTypeBadge;
