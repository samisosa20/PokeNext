
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const PokemonSkeletonCard: React.FC = () => {
  return (
    <Card className="flex flex-col items-center text-center shadow-lg">
      <CardHeader className="p-4 w-full">
        <Skeleton className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-3 rounded-full" />
        <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
        <Skeleton className="h-4 w-1/4 mx-auto" />
      </CardHeader>
      <CardContent className="p-4 pt-0 w-full">
        <div className="flex justify-center space-x-2 mb-3">
          <Skeleton className="h-6 w-16 rounded-md" />
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>
        <Skeleton className="h-5 w-1/2 mx-auto" />
      </CardContent>
    </Card>
  );
};

export default PokemonSkeletonCard;
