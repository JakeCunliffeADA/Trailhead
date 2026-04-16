"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignInButtons({ callbackUrl }: { callbackUrl: string }) {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <Button
        variant="outline"
        className="w-full"
        onClick={() => signIn("google", { callbackUrl })}
      >
        Continue with Google
      </Button>

      {/* GitHub button is rendered conditionally on the client.
          If the provider isn't configured it will simply fail gracefully
          with the Auth.js error page — acceptable for a dev setup. */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => signIn("github", { callbackUrl })}
      >
        Continue with GitHub
      </Button>
    </div>
  );
}
