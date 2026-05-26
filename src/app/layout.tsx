import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/src/index.css";
import { Toaster } from "@/src/components/ui/sonner";
import Providers from "@/src/components/Providers";
import Navbar from "@/src/components/Navbar";
import ProgressBar from "@/src/components/ProgressBar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OLAC AttendQR",
  description: "QR-Based Attendance Monitoring System — Our Lady of Assumption College",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} overflow-x-hidden`}>
        <Providers>
          <ProgressBar />
          {session?.user && <Navbar role={(session.user as any).role} />}
          <div className={session?.user ? "pb-20 md:pb-0" : ""}>
            {children}
          </div>
        </Providers>
        <Toaster position="top-right" expand={false} richColors />
      </body>
    </html>
  );
}
