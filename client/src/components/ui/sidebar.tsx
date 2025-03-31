import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useUserStore } from "@/hooks/use-user-store";
import {
  LayoutDashboard,
  ClipboardList,
  Clock,
  Users,
  MessageSquare,
  BarChart3,
  Calendar,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, isAdmin } = useUserStore();
  const { logoutMutation } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="fixed top-4 left-4 z-50 block lg:hidden rounded-md bg-primary-700 p-2 text-white focus:outline-none"
        onClick={toggleSidebar}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-primary-700 transition-transform duration-300 lg:translate-x-0 lg:static lg:w-20 xl:w-64",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="flex items-center justify-center p-4 lg:justify-center xl:justify-start">
            <span className="text-xl font-bold text-white lg:hidden xl:block">Vignan University</span>
            <span className="text-xl font-bold text-white hidden lg:block xl:hidden">VU</span>
          </div>

          {/* User info */}
          <div className="mt-5 flex flex-col items-center border-b border-primary-600 pb-5 lg:items-center xl:items-start">
            <div className="h-14 w-14 rounded-full bg-primary-400 flex items-center justify-center text-white text-lg font-bold">
              {isAdmin ? "AD" : "FU"}
            </div>
            <div className="mt-2 text-center text-white lg:hidden xl:block">
              <p className="text-sm font-medium">{user?.name || "User"}</p>
              <p className="text-xs">{isAdmin ? "University Admin" : "Faculty"}</p>
            </div>
          </div>

          {/* Admin Navigation */}
          {isAdmin ? (
            <nav className="flex flex-col space-y-1 p-2">
              <NavLink
                href="/dashboard"
                icon={<LayoutDashboard size={24} />}
                label="Dashboard"
                isActive={location === "/" || location === "/dashboard"}
              />
              <NavLink
                href="/exams"
                icon={<ClipboardList size={24} />}
                label="Exams"
                isActive={location === "/exams"}
              />
              <NavLink
                href="/invigilation"
                icon={<Clock size={24} />}
                label="Invigilation"
                isActive={location === "/invigilation"}
              />
              <NavLink
                href="/faculty"
                icon={<Users size={24} />}
                label="Faculty"
                isActive={location === "/faculty"}
              />
              <NavLink
                href="/requests"
                icon={<MessageSquare size={24} />}
                label="Requests"
                isActive={location === "/requests"}
                badge={3}
              />
              <NavLink
                href="/reports"
                icon={<BarChart3 size={24} />}
                label="Reports"
                isActive={location === "/reports"}
              />
            </nav>
          ) : (
            <nav className="flex flex-col space-y-1 p-2">
              <NavLink
                href="/dashboard"
                icon={<LayoutDashboard size={24} />}
                label="Dashboard"
                isActive={location === "/" || location === "/dashboard"}
              />
              <NavLink
                href="/schedule"
                icon={<Calendar size={24} />}
                label="My Schedule"
                isActive={location === "/schedule"}
              />
              <NavLink
                href="/duties"
                icon={<ClipboardList size={24} />}
                label="My Duties"
                isActive={location === "/duties"}
                badge={2}
              />
            </nav>
          )}

          <div className="mt-auto p-4">
            <button
              className="w-full rounded-md bg-primary-600 py-2 px-4 text-center text-sm font-medium text-white hover:bg-primary-500 focus:outline-none mb-2"
              onClick={() => {
                const userStore = useUserStore.getState();
                userStore.switchUserType();
              }}
            >
              Switch to {isAdmin ? "Faculty" : "Admin"} View
            </button>
            <button
              className="w-full rounded-md bg-red-600 py-2 px-4 text-center text-sm font-medium text-white hover:bg-red-500 focus:outline-none"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <div className="flex items-center justify-center space-x-2">
                {logoutMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <LogOut size={16} />
                )}
                <span>{logoutMutation.isPending ? "Logging out..." : "Logout"}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  badge?: number;
}

function NavLink({ href, icon, label, isActive, badge }: NavLinkProps) {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center space-x-3 rounded-md p-3 text-white lg:justify-center xl:justify-start",
          isActive
            ? "bg-primary-800"
            : "hover:bg-primary-600"
        )}
      >
        <div>{icon}</div>
        <span className="lg:hidden xl:block">{label}</span>
        {badge && (
          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-secondary-500 text-xs font-medium text-white lg:hidden xl:block">
            {badge}
          </span>
        )}
      </div>
    </Link>
  );
}
