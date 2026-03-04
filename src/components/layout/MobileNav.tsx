import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, User, ShoppingCart, Bell, MapPin, Star, Settings, LogOut, MessageSquare, Home, Search, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.HOME);
    onClose();
  };

  const menuItems = [
    { icon: Home, label: 'Home', href: ROUTES.HOME },
    { icon: Search, label: 'Products', href: ROUTES.PRODUCTS },
    { icon: ShoppingCart, label: 'Cart', href: ROUTES.CART },
  ];

  const authMenuItems = [
    { icon: User, label: 'Profile', href: ROUTES.PROFILE },
    { icon: ShoppingCart, label: 'Orders', href: ROUTES.ORDERS },
    { icon: MapPin, label: 'Addresses', href: ROUTES.ADDRESSES },
    { icon: Star, label: 'Reviews', href: ROUTES.REVIEWS },
    { icon: MessageSquare, label: 'Messages', href: ROUTES.MESSAGES },
    { icon: Bell, label: 'Notifications', href: ROUTES.NOTIFICATIONS },
    { icon: Settings, label: 'Settings', href: ROUTES.SETTINGS },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/80 transition-opacity md:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-[280px] bg-background shadow-lg transition-transform md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Link to={ROUTES.HOME} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold">AURORA</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Menu Items */}
        <div className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Auth Section */}
        {user ? (
          <>
            <div className="px-4 py-2 border-t">
              <p className="text-sm font-medium mb-1">
                {user.user_metadata.full_name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>

            <div className="p-4 space-y-2">
              {authMenuItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="p-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </>
        ) : (
          <div className="p-4 space-y-2 border-t">
            <Button
              className="w-full"
              onClick={() => {
                onClose();
                navigate(ROUTES.SIGNUP);
              }}
            >
              Sign Up
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                onClose();
                navigate(ROUTES.LOGIN);
              }}
            >
              Sign In
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
