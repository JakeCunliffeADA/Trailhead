import Link from "next/link";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";

const navLinkClass = "text-sm text-muted-foreground hover:text-foreground";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Trailhead
        </Link>

        <nav className="flex items-center gap-4">
          {session?.user ? (
            <>
              <Link href="/gear" className={navLinkClass}>Gear</Link>
              <Link href="/kits" className={navLinkClass}>Kits</Link>
              <Link href="/routes" className={navLinkClass}>Routes</Link>
              <Link href="/trips" className={navLinkClass}>Trips</Link>
              <SignOutButton />
            </>
          ) : (
            <Link href="/sign-in" className="text-sm font-medium">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
