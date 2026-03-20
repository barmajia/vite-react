import { Link, useNavigate } from "react-router-dom";
import {
  X,
  User,
  ShoppingCart,
  Bell,
  MapPin,
  Star,
  Settings,
  LogOut,
  MessageSquare,
  Home,
  Search,
  ShoppingBag,
  Headset,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useSwipeToOpen } from "@/hooks/useSwipeToOpen";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { onTouchStart } = useSwipeToOpen({
    isOpen,
    onOpen: () => {},
    onClose,
    threshold: 100,
    direction: "left",
    edgeWidth: 20,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.HOME);
    onClose();
  };

  const menuItems = [
    { icon: Home, label: t("nav.home"), href: ROUTES.HOME },
    { icon: Search, label: t("nav.products"), href: ROUTES.PRODUCTS },
    { icon: Headset, label: t("nav.services"), href: ROUTES.SERVICES },
    { icon: ShoppingBag, label: t("nav.categories"), href: ROUTES.CATEGORIES },
    { icon: User, label: t("nav.about"), href: ROUTES.ABOUT },
    { icon: MessageSquare, label: t("nav.contact"), href: ROUTES.CONTACT },
    { icon: ShoppingCart, label: t("common.cart"), href: ROUTES.CART },
  ];

  const authMenuItems = [
    { icon: User, label: t("common.profile"), href: ROUTES.PROFILE },
    { icon: ShoppingCart, label: t("common.orders"), href: ROUTES.ORDERS },
    { icon: MapPin, label: t("common.addresses"), href: ROUTES.ADDRESSES },
    { icon: Star, label: t("common.reviews"), href: ROUTES.REVIEWS },
    { icon: MessageSquare, label: t("common.messages"), href: ROUTES.MESSAGES },
    {
      icon: Bell,
      label: t("common.notifications"),
      href: ROUTES.NOTIFICATIONS,
    },
    { icon: Settings, label: t("common.settings"), href: ROUTES.SETTINGS },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/80 transition-opacity md:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
        onTouchStart={onTouchStart}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[280px] bg-background shadow-lg transition-transform md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        onTouchStart={onTouchStart}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Link to={ROUTES.HOME} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-foreground text-background dark:bg-background dark:text-foreground flex items-center justify-center">
              <span className="font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold text-foreground dark:text-background">
              AURORA
            </span>
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
                {user.user_metadata.full_name || t("common.user")}
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
                {t("auth.signOut")}
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
              {t("auth.signUp")}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                onClose();
                navigate(ROUTES.LOGIN);
              }}
            >
              {t("auth.signIn")}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
