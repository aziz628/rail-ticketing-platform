import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Header } from "@/components/navigation/Header";
import { Sidebar } from "@/components/navigation/Sidebar";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

interface PrivateLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  user: {
    name: string;
    role: string;
  };
}

export const PrivateLayout = ({ children, navItems, user }: PrivateLayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-page overflow-x-hidden font-sans">
      <Header
        className="fixed top-0 z-50 flex-none"
        leftContent={
          // Mobile menu button
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {/* Mobile menu open/close button */}
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        }
        rightContent={
          // User info
          <div className="text-right leading-tight">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
              {user.role}
            </p>
            <p className="text-xs font-bold text-slate-900 leading-none">
              {user.name}
            </p>
          </div>
        }
      />

      <main className="flex flex-1 mt-16 flex-col md:flex-row w-full relative">
        {/* Desktop Sidebar (Fixed) */}
        <Sidebar 
          navItems={navItems} 
          className="hidden md:flex w-64 h-[calc(100vh-4rem)] fixed top-16 border-r border-slate-200 bg-surface" 
        />

        {/* Mobile Sidebar Overlay
        cover all of the main , pressing the menu button again will close it
        */}
      
        {isMobileMenuOpen && (

            <Sidebar 
              navItems={navItems} 
              className="w-full h-full bg-surface pt-4" 
              onItemClick={() => setIsMobileMenuOpen(false)}
            />
        )}

        {/* Main Content Area: Offset by sidebar width */}
        <div className="flex-1 w-full md:ml-64 flex flex-col p-6 md:p-8">
          <div className="max-w-6xl w-full mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
