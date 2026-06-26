"use client";

import Link from "next/link";
import { LogOut, User, Settings, LifeBuoy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_LABEL } from "@/lib/constants";
import { initials } from "@/lib/utils";

export function UserMenu() {
  const { user, role, signOut } = useAuth();
  if (!user || !role) return null;
  const profileHref = `/${role}/profile`;
  const settingsHref = role === "seller" ? "/seller/settings" : profileHref;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="size-9 border">
          <AvatarFallback>{initials(user.email)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal normal-case tracking-normal">
          <div className="flex flex-col gap-1">
            <span className="truncate text-sm font-medium text-foreground">
              {user.email}
            </span>
            <Badge variant="info" className="w-fit">
              {ROLE_LABEL[role]}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={profileHref}>
            <User /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={settingsHref}>
            <Settings /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="mailto:support@nepaunite.com">
            <LifeBuoy /> Support
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="text-danger focus:bg-danger/10 focus:text-danger [&_svg]:text-danger"
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
