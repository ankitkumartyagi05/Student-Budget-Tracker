import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  Receipt,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/expenses", label: "Expenses", icon: Receipt },
  { path: "/budgets", label: "Budgets", icon: PiggyBank },
  { path: "/shared", label: "Shared", icon: Users },
  { path: "/reports", label: "Reports", icon: BarChart3 },
];

export function AppSidebar() {
  const location = useLocation();
  const { clear, identity } = useInternetIdentity();
  const [mobileOpen, setMobileOpen] = useState(false);

  const principal = identity?.getPrincipal().toString();
  const shortPrincipal = principal ? `${principal.slice(0, 8)}...` : "";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-sidebar-border">
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5"
          onClick={() => setMobileOpen(false)}
        >
          <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-sidebar-foreground text-lg">
            BudgetWise
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <item.icon className="w-4.5 h-4.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="px-3 py-2 rounded-lg bg-sidebar-accent mb-2">
          <p className="text-sidebar-foreground/50 text-xs font-medium">
            Signed in as
          </p>
          <p className="text-sidebar-foreground text-xs font-mono truncate">
            {shortPrincipal}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clear}
          className="w-full justify-start text-sidebar-foreground/70 hover:text-red-400 hover:bg-red-400/10 gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar shadow-card"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? (
          <X className="w-5 h-5 text-sidebar-foreground" />
        ) : (
          <Menu className="w-5 h-5 text-sidebar-foreground" />
        )}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          role="presentation"
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <motion.aside
        className={cn(
          "lg:hidden fixed left-0 top-0 bottom-0 z-40 w-64 bg-sidebar sidebar-shadow",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        animate={{ x: mobileOpen ? 0 : -256 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <SidebarContent />
      </motion.aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-sidebar sidebar-shadow h-screen sticky top-0">
        <SidebarContent />
      </aside>
    </>
  );
}
