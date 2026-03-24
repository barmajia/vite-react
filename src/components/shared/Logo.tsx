import { cn } from "@/lib/utils";
import auroraLogo from "/aurora-logo.svg";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  variant?: "default" | "dark" | "light";
}

export function Logo({
  className,
  size = "md",
  showText = true,
  variant = "default",
}: LogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  const taglineSizes = {
    sm: "text-[8px]",
    md: "text-[9px]",
    lg: "text-[10px]",
    xl: "text-[11px]",
  };

  const textColors = {
    default:
      "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-gray-200",
    dark: "from-gray-900 via-gray-800 to-gray-900",
    light: "from-white via-gray-100 to-gray-200",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 group",
        showText ? "" : "",
        className,
      )}
    >
      {/* Logo Image Container */}
      <div
        className={cn(
          "relative rounded-xl overflow-hidden shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-105",
          sizeClasses[size],
        )}
      >
        <img
          src={auroraLogo}
          alt="Aurora"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Text Section */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <span
            className={cn(
              "font-bold bg-clip-text text-transparent",
              textColors[variant],
              textSizes[size],
            )}
          >
            AURORA
          </span>
          <span
            className={cn(
              "font-semibold text-blue-600 dark:text-blue-400 tracking-[0.25em] uppercase",
              taglineSizes[size],
            )}
          >
            SHOP
          </span>
        </div>
      )}
    </div>
  );
}
