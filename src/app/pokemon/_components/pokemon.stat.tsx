import {
  BarChart2,
  Zap,
  Shield,
  Swords,
  Heart,
  Brain,
  Wind,
} from "lucide-react";

import { Progress } from "@/components/ui/progress";

export default function PokemonStatDisplay({
  name,
  value,
}: {
  name: string;
  value: number;
}) {
  let IconComponent;
  let progressColorClass = "bg-primary";

  switch (name.toLowerCase()) {
    case "hp":
      IconComponent = Heart;
      progressColorClass =
        value > 70
          ? "bg-green-500"
          : value > 40
          ? "bg-yellow-500"
          : "bg-red-500";
      break;
    case "attack":
      IconComponent = Swords;
      progressColorClass =
        value > 70
          ? "bg-red-500"
          : value > 40
          ? "bg-orange-500"
          : "bg-yellow-500";
      break;
    case "defense":
      IconComponent = Shield;
      progressColorClass =
        value > 70 ? "bg-blue-500" : value > 40 ? "bg-sky-500" : "bg-cyan-500";
      break;
    case "special attack":
      IconComponent = Zap;
      progressColorClass =
        value > 70
          ? "bg-purple-500"
          : value > 40
          ? "bg-pink-500"
          : "bg-rose-500";
      break;
    case "special defense":
      IconComponent = Brain;
      progressColorClass =
        value > 70
          ? "bg-teal-500"
          : value > 40
          ? "bg-emerald-500"
          : "bg-lime-500";
      break;
    case "speed":
      IconComponent = Wind;
      progressColorClass =
        value > 70
          ? "bg-yellow-400"
          : value > 40
          ? "bg-amber-400"
          : "bg-orange-400";
      break;
    default:
      IconComponent = BarChart2;
  }

  const normalizedValue = Math.min((value / 255) * 100, 100);

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-muted-foreground flex items-center">
          {IconComponent && <IconComponent className="w-4 h-4 mr-2" />}
          {name}
        </span>
        <span className="text-sm font-semibold text-foreground">{value}</span>
      </div>
      <Progress
        value={normalizedValue}
        className="h-2 [&>div]:bg-opacity-80"
        indicatorClassName={progressColorClass}
      />
    </div>
  );
}
