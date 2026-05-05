import { Lock, type LucideIcon } from "lucide-react";

interface ProfileInfoRowProps {
  label: string;
  value: string;
  isReadOnly?: boolean;
  className?: string;
  icon?: LucideIcon;
}

export const ProfileInfoRow = ({ label, value, isReadOnly = true, className = "", icon: Icon }: ProfileInfoRowProps) => {
  return (
    <div className={`flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 last:border-0 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && <Icon className="text-slate-400 h-5 w-5" />}
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
          <span className="block text-sm font-bold text-slate-900 dark:text-white mt-0.5">{value}</span>
        </div>
      </div>
      {isReadOnly && (
        <Lock className="text-slate-300 dark:text-slate-600 h-4 w-4" />
      )}
    </div>
  );
};
