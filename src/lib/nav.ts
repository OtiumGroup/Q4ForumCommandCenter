import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CalendarClock,
  PartyPopper,
  UserCircle,
  FolderOpen,
  BookOpen,
  ScrollText,
  Target,
  LibraryBig,
  Settings,
  ShieldCheck,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "Home", icon: LayoutDashboard },
  { href: "/meetings", label: "Upcoming Meetings", icon: CalendarClock },
  { href: "/events", label: "Upcoming Events", icon: PartyPopper },
  { href: "/bio", label: "Member Bios", icon: UserCircle },
  { href: "/documents", label: "Documents", icon: FolderOpen },
  { href: "/books", label: "Books & Podcasts", icon: BookOpen },
  { href: "/constitution", label: "Constitution", icon: ScrollText },
  { href: "/goals", label: "Goals & Accountability", icon: Target },
  { href: "/resources", label: "EO Resources", icon: LibraryBig },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Admin", icon: ShieldCheck, adminOnly: true },
];

export const SETTINGS_ITEM: NavItem = {
  href: "/settings",
  label: "Settings",
  icon: Settings,
};
