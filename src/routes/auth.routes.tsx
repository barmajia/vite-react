import { RouteObject } from "react-router-dom";

// Auth pages
import { Login } from "@/pages/auth/Login";
import { SignupPage } from "@/pages/signup/SignupPage";
import { MiddlemanSignup } from "@/pages/middleman/MiddlemanSignup";
import { SellerLogin } from "@/pages/auth/SellerLogin";
import { SellerSignup } from "@/pages/auth/SellerSignup";
import { SellerWelcome } from "@/features/seller/pages/SellerWelcome";
import { FactoryLogin } from "@/pages/auth/FactoryLogin";
import { FactorySignup } from "@/pages/auth/FactorySignup";
import { FactoryWelcome } from "@/features/factory/pages/FactoryWelcome";
import { MiddlemanLogin } from "@/pages/auth/MiddlemanLogin";
import { MiddlemanWelcome } from "@/features/middleman/pages/MiddlemanWelcome";
import { AuthCallback } from "@/pages/auth/AuthCallback";
import { ForgotPassword } from "@/pages/auth/ForgotPassword";
import { UpdatePassword } from "@/pages/auth/UpdatePassword";
import { CompleteProfile } from "@/pages/auth/CompleteProfile";

export const authRoutes: RouteObject[] = [
  // SELLER ROUTES
  {
    path: "/seller/login",
    element: <SellerLogin />,
  },
  {
    path: "/seller/signup",
    element: <SellerSignup />,
  },

  // FACTORY ROUTES
  {
    path: "/factory/login",
    element: <FactoryLogin />,
  },
  {
    path: "/factory/signup",
    element: <FactorySignup />,
  },

  // MIDDLEMAN ROUTES
  {
    path: "/middleman/login",
    element: <MiddlemanLogin />,
  },
  {
    path: "/middleman/signup",
    element: <MiddlemanSignup />,
  },

  // GENERAL AUTH ROUTES
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
  },
  {
    path: "/auth/callback",
    element: <AuthCallback />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/update-password",
    element: <UpdatePassword />,
  },
  {
    path: "/complete-profile",
    element: <CompleteProfile />,
  },
];
