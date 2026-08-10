"use client";

import { LogOut, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AppearanceControls } from "./appearance-controls";
import { signOut } from "@/app/login/actions";

function initials(name: string | null) {
  if (!name) return "Q4";
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function AccountMenu({ fullName, photoUrl }: { fullName: string | null; photoUrl: string | null }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-border bg-background/60 py-1 pl-1 pr-2.5 transition-colors hover:bg-secondary/60">
          <Avatar className="h-7 w-7">
            {photoUrl ? <AvatarImage src={photoUrl} alt={fullName ?? ""} /> : null}
            <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">{initials(fullName)}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline">{fullName ?? "Member"}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2">
        <p className="px-1 pb-2 pt-1 text-sm font-medium">{fullName ?? "Member"}</p>
        <DropdownMenuSeparator />
        <div className="px-1 py-2">
          <AppearanceControls />
        </div>
        <DropdownMenuSeparator />
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-sm px-1 py-1.5 text-sm text-foreground transition-colors hover:bg-secondary/60"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
