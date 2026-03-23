import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { useLanguage } from "@/hooks/useLanguage";

export function About() {
  const { t, i18n } = useTranslation();
  const { currentLang } = useLanguage();

  const isRTL = currentLang.code === "ar";

  return (
    <div
      className={`max-w-4xl mx-auto space-y-8 py-12 pt-20 ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">{t("about.title")}</h1>
        <p className="text-xl text-muted-foreground">{t("about.subtitle")}</p>
      </div>

      <div
        className="prose dark:prose-invert max-w-none"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <p dir={isRTL ? "rtl" : "ltr"}>{t("about.intro")}</p>

        <h2 dir={isRTL ? "rtl" : "ltr"}>{t("about.ourValues")}</h2>
        <ul dir={isRTL ? "rtl" : "ltr"}>
          <li dir={isRTL ? "rtl" : "ltr"}>
            <strong>{t("about.qualityFirst")}</strong>{" "}
            {t("about.qualityFirstDesc")}
          </li>
          <li dir={isRTL ? "rtl" : "ltr"}>
            <strong>{t("about.customerFocus")}</strong>{" "}
            {t("about.customerFocusDesc")}
          </li>
          <li dir={isRTL ? "rtl" : "ltr"}>
            <strong>{t("about.trustSecurity")}</strong>{" "}
            {t("about.trustSecurityDesc")}
          </li>
          <li dir={isRTL ? "rtl" : "ltr"}>
            <strong>{t("about.sustainability")}</strong>{" "}
            {t("about.sustainabilityDesc")}
          </li>
        </ul>

        <h2 dir={isRTL ? "rtl" : "ltr"}>{t("about.whyChoose")}</h2>
        <ul dir={isRTL ? "rtl" : "ltr"}>
          <li dir={isRTL ? "rtl" : "ltr"}>{t("about.verifiedSellers")}</li>
          <li dir={isRTL ? "rtl" : "ltr"}>{t("about.securePayments")}</li>
          <li dir={isRTL ? "rtl" : "ltr"}>{t("about.fastReliable")}</li>
          <li dir={isRTL ? "rtl" : "ltr"}>{t("about.support247")}</li>
          <li dir={isRTL ? "rtl" : "ltr"}>{t("about.easyReturns")}</li>
        </ul>
      </div>

      <div className="flex justify-center gap-4" dir={isRTL ? "rtl" : "ltr"}>
        <Button asChild>
          <Link to={ROUTES.PRODUCTS}>
            {t("about.shopNow")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={ROUTES.CONTACT}>{t("about.contactUs")}</Link>
        </Button>
      </div>
    </div>
  );
}
