export function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <h3 className="text-3xl font-semibold text-slate-900">{value}</h3>
        {hint ? <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">{hint}</span> : null}
      </div>
    </div>
  );
}
