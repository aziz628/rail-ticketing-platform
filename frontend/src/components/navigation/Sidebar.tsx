import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

interface SidebarProps {
  navItems: NavItem[];
  className?: string;
  onItemClick?: () => void;
}

export const Sidebar = ({ navItems, className = "", onItemClick }: SidebarProps) => {
  const location = useLocation();

  return (
    <aside className={`md:flex w-64 h-[calc(100vh-4rem)] fixed flex-shrink-0 flex-col p-4 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 top-16 overflow-y-auto ${className}`}>
      <nav className="flex flex-col gap-1.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onItemClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="text-sm font-bold">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
