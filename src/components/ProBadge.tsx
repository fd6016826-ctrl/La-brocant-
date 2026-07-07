import React from "react";

interface ProBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export const ProBadge: React.FC<ProBadgeProps> = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    xs: "w-3 h-3 text-[7px]",
    sm: "w-4 h-4 text-[9px]",
    md: "w-5.5 h-5.5 text-[11px]",
    lg: "w-7 h-7 text-[14px]"
  };

  return (
    <div
      className={`absolute -bottom-0.5 -right-0.5 z-25 ${sizeClasses[size]} flex items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 text-stone-950 font-black shadow-md border border-white dark:border-stone-900 animate-pulse select-none ${className}`}
      style={{ boxShadow: "0 0 8px rgba(245, 158, 11, 0.6)" }}
      title="Profil Professionnel VIP"
    >
      ★
    </div>
  );
};
