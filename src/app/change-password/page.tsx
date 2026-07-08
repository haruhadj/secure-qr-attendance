import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/src/lib/auth";
import ForcedPasswordChangeForm from "@/src/components/ForcedPasswordChangeForm";

export const dynamic = "force-dynamic";

// Dedicated forced-change screen. Middleware routes any user whose account is
// still on a default/temporary password here and blocks everything else until
// they set a real one.
export default async function ChangePasswordPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <ForcedPasswordChangeForm />
    </main>
  );
}
