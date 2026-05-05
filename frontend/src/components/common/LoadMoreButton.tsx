import * as React from 'react';
import { Button } from '@/components/ui/button';
import { RotatingLoader } from '@/components/ui/rotating-loader';
import { cn } from '@/lib/utils';

interface LoadMoreButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  label?: string;
}

export const LoadMoreButton = ({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  label = 'Charger plus',
  className,
  ...props
}: LoadMoreButtonProps) => {
  if (!hasNextPage) return null;

  return (
    <div className="flex justify-center pt-4">
      <Button
        variant="outline"
        onClick={() => fetchNextPage()}
        disabled={isFetchingNextPage}
        className={cn("h-10 px-8 font-bold text-[11px] uppercase tracking-widest border-slate-200", className)}
        {...props}
      >
        {isFetchingNextPage ? <RotatingLoader /> : label}
      </Button>
    </div>
  );
};
