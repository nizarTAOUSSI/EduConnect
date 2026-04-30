import { Loader2 } from 'lucide-react';

export default function Spinner({ className = "w-6 h-6 text-primary" }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}
