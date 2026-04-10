import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "warning"
    | "outline"
    | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
  children,
      variant = "primary",
      size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
      className = "",
  disabled,
  ...props
    },
    ref,
  ) {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
      primary:
        "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-md hover:shadow-lg",
      secondary:
        "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 shadow-md",
      success:
        "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-md",
      danger:
        "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-md",
      warning:
        "bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-400 shadow-md",
      outline:
        "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
      ghost: "text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
  };

  const sizes = {
      sm: "px-3 py-1.5 text-sm gap-1.5",
      md: "px-4 py-2 text-base gap-2",
      lg: "px-6 py-3 text-lg gap-2.5",
      xl: "px-8 py-4 text-xl gap-3",
  };

    const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
        ref={ref}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
  },
);

export default Button;
