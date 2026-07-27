/**
 * NextAuth's route handler.
 *
 * v4 exposes a single handler for both verbs; the App Router needs it exported
 * under each name explicitly.
 */

import NextAuth from "next-auth";

import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
