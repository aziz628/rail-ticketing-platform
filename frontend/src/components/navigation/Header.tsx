import { type ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import logo from '@/assets/Logo_SNCFT.png';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

interface HeaderProps {
  leftContent?: ReactNode;
  centerContent?: ReactNode;
  rightContent?: ReactNode;
  className?: string;
}

export const Header = ({ leftContent, centerContent, rightContent, className = "" }: HeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const {isAuthenticated} =useAuthStore();

  return (
    <header className={cn("fixed top-0 z-50 w-full border-b border-slate-100 bg-white dark:bg-slate-900 shadow-sm h-16", className)}>
      <div className="container min-w-full h-full px-4 flex items-center justify-between">
        {/* Left Slot: Logo + Toggle */}
        <div className="flex items-center gap-4">
          {leftContent}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={logo} className="md:h-10 h-8 w-auto" alt="SNCFT Logo" />
          </Link>
        </div>

        {/* Desktop Navigation (Hidden on Mobile) */}
        <div className="hidden md:flex items-center flex-1 justify-center">
          {centerContent}
        </div>

        {/* Desktop Auth/User (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-4">
          {rightContent}
        </div>

        {/* Mobile Menu Toggle */}
        { !isAuthenticated && (
          <div className="flex md:hidden items-center gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger 
              render={
                <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-300">
                  <Menu className="h-6 w-6" />
                </Button>
              }
            />
            <DialogContent className="fixed top-0 right-0 left-auto bottom-0 h-full w-[280px] max-w-[80vw] translate-x-0 translate-y-0 rounded-none border-l shadow-2xl animate-in slide-in-from-right duration-300">
              
              <div className="flex flex-col gap-6 pt-4">
                {/* Mobile Center Content (Links) */}
                <div className="flex flex-col gap-2" onClick={() => setIsOpen(false)}>
                  {centerContent}
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                {/* Mobile Right Content (Auth) */}
                <div className="flex flex-col gap-3" onClick={() => setIsOpen(false)}>
                  {rightContent}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div> ) }
      </div>
    </header>
  );
};
