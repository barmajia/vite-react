import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/lib/constants";

type ComingSoonProps = {
  title?: string;
  description?: string;
};

export function ComingSoon({ title, description }: ComingSoonProps) {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold">Coming Soon</h1>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {title ?? t("general.comingSoon")}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {description ?? t("general.comingSoonDesc")}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-4 items-center">
          <Button asChild>
            <Link to={ROUTES.HOME}>{t("general.goHome")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
