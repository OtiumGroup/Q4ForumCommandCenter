"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { NAV_ITEMS, ADMIN_NAV_ITEMS, SETTINGS_ITEM, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/login/actions";

function initials(name: string | null) {
  if (!name) return "Q4";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function NavLinks({ items, pathname, onNavigate }: { items: NavItem[]; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "relative flex items-center gap-3 rounded-md py-2 pl-3 pr-3 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
            )}
            <Icon className={cn("h-4 w-4 shrink-0", active && "text-accent")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  children,
  fullName,
  photoUrl,
  isAdmin,
}: {
  children: React.ReactNode;
  fullName: string | null;
  photoUrl: string | null;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = [...NAV_ITEMS, ...(isAdmin ? ADMIN_NAV_ITEMS : []), SETTINGS_ITEM];
  const currentItem = items.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (
    <div className="flex min-h-svh w-full">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2 px-5 py-6">
          <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sidebar-primary to-accent font-display text-sm font-semibold text-sidebar-primary-foreground shadow-sm">
            Q4
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold">EO Q4 Forum</p>
            <p className="text-[11px] text-sidebar-foreground/60">Command Center</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          <NavLinks items={items} pathname={pathname} />
        </div>
        <div className="border-t border-sidebar-border p-3">
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-h-svh flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-sidebar p-0 text-sidebar-foreground">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="flex items-center gap-2 px-5 py-6">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sidebar-primary to-accent font-display text-sm font-semibold text-sidebar-primary-foreground shadow-sm">
                    Q4
                  </div>
                  <div className="leading-tight">
                    <p className="font-display text-sm font-semibold">EO Q4 Forum</p>
                    <p className="text-[11px] text-sidebar-foreground/60">Command Center</p>
                  </div>
                </div>
                <div className="px-3">
                  <NavLinks items={items} pathname={pathname} onNavigate={() => setOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <span className="flex items-center gap-2 font-display text-sm font-semibold">
              {currentItem && <currentItem.icon className="h-4 w-4 text-accent" />}
              {currentItem?.label ?? "EO Q4 Forum"}
            </span>
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            {currentItem && <currentItem.icon className="h-4 w-4 text-accent" />}
            <span className="font-display text-base font-semibold text-foreground">
              {currentItem?.label ?? "EO Q4 Forum"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {photoUrl ? <AvatarImage src={photoUrl} alt={fullName ?? ""} /> : null}
              <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                {initials(fullName)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline">{fullName ?? "Member"}</span>
          </div>
        </header>

        <main className="flex flex-1 flex-col p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
