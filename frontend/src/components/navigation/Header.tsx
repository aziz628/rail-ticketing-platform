import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import logo from '@/assets/Logo_SNCFT.png';

interface HeaderProps {
  leftContent?: ReactNode;
  centerContent?: ReactNode;
  rightContent?: ReactNode;
  className?: string;
}

export const Header = ({ leftContent, centerContent, rightContent, className = "" }: HeaderProps) => {
  return (
    <header className={`fixed  top-0 z-50 w-full border-b border-slate-100 bg-white shadow-sm h-16 ${className}`}>
      <div className="container min-w-full h-full px-4 flex items-center justify-between">
        {/* Left Slot: Logo + Toggle */}
        <div className="flex items-center gap-4">
          {leftContent}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={logo} className="md:h-10 h-8 w-auto" alt="SNCFT Logo" />
          </Link>
        </div>

        {/* Center Slot: Main Navigation */}
        <div className="flex items-center flex-1 justify-center">
          {centerContent}
        </div>

        {/* Right Slot: User Info / Auth Buttons */}
        <div className="flex items-center gap-2 md:gap-4">
          {rightContent}
        </div>
      </div>
    </header>
  );
};
