import { ClerkProvider } from "@clerk/nextjs";
import { hasClerkPublishableKey } from "@/lib/saas/config";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Only mount ClerkProvider when configured; otherwise the app renders exactly
  // as before (keeps builds without Clerk secrets green and backward compatible).
  if (hasClerkPublishableKey()) {
    return <ClerkProvider>{children}</ClerkProvider>;
  }
  return children;
}
