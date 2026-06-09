import { SignUp } from "@clerk/nextjs";
import { hasClerkPublishableKey } from "@/lib/saas/config";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  if (!hasClerkPublishableKey()) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-sm text-neutral-400">
        Authentication is not configured.
      </main>
    );
  }
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <SignUp />
    </main>
  );
}
