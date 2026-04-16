import type { Metadata } from "next";
import { SignInButtons } from "@/components/auth/sign-in-buttons";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Trailhead</h1>
        <p className="text-muted-foreground">Sign in to manage your gear and plan trips.</p>
      </div>

      {error === "OAuthAccountNotLinked" && (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
          That email is already linked to a different sign-in method.
        </p>
      )}

      <SignInButtons callbackUrl={callbackUrl ?? "/"} />
    </main>
  );
}
