"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Calendar,
  DollarSign,
  Settings,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Employees",
    href: "/admin/dashboard/employees",
    icon: Users,
  },
  {
    label: "Attendance",
    href: "/admin/dashboard/attendance",
    icon: CalendarCheck,
  },
  {
    label: "Leave Requests",
    href: "/admin/dashboard/leaves",
    icon: Calendar,
  },
  {
    label: "Holidays",
    href: "/admin/dashboard/holidays",
    icon: Calendar,
  },
  {
    label: "Annoucement",
    href: "/admin/dashboard/annoucement",
    icon: Calendar,
  },
  {
    label: "Payroll",
    href: "/admin/dashboard/payroll",
    icon: DollarSign,
    subItems: [
      { label: "Overview", href: "/admin/dashboard/payroll" },
      { label: "Settings", href: "/admin/dashboard/settings/payroll" },
    ],
  },
    {
    label: "Settings",
    href: "/admin/dashboard/settings",
    icon: Calendar,
  },
  {
    label: "Company Policy",
    href: "/admin/dashboard/CompanyPolicy",
    icon: Calendar,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden rounded-lg bg-white p-2 shadow-md hover:bg-gray-50"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6 text-gray-700" />
      </button>

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 bg-white border-r border-gray-200 transition-transform duration-300 lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-600 p-2">
                <LayoutDashboard className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Admin Portal
                </h2>
                <p className="text-xs text-gray-500">Management</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="rounded-lg p-1 hover:bg-gray-100 lg:hidden"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <NavItemComponent
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  onNavigate={() => setIsMobileOpen(false)}
                />
              ))}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
}

function NavItemComponent({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(
    pathname?.startsWith(item.href) || false
  );
  const isActive = pathname === item.href;
  const hasSubItems = item.subItems && item.subItems.length > 0;

  if (hasSubItems) {
    return (
      <li>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname?.startsWith(item.href)
              ? "bg-blue-50 text-blue-700"
              : "text-gray-700 hover:bg-gray-50"
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon className="h-4 w-4 flex-shrink-0" />
            <span>{item.label}</span>
          </div>
          <ChevronRight
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        </button>
        {isExpanded && item.subItems && (
          <ul className="mt-1 space-y-1 pl-4">
            {item.subItems.map((subItem) => {
              const isSubActive = pathname === subItem.href;
              return (
                <li key={subItem.href}>
                  <Link
                    href={subItem.href}
                    onClick={onNavigate}
                    className={cn(
                      "block rounded-lg px-3 py-2 text-sm transition-colors",
                      isSubActive
                        ? "bg-blue-50 font-medium text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    {subItem.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-blue-50 text-blue-700"
            : "text-gray-700 hover:bg-gray-50"
        )}
      >
        <item.icon className="h-4 w-4 flex-shrink-0" />
        <span>{item.label}</span>
      </Link>
    </li>
  );
}
