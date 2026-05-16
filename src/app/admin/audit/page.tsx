/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { Badge } from "@/src/components/ui/badge";
import { ShieldCheck, History, ArrowRight } from "lucide-react";
import DatePicker from "@/src/components/DatePicker";
import { getUTCMidnight, parseUTCDate, formatDateTime } from "@/src/lib/date";
import { endOfDay } from "date-fns";

export default async function AdminAudit({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { date: dateStr } = await searchParams;
  
  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    redirect("/");
  }

  const selectedDate = dateStr ? parseUTCDate(dateStr) : getUTCMidnight();
  const dateEnd = endOfDay(selectedDate);

  const audits = await prisma.attendanceAudit.findMany({
    where: {
      timestamp: {
        gte: selectedDate,
        lte: dateEnd
      }
    },
    orderBy: { timestamp: "desc" }
  });

  // Fetch user names for "changedBy"
  const userIds = Array.from(new Set(audits.map(a => a.changedBy)));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } }
  });
  const userMap = users.reduce((acc, u) => ({ ...acc, [u.id]: u.name }), {} as any);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-primary" />
              Accountability Audit
            </h1>
            <p className="text-muted-foreground">
              Internal log of all attendance status changes and manual overrides
            </p>
          </div>
          <DatePicker />
        </header>

        <Card className="border-none shadow-xl shadow-border/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-muted-foreground" />
              Change Logs
            </CardTitle>
            <CardDescription>
              {audits.length > 0 ? `Displaying ${audits.length} system operations` : "No system operations recorded for this date"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead>Sequence</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audits.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatDateTime(audit.timestamp)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {userMap[audit.changedBy] || "System"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {audit.oldStatus ? (
                          <Badge variant="outline" className="opacity-50 strike-through text-[10px]">
                            {audit.oldStatus}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed">
                            Empty
                          </Badge>
                        )}
                        <ArrowRight className="w-3 h-3 text-muted-foreground/30" />
                        <Badge 
                          className={
                            audit.newStatus === 'PRESENT' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                            audit.newStatus === 'ABSENT' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }
                        >
                          {audit.newStatus}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground italic">
                      {audit.reason || "Manual Override"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {audits.length === 0 && (
              <div className="text-center py-12 text-muted-foreground italic">
                No audit logs recorded for this date.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
