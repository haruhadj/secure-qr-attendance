import { redirect } from "next/navigation";
import { isSetupRequired } from "@/src/app/actions/setup";
import SetupForm from "@/src/components/SetupForm";

export const dynamic = "force-dynamic";

// Public first-run page. Self-locks: once an admin exists it redirects to login.
export default async function SetupPage() {
  if (!(await isSetupRequired())) redirect("/");

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <SetupForm />
    </main>
  );
}
