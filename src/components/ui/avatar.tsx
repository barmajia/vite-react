import * as React from "react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/utils/avatarUtils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string | null;
  src?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, name, src, alt = "", size = "md", ...props }, ref) => {
    const initials = getInitials(name);

    const [imageError, setImageError] = React.useState(false);
    const showImage = src && !imageError;

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full items-center justify-center font-semibold border-2 backdrop-blur",
          "bg-white/80 border-black text-black",
          "dark:bg-black/80 dark:border-white dark:text-white",
          sizeClasses[size],
          className,
        )}
        title={name || undefined}
        {...props}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt || name || ""}
            className="aspect-square h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="uppercase">{initials}</span>
        )}
      </div>
    );
  },
);
Avatar.displayName = "Avatar";

export { Avatar };
