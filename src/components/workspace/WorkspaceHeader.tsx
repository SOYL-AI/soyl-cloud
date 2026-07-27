import Image from "next/image";
import Link from "next/link";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { Container } from "@/components/ui/Container";

/**
 * The bar across every authenticated page.
 *
 * Deliberately not the marketing `Navbar`: that one sells the product to
 * someone who has not bought it, and showing "Book a demo" to a signed-in
 * customer is the kind of detail that makes software feel unfinished.
 */
export function WorkspaceHeader({
  workspaceName,
  userEmail,
}: {
  workspaceName: string | null;
  userEmail: string | null;
}) {
  return (
    <header className="border-b border-[var(--color-soyl-gray-200)] bg-white">
      <Container size="lg">
        <div className="flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link href="/app" className="flex items-center gap-3">
              <Image
                src="/images/logo.png"
                alt="SOYL"
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg object-contain"
              />
              <span className="sr-only">SOYL workspace</span>
            </Link>

            {workspaceName && (
              <>
                <span aria-hidden="true" className="text-[var(--color-soyl-gray-200)]">
                  /
                </span>
                <span className="font-semibold text-[var(--color-soyl-charcoal)]">
                  {workspaceName}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {userEmail && (
              <span className="hidden text-sm text-[var(--color-soyl-gray-600)] sm:inline">
                {userEmail}
              </span>
            )}
            <SignOutButton />
          </div>
        </div>
      </Container>
    </header>
  );
}
