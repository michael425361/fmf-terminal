import { SignIn } from "@clerk/nextjs";
import { hasClerkPublishableKey } from "@/lib/saas/config";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  if (!hasClerkPublishableKey()) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-sm text-neutral-400">
        Authentication is not configured.
      </main>
    );
  }
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <SignIn />
    </main>
  );
}
