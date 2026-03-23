import { Link } from "react-router-dom";
import { HelpCircle, Package, CreditCard, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";

export function Help() {
  const { t } = useTranslation();

  const faqs = [
    {
      icon: <Package className="h-6 w-6" />,
      title: t("help.ordersShipping"),
      questions: [
        { q: t("help.trackOrder"), a: t("help.trackOrderA") },
        { q: t("help.shippingTime"), a: t("help.shippingTimeA") },
        { q: t("help.internationalShip"), a: t("help.internationalShipA") },
      ],
    },
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: t("help.payment"),
      questions: [
        { q: t("help.paymentMethods"), a: t("help.paymentMethodsA") },
        { q: t("help.paymentSecure"), a: t("help.paymentSecureA") },
        { q: t("help.installments"), a: t("help.installmentsA") },
      ],
    },
    {
      icon: <RotateCcw className="h-6 w-6" />,
      title: t("help.returnsRefunds"),
      questions: [
        { q: t("help.returnPolicy"), a: t("help.returnPolicyA") },
        { q: t("help.howReturn"), a: t("help.howReturnA") },
        { q: t("help.refundTime"), a: t("help.refundTimeA") },
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-12 pt-20">
      <div className="text-center space-y-4 mb-12">
        <HelpCircle className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-4xl font-bold">{t("help.title")}</h1>
        <p className="text-xl text-muted-foreground">{t("help.subtitle")}</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <Link
          to={`${ROUTES.HELP}?topic=orders`}
          className="p-4 border rounded-lg hover:bg-accent transition-colors"
        >
          <Package className="h-6 w-6 text-primary mb-2" />
          <h3 className="font-semibold">{t("help.orders")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("help.trackManage")}
          </p>
        </Link>
        <Link
          to={`${ROUTES.HELP}?topic=payment`}
          className="p-4 border rounded-lg hover:bg-accent transition-colors"
        >
          <CreditCard className="h-6 w-6 text-primary mb-2" />
          <h3 className="font-semibold">{t("help.payment")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("help.billingPayments")}
          </p>
        </Link>
        <Link
          to={`${ROUTES.HELP}?topic=returns`}
          className="p-4 border rounded-lg hover:bg-accent transition-colors"
        >
          <RotateCcw className="h-6 w-6 text-primary mb-2" />
          <h3 className="font-semibold">{t("help.returns")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("help.returnsRefundsShort")}
          </p>
        </Link>
        <Link
          to={`${ROUTES.CONTACT}`}
          className="p-4 border rounded-lg hover:bg-accent transition-colors"
        >
          <h3 className="font-semibold">{t("nav.contact")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("help.getInTouch")}
          </p>
        </Link>
      </div>

      <div className="space-y-8">
        {faqs.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                {section.icon}
                <CardTitle>{section.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.questions.map((faq, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="font-medium">{faq.q}</h4>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-4">{t("help.stillNeedHelp")}</h2>
        <p className="text-muted-foreground mb-6">{t("help.ourTeamHelp")}</p>
        <div className="flex justify-center gap-4">
          <Link to={ROUTES.CONTACT}>{t("help.contactSupportBtn")}</Link>
        </div>
      </div>
    </div>
  );
}
