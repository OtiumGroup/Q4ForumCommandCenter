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
  Images,
  LibraryBig,
  Settings,
  ShieldCheck,
  Award,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Forum",
    items: [
      { href: "/home", label: "Home", icon: LayoutDashboard },
      { href: "/meetings", label: "Upcoming Meetings", icon: CalendarClock },
      { href: "/events", label: "Upcoming Events", icon: PartyPopper },
      { href: "/bio", label: "Member Bios", icon: UserCircle },
      { href: "/goals", label: "Goals & Accountability", icon: Target },
      { href: "/positions", label: "Forum Positions", icon: Award },
      { href: "/gallery", label: "Photo Gallery", icon: Images },
    ],
  },
  {
    label: "Library",
    items: [
      { href: "/documents", label: "Documents", icon: FolderOpen },
      { href: "/books", label: "Books & Podcasts", icon: BookOpen },
      { href: "/constitution", label: "Constitution", icon: ScrollText },
      { href: "/resources", label: "EO Resources", icon: LibraryBig },
    ],
  },
];

// Flat list of every non-admin, non-settings nav item — kept for lookups
// (e.g. resolving the current page's title) that don't care about grouping.
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Admin", icon: ShieldCheck, adminOnly: true },
];

export const SETTINGS_ITEM: NavItem = {
  href: "/settings",
  label: "Settings",
  icon: Settings,
};
