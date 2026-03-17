"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Scissors,
  Users,
  Calendar,
  BarChart3,
  Package,
  Percent,
  LogOut,
  Menu,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Serviços",
    href: "/admin/services",
    icon: Scissors,
  },
  {
    label: "Barbeiros",
    href: "/admin/barbers",
    icon: Users,
  },
  {
    label: "Agendamentos",
    href: "/admin/bookings",
    icon: Calendar,
  },
  {
    label: "Finanças",
    href: "/admin/finances",
    icon: BarChart3,
  },
  {
    label: "Estoque",
    href: "/admin/inventory",
    icon: Package,
  },
  {
    label: "Comissões",
    href: "/admin/commissions",
    icon: Percent,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed left-4 top-4 z-40 md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-2"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-30 h-screen w-64 border-r border-zinc-800 bg-zinc-900/50 backdrop-blur transition-transform md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-6 space-y-8">
          {/* Logo */}
          <div className="space-y-2">
            <h1 className="text-xl font-bold gradient-text">BarberManager</h1>
            <p className="text-xs text-zinc-500">Admin Dashboard</p>
          </div>

          {/* Menu */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-amber-600/20 text-amber-600 border border-amber-600/30"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <button
            onClick={() => signOut({ redirectTo: "/" })}
            className="flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-red-500 hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
