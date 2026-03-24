import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import auroraLogo from "/aurora.jpg";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
  showLogo?: boolean;
}

export function LoadingSpinner({
  size = "md",
  className,
  text,
  showLogo = false,
}: LoadingSpinnerProps) {
  if (showLogo) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-4",
          className,
        )}
      >
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl animate-pulse">
            <img
              src={auroraLogo}
              alt="Aurora"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-white animate-spin drop-shadow-lg" />
          </div>
        </div>
        {text && (
          <p className="text-sm text-muted-foreground font-medium">{text}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2",
        className,
      )}
    >
      <Loader2
        className={cn(
          "animate-spin text-blue-500",
          size === "sm" && "h-4 w-4",
          size === "md" && "h-8 w-8",
          size === "lg" && "h-12 w-12",
        )}
      />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
