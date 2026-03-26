import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 animate-pulse flex items-center justify-center">
            <Sparkles className="h-10 w-10 text-white" />
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
