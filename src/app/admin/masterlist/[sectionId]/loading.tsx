export default function SectionMasterlistLoading() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 animate-pulse">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-3 w-32 bg-muted rounded-xl" />
            <div className="h-8 w-48 bg-muted rounded-xl" />
            <div className="h-4 w-40 bg-muted rounded-xl" />
          </div>
          <div className="space-y-2 flex flex-col items-end">
            <div className="h-9 w-36 bg-muted rounded-xl" />
            <div className="h-6 w-28 bg-muted rounded-xl" />
          </div>
        </div>

        {/* Weekly strip */}
        <div className="h-14 w-full bg-muted rounded-2xl" />

        {/* Table card */}
        <div className="rounded-2xl bg-card border border-border shadow-xl overflow-hidden">
          <div className="p-6 space-y-2 border-b border-border">
            <div className="h-5 w-48 bg-muted rounded-xl" />
            <div className="h-3 w-40 bg-muted rounded-xl" />
          </div>
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 w-full bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
