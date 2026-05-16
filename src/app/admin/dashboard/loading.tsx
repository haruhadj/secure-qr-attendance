export default function AdminDashboardLoading() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 animate-pulse">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded-xl" />
          <div className="h-4 w-64 bg-muted rounded-xl" />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-muted h-28" />
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl bg-muted h-96" />
          <div className="rounded-2xl bg-muted h-96" />
        </div>
      </div>
    </div>
  );
}
