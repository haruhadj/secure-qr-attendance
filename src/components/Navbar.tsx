/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import {
  ShieldCheck,
  QrCode,
  ClipboardList,
  History,
  LogOut,
  FileWarning,
  ScanLine,
  Users,
  Activity,
  Briefcase
} from "lucide-react";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";

export default function Navbar({ role }: { role: string }) {
  const pathname = usePathname();
  
  if (pathname === "/") return null;

  const teacherLinks = [
    { href: "/teacher/scanner", label: "QR Scanner", icon: ScanLine },
    { href: "/teacher/roster", label: "Class Roster", icon: ClipboardList },
    { href: "/teacher/appeals", label: "Appeals", icon: FileWarning },
  ];

  const studentLinks = [
    { href: "/student/dashboard", label: "My QR ID", icon: QrCode },
    { href: "/student/appeals", label: "Appeals", icon: FileWarning },
  ];

  const adminLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: Activity },
    { href: "/admin/staff", label: "Staff", icon: Briefcase },
    { href: "/admin/masterlist", label: "Masterlist", icon: Users },
    { href: "/admin/audit", label: "Audit Logs", icon: History },
  ];

  const links = role === "TEACHER" ? teacherLinks : role === "ADMIN" ? adminLinks : studentLinks;

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight text-primary">
              <ShieldCheck className="w-5 h-5" />
              <span className="hidden sm:inline">AttendSafe</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              {links.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors",
                    pathname === link.href 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="hidden md:flex text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t border-border safe-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-xl transition-colors",
                pathname === link.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <link.icon className={cn("w-5 h-5", pathname === link.href && "drop-shadow-sm")} />
              <span className="text-[10px] font-medium leading-none">{link.label}</span>
            </Link>
          ))}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-xl text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">Logout</span>
          </button>
          <div className="flex items-center justify-center flex-1">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </>
  );
}
