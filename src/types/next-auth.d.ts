/**
 * NextAuth's own types carry only the fields it manages. Ours are declared
 * here so the session token and tenant cannot be read off a token object
 * without the compiler knowing they exist.
 *
 * `isEmailVerified`, not `emailVerified`: NextAuth already declares
 * `User.emailVerified` as `Date | null` for its adapter interface, and
 * shadowing it with a boolean is a type error rather than an override.
 */

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    /** Opaque reference to a revocable core.session row. Server-side only. */
    sessionToken: string;
    activeTenantId: string | null;
    isEmailVerified: boolean;
  }

  interface Session {
    userId: string | null;
    activeTenantId: string | null;
    isEmailVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    /** Never copied onto the Session — it must not reach the browser. */
    sessionToken?: string;
    userId?: string;
    activeTenantId?: string | null;
    isEmailVerified?: boolean;
  }
}
