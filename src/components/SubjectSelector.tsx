"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";

interface Subject {
  id: string;
  code: string;
  name: string;
  scheduleDay?: string | null;
  scheduleTime?: string | null;
}

export default function SubjectSelector({
  subjects,
  selectedSubjectId,
}: {
  subjects: Subject[];
  selectedSubjectId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("subjectId", e.target.value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-3">
      <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
      <select
        value={selectedSubjectId}
        onChange={handleChange}
        className="flex h-10 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      >
        {subjects.map((sub) => (
          <option key={sub.id} value={sub.id}>
            {sub.code} — {sub.name}
            {sub.scheduleDay ? ` (${sub.scheduleDay}${sub.scheduleTime ? " " + sub.scheduleTime : ""})` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
