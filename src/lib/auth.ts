/**
 * NextAuth v4 configuration.
 *
 * The division of labour, which is the whole point of the arrangement:
 *
 * **NextAuth owns the browser.** The session cookie, its encryption, CSRF on
 * the auth routes, the sign-in/sign-out plumbing.
 *
 * **The API owns identity.** Password verification, Argon2id, email
 * verification, password reset, the audit log, and the `core.session` row. The
 * web tier has no database credential and never will.
 *
 * The seam between them is a **revocable opaque session token**. `authorize()`
 * asks the API to authenticate a credential pair; the API creates a
 * `core.session` row and returns its token. NextAuth then carries that token in
 * its encrypted JWT cookie.
 *
 * That last part matters. A plain NextAuth JWT session cannot be revoked —
 * signing out clears the cookie, but a copied token stays valid until it
 * expires, and handbook §23.1 wants revocation semantics. Because our token is
 * only a *reference* to a database row, revoking that row kills the session
 * immediately no matter who holds the cookie.
 *
 * v4 rather than v5: v5 has been in beta for 32 releases and has never shipped
 * stable. v4.24.15 declares `next: ^16` and `react: ^19` in its peer
 * dependencies and is the supported line.
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

/** Mirrors the API's session lifetime so the two cannot disagree. */
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

type ApiLoginResponse = {
  session_token: string;
  user_id: string;
  email: string;
  display_name: string | null;
  active_tenant_id: string | null;
  email_verified: boolean;
};

function apiBaseUrl(): string {
  const base = process.env.API_BASE_URL?.trim();
  if (!base) throw new Error("API_BASE_URL is not set");
  return base.replace(/\/+$/, "");
}

export const authOptions: NextAuthOptions = {
  // Required by the Credentials provider — v4 does not support database
  // sessions alongside it. The revocable part lives in core.session, reached
  // through the token below.
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const response = await fetch(`${apiBaseUrl()}/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
          cache: "no-store",
        });

        // Returning null is how v4 signals "bad credentials". Anything more
        // specific here leaks whether the address exists — the API already
        // answers uniformly for that reason, and this must not undo it.
        if (!response.ok) return null;

        const body = (await response.json()) as ApiLoginResponse;

        return {
          id: body.user_id,
          email: body.email,
          name: body.display_name,
          sessionToken: body.session_token,
          activeTenantId: body.active_tenant_id,
          isEmailVerified: body.email_verified,
        };
      },
    }),
  ],

  callbacks: {
    // Runs on sign-in and on every session read. Only the first call receives
    // `user`, so the session token is copied into the JWT once.
    async jwt({ token, user }) {
      if (user) {
        token.sessionToken = user.sessionToken;
        token.activeTenantId = user.activeTenantId;
        token.isEmailVerified = user.isEmailVerified;
        token.userId = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      session.userId = token.userId ?? null;
      session.activeTenantId = token.activeTenantId ?? null;
      session.isEmailVerified = token.isEmailVerified ?? false;
      // Deliberately NOT copied onto `session`: the session object is
      // serialised to the browser by `useSession`, and the API session token
      // must never leave the server. Server-side callers read it from the JWT
      // via `getToken`.
      return session;
    },
  },

  events: {
    /**
     * Clearing the cookie is not revocation. Without this the `core.session`
     * row stays live and a copied token keeps working until it expires.
     */
    async signOut({ token }) {
      const sessionToken = token?.sessionToken;
      if (!sessionToken) return;

      try {
        await fetch(`${apiBaseUrl()}/v1/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${sessionToken}` },
          cache: "no-store",
        });
      } catch {
        // The cookie is going regardless. A failed revoke is logged by the
        // API's own reaper when the session expires.
      }
    },
  },
};
