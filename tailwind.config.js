/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Brand Colors
        brand: {
          blue: {
            50: "hsl(210 100% 97%)",
            100: "hsl(210 100% 94%)",
            200: "hsl(210 100% 89%)",
            300: "hsl(210 100% 80%)",
            400: "hsl(210 100% 70%)",
            500: "hsl(210 100% 50%)", // Primary brand color
            600: "hsl(210 100% 45%)",
            700: "hsl(210 100% 35%)",
            800: "hsl(210 100% 25%)",
            900: "hsl(210 100% 15%)",
          },
          purple: {
            50: "hsl(270 100% 97%)",
            100: "hsl(270 100% 94%)",
            200: "hsl(270 100% 89%)",
            300: "hsl(270 100% 80%)",
            400: "hsl(270 100% 70%)",
            500: "hsl(270 60% 50%)", // Middleman color
            600: "hsl(270 60% 45%)",
            700: "hsl(270 60% 35%)",
            800: "hsl(270 60% 25%)",
            900: "hsl(270 60% 15%)",
          },
          green: {
            50: "hsl(142 76% 97%)",
            100: "hsl(142 76% 94%)",
            200: "hsl(142 76% 89%)",
            300: "hsl(142 76% 80%)",
            400: "hsl(142 76% 70%)",
            500: "hsl(142 76% 36%)", // Seller color
            600: "hsl(142 76% 30%)",
            700: "hsl(142 76% 25%)",
            800: "hsl(142 76% 20%)",
            900: "hsl(142 76% 15%)",
          },
          orange: {
            50: "hsl(24 100% 97%)",
            100: "hsl(24 100% 94%)",
            200: "hsl(24 100% 89%)",
            300: "hsl(24 100% 80%)",
            400: "hsl(24 100% 70%)",
            500: "hsl(24 100% 50%)", // Factory color
            600: "hsl(24 100% 45%)",
            700: "hsl(24 100% 35%)",
            800: "hsl(24 100% 25%)",
            900: "hsl(24 100% 15%)",
          },
          red: {
            50: "hsl(0 100% 97%)",
            100: "hsl(0 100% 94%)",
            200: "hsl(0 100% 89%)",
            300: "hsl(0 100% 80%)",
            400: "hsl(0 100% 70%)",
            500: "hsl(0 84% 60%)", // Delivery color
            600: "hsl(0 84% 50%)",
            700: "hsl(0 84% 40%)",
            800: "hsl(0 84% 30%)",
            900: "hsl(0 84% 20%)",
          },
        },
        // Role-specific colors
        customer: {
          DEFAULT: "hsl(var(--brand-blue-500))",
          light: "hsl(var(--brand-blue-100))",
          dark: "hsl(var(--brand-blue-700))",
        },
        seller: {
          DEFAULT: "hsl(var(--brand-green-500))",
          light: "hsl(var(--brand-green-100))",
          dark: "hsl(var(--brand-green-700))",
        },
        factory: {
          DEFAULT: "hsl(var(--brand-orange-500))",
          light: "hsl(var(--brand-orange-100))",
          dark: "hsl(var(--brand-orange-700))",
        },
        middleman: {
          DEFAULT: "hsl(var(--brand-purple-500))",
          light: "hsl(var(--brand-purple-100))",
          dark: "hsl(var(--brand-purple-700))",
        },
        delivery: {
          DEFAULT: "hsl(var(--brand-red-500))",
          light: "hsl(var(--brand-red-100))",
          dark: "hsl(var(--brand-red-700))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "Geist Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-in-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-in-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-in-down": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "fade-out": {
          from: { opacity: 1 },
          to: { opacity: 0 },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: 0 },
          to: { transform: "scale(1)", opacity: 1 },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "bounce-slow": {
          "0%, 100%": { transform: "translateY(-5%)" },
          "50%": { transform: "translateY(5%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "slide-in-up": "slide-in-up 0.3s ease-out",
        "slide-in-down": "slide-in-down 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "spin-slow": "spin-slow 3s linear infinite",
        "bounce-slow": "bounce-slow 2s ease-in-out infinite",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        DEFAULT:
          "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
        // Role-specific shadows
        customer: "0 4px 14px 0 hsl(var(--brand-blue-500) / 0.3)",
        seller: "0 4px 14px 0 hsl(var(--brand-green-500) / 0.3)",
        factory: "0 4px 14px 0 hsl(var(--brand-orange-500) / 0.3)",
        middleman: "0 4px 14px 0 hsl(var(--brand-purple-500) / 0.3)",
        delivery: "0 4px 14px 0 hsl(var(--brand-red-500) / 0.3)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-linear": "linear-gradient(var(--tw-gradient-stops))",
        // Role-specific gradients
        "customer-gradient":
          "linear-gradient(135deg, hsl(var(--brand-blue-500)), hsl(var(--brand-blue-700)))",
        "seller-gradient":
          "linear-gradient(135deg, hsl(var(--brand-green-500)), hsl(var(--brand-green-700)))",
        "factory-gradient":
          "linear-gradient(135deg, hsl(var(--brand-orange-500)), hsl(var(--brand-orange-700)))",
        "middleman-gradient":
          "linear-gradient(135deg, hsl(var(--brand-purple-500)), hsl(var(--brand-purple-700)))",
        "delivery-gradient":
          "linear-gradient(135deg, hsl(var(--brand-red-500)), hsl(var(--brand-red-700)))",
      },
      transitionTimingFunction: {
        bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
