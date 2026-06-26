import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import { API_BASE_URL } from "@/lib/constants";
import type { LoginResponse, Member, Role, AccountStatus } from "@/types";

/**
 * NextAuth (JWT strategy) wrapping the backend's self-issued JWTs.
 * The Credentials provider authenticates against `POST /auth/login`, then we
 * fetch the member profile to learn role + status. Tokens are stored in the
 * NextAuth JWT and refreshed via `POST /auth/refresh` when expired.
 */

async function decodeUserId(accessToken: string): Promise<{
  id: string;
  email: string;
  role: Role;
  status: AccountStatus;
}> {
  // The backend JWT payload carries the user id ("user_id" or "sub").
  const [, payload] = accessToken.split(".");
  const claims = JSON.parse(
    Buffer.from(payload, "base64").toString("utf8"),
  ) as Record<string, unknown>;
  const userId = String(claims.user_id ?? claims.sub ?? "");

  // Enrich with role/status from the members endpoint.
  const res = await fetch(`${API_BASE_URL}/members/${userId}/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Could not load member profile.");
  }
  const member = (await res.json()) as Member;
  return {
    id: member.id,
    email: member.email,
    role: member.role,
    status: member.status,
  };
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: token.refreshToken }),
    });
    const data = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };
    if (!res.ok) throw new Error("refresh failed");
    return {
      ...token,
      accessToken: data.access_token,
      // The backend rotates refresh tokens and blacklists the old one, so we
      // MUST persist the new refresh token or the next refresh will 401.
      refreshToken: data.refresh_token || token.refreshToken,
      accessTokenExpires: Date.now() + data.expires_in * 1000,
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions: NextAuthOptions = {
  // Rolling 24h session — each access extends it, so 24h of inactivity logs out.
  session: { strategy: "jwt", maxAge: 24 * 60 * 60, updateAge: 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.detail ?? "Invalid email or password.");
        }
        const tokens = (await res.json()) as LoginResponse;
        const profile = await decodeUserId(tokens.access_token);
        return {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          status: profile.status,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresIn: tokens.expires_in,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign-in
      if (user) {
        return {
          ...token,
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpires: Date.now() + user.expiresIn * 1000,
        };
      }
      // Still valid → reuse
      if (Date.now() < token.accessTokenExpires - 60_000) {
        return token;
      }
      // Expired → refresh
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      session.user = {
        id: token.id,
        email: token.email,
        role: token.role,
        status: token.status,
        name: session.user?.name,
      };
      return session;
    },
  },
};
