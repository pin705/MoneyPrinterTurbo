import {
  Clapperboard,
  CreditCard,
  LayoutDashboard,
  Library,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  /** i18n key (English string doubles as the key). */
  labelKey: string;
  icon: LucideIcon;
}

/** Primary product surfaces — the tool itself. */
export const PRIMARY_NAV: NavItem[] = [
  { to: "/create", labelKey: "Create", icon: Clapperboard },
  { to: "/library", labelKey: "Library", icon: Library },
];

/** Account surfaces — wired up in later phases (Auth, Billing). */
export const ACCOUNT_NAV: NavItem[] = [
  { to: "/dashboard", labelKey: "Dashboard", icon: LayoutDashboard },
  { to: "/billing", labelKey: "Billing", icon: CreditCard },
  { to: "/settings", labelKey: "Account", icon: Settings },
];
