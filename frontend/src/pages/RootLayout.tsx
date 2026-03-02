import { Outlet, useLocation } from "@tanstack/react-router";
import { AppSidebar } from "../components/app/AppSidebar";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const SIDEBAR_ROUTES = [
  "/dashboard",
  "/expenses",
  "/budgets",
  "/shared",
  "/reports",
];

export function RootLayout() {
  const { identity } = useInternetIdentity();
  const location = useLocation();

  const showSidebar = SIDEBAR_ROUTES.some((r) =>
    location.pathname.startsWith(r),
  );
  const isAuthenticated = !!identity;

  if (showSidebar && isAuthenticated) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    );
  }

  return <Outlet />;
}
