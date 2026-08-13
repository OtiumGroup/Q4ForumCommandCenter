"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { NAV_GROUPS, ADMIN_NAV_ITEMS, SETTINGS_ITEM, type NavItem, type NavGroup } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/login/actions";
import { AccountMenu } from "@/components/shared/account-menu";

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/q4-mark.png" alt="Q4" className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-[0_8px_18px_-6px_rgba(0,0,0,0.5)] ring-1 ring-black/10" />
      <div className="leading-tight">
        <p className="font-display text-xl font-semibold tracking-tight">EO Q4 Forum</p>
        <p className="text-[12px] text-sidebar-foreground/60">Command Center</p>
      </div>
    </div>
  );
}

function NavItemLink({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate?: () => void }) {
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg py-2 pl-3.5 pr-3 text-sm font-medium transition-all duration-200 ease-out",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
          : "text-sidebar-foreground/70 hover:translate-x-0.5 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
      )}
    >
      <span
        className={cn(
          "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gold transition-transform duration-300 ease-out",
          active ? "scale-y-100" : "scale-y-0"
        )}
      />
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all duration-200",
          active
            ? "border-transparent bg-accent text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.18)]"
            : "border-border bg-card text-accent/75 shadow-[0_1px_1px_rgba(38,35,29,0.05)] group-hover:border-accent/40 group-hover:bg-accent/15 group-hover:text-accent"
        )}
      >
        <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
      </span>
      {item.label}
    </Link>
  );
}

function NavLinks({ groups, pathname, onNavigate }: { groups: NavGroup[]; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="mb-0.5 px-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold/90">
            {group.label}
          </p>
          {group.items.map((item) => (
            <NavItemLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </div>
      ))}
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

  const manageItems = [...(isAdmin ? ADMIN_NAV_ITEMS : []), SETTINGS_ITEM];
  const groups: NavGroup[] = [...NAV_GROUPS, { label: "Manage", items: manageItems }];

  return (
    <div className="flex min-h-svh w-full">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex print:hidden">
        <div className="px-5 py-6">
          <BrandMark />
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <NavLinks groups={groups} pathname={pathname} />
        </div>
        <div className="border-t border-sidebar-border p-3">
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-[18px] w-[18px]" /> Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-border bg-card/80 px-4 backdrop-blur-md lg:px-8 print:hidden">
          <div className="flex items-center gap-3 lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="shrink-0 px-5 py-6">
                  <BrandMark />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
                  <NavLinks groups={groups} pathname={pathname} onNavigate={() => setOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="ml-auto">
            <AccountMenu fullName={fullName} photoUrl={photoUrl} />
          </div>
        </header>

        <main className="flex min-w-0 flex-1 flex-col overflow-x-hidden bg-background p-4 lg:p-8 print:overflow-visible print:p-0">
          <div
            key={pathname}
            className="flex min-w-0 flex-1 flex-col duration-500 ease-out animate-in fade-in slide-in-from-bottom-2"
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
