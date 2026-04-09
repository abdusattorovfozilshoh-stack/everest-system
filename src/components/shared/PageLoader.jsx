import { LoaderCircle } from 'lucide-react';

export function PageLoader({ label = 'Ma\'lumotlar yuklanmoqda...' }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-3 rounded-3xl border border-white/60 bg-white/70 text-slate-600 shadow-sm backdrop-blur">
      <LoaderCircle className="h-5 w-5 animate-spin" />
      <span>{label}</span>
    </div>
  );
}
