import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type RotatingLoaderProps = {
  label?: string;
  className?: string;
  fullScreen?: boolean;
};

export const RotatingLoader = ({
  label = 'Loading...',
  className,
  fullScreen = false,
}: RotatingLoaderProps) => {
  const content = (
    <div className={cn('flex items-center gap-3 text-slate-600', className)}>
      <LoaderCircle className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );

  if (fullScreen) {
    return <div className="min-h-screen flex items-center justify-center">{content}</div>;
  }

  return content;
};
