import type { Role, AccountStatus } from "@/types";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: "RefreshAccessTokenError";
    user: {
      id: string;
      email: string;
      role: Role;
      status: AccountStatus;
      name?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    role: Role;
    status: AccountStatus;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    role: Role;
    status: AccountStatus;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    error?: "RefreshAccessTokenError";
  }
}
