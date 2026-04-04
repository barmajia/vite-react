import { RouteObject } from 'react-router-dom';

// Auth pages
import { Login } from '@/pages/auth/Login';
import { SignupPage } from '@/pages/signup/SignupPage';
import { MiddlemanSignup } from '@/pages/middleman/MiddlemanSignup';
import { AuthCallback } from '@/pages/auth/AuthCallback';

export const authRoutes: RouteObject[] = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/signup/middleman',
    element: <MiddlemanSignup />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallback />,
  },
];
