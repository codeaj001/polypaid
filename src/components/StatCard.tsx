interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaGood?: boolean;
}

export function StatCard({ label, value, delta, deltaGood = true }: StatCardProps) {
  return (
    <div className="surface p-5 transition-[transform,box-shadow] duration-200 ease-apple hover:-translate-y-0.5 hover:shadow-lift">
      <div className="label-caps mb-2.5">{label}</div>
      <div className="text-[28px] font-semibold tracking-tight text-ink">{value}</div>
      {delta && (
        <div className={`mt-1.5 font-mono text-[11.5px] ${deltaGood ? 'text-good' : 'text-ink-soft'}`}>
          {delta}
        </div>
      )}
    </div>
  );
}
