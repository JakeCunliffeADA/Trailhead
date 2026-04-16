import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UploadRouteForm } from "@/components/routes/upload-route-form";

export const metadata: Metadata = { title: "Import GPX" };

export default async function UploadRoutePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <Link href="/routes" className="text-sm text-muted-foreground hover:text-foreground">
        ← Routes
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-bold tracking-tight">Import GPX</h1>
      <UploadRouteForm />
    </main>
  );
}
