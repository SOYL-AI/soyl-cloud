"use client";

import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/Button";

/**
 * Sign out.
 *
 * `signOut` clears the cookie *and* fires the `signOut` event in
 * `src/lib/auth.ts`, which calls the API to revoke the `core.session` row.
 * Clearing the cookie alone would leave a copied token working until it
 * expired.
 */
export function SignOutButton() {
  return (
    <Button variant="outline" size="sm" onClick={() => void signOut({ callbackUrl: "/" })}>
      Sign out
    </Button>
  );
}
