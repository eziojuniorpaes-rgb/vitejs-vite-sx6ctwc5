export function StatCard({ value, label }: { value: string; label: string }) {
  return <div className="card stat"><strong>{value}</strong><span>{label}</span></div>
}
