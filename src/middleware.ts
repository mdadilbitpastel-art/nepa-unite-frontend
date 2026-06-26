import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { Role } from "@/types";

/**
 * Route protection + role gating.
 * Each portal prefix is restricted to its role; mismatched roles are bounced
 * to their own home. Unauthed users hit the NextAuth signIn page.
 */
const ROLE_PREFIX: Record<string, Role> = {
  "/buyer": "buyer",
  "/seller": "seller",
  "/admin": "admin",
  "/auditor": "auditor",
};

const ROLE_HOME: Record<Role, string> = {
  buyer: "/buyer",
  seller: "/seller",
  admin: "/admin",
  auditor: "/auditor",
};

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role as Role | undefined;
    if (!role) return NextResponse.next();

    const matched = Object.entries(ROLE_PREFIX).find(([prefix]) =>
      pathname.startsWith(prefix),
    );
    if (matched && matched[1] !== role) {
      return NextResponse.redirect(new URL(ROLE_HOME[role], req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  },
);

export const config = {
  matcher: ["/buyer/:path*", "/seller/:path*", "/admin/:path*", "/auditor/:path*"],
};
