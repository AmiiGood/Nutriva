"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Playfair_Display } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  Calendar,
  Apple,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Sparkles,
} from "lucide-react";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["700"] });

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Pacientes", href: "/pacientes", icon: Users },
  {
    label: "Planes",
    href: "/planes",
    icon: UtensilsCrossed,
    children: [
      { label: "Todos los planes", href: "/planes" },
      { label: "Plantillas", href: "/planes/plantillas" },
    ],
  },
  { label: "Citas", href: "/citas", icon: Calendar },
  { label: "Alimentos", href: "/alimentos", icon: Apple },
];

const navBottom = [
  { label: "Configuración", href: "/configuracion", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={`flex items-center h-16 px-4 border-b border-zinc-100 ${collapsed ? "justify-center" : "justify-between"}`}
      >
        {!collapsed && (
          <span
            className={`${playfair.className} text-xl font-bold text-zinc-900`}
          >
            Nutriva
          </span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden lg:flex w-7 h-7 items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Nav principal */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ label, href, icon: Icon, children }) => {
          const active = isActive(href);
          const hasChildren = !!children;
          const childActive = children?.some((c) => isActive(c.href));

          return (
            <div key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                  active || childActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${active || childActive ? "text-emerald-600" : "text-zinc-400 group-hover:text-zinc-600"}`}
                />
                {!collapsed && <span className="flex-1">{label}</span>}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                    {label}
                  </div>
                )}
              </Link>

              {/* Submenú */}
              {!collapsed && hasChildren && (childActive || active) && (
                <div className="ml-7 mt-0.5 space-y-0.5 border-l border-zinc-100 pl-3">
                  {children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`block py-1.5 text-xs font-medium transition-colors ${
                        pathname === child.href
                          ? "text-emerald-600"
                          : "text-zinc-400 hover:text-zinc-700"
                      }`}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Nav bottom */}
      <div className="px-3 py-4 border-t border-zinc-100 space-y-0.5">
        {navBottom.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
              isActive(href)
                ? "bg-emerald-50 text-emerald-700"
                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0 text-zinc-400 group-hover:text-zinc-600" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-all group relative"
        >
          <LogOut className="w-4 h-4 shrink-0 text-zinc-400 group-hover:text-red-500" />
          {!collapsed && <span>Cerrar sesión</span>}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
              Cerrar sesión
            </div>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar desktop */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden lg:flex flex-col fixed top-0 left-0 h-full bg-white border-r border-zinc-100 z-30 overflow-hidden"
      >
        <SidebarContent />
      </motion.aside>

      {/* Sidebar mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-60 bg-white border-r border-zinc-100 z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <motion.main
        animate={{ marginLeft: collapsed ? 64 : 240 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden lg:block flex-1 min-h-screen"
      >
        {/* Topbar mobile */}
        <div className="lg:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-zinc-100">
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5 text-zinc-600" />
          </button>
          <span
            className={`${playfair.className} text-lg font-bold text-zinc-900`}
          >
            Nutriva
          </span>
          <div className="w-5" />
        </div>

        <div className="p-6 lg:p-8">{children}</div>
      </motion.main>

      {/* Mobile main (sin margin) */}
      <main className="lg:hidden flex-1 min-h-screen flex flex-col">
        <div className="flex items-center justify-between h-14 px-4 bg-white border-b border-zinc-100">
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5 text-zinc-600" />
          </button>
          <span
            className={`${playfair.className} text-lg font-bold text-zinc-900`}
          >
            Nutriva
          </span>
          <div className="w-5" />
        </div>
        <div className="p-4 flex-1">{children}</div>
      </main>
    </div>
  );
}
