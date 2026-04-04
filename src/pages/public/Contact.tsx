import { useState } from "react";
import { Mail, Phone, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { CONTACT } from "@/lib/constants";
import { toast } from "sonner";

export function Contact() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      toast.success(t("contact.messageSent"));
      setFormData({ name: "", email: "", subject: "", message: "" });
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-6xl mx-auto py-12 pt-20">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold">{t("contact.title")}</h1>
        <p className="text-xl text-muted-foreground">{t("contact.subtitle")}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("contact.sendMessage")}</CardTitle>
            <CardDescription>{t("contact.formNote")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("contact.name")}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder={t("contact.namePlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("contact.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder={t("contact.emailPlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">{t("contact.subject")}</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  placeholder={t("contact.subjectPlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">{t("contact.message")}</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder={t("contact.messagePlaceholder")}
                  rows={5}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("contact.sendBtn")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("contact.getInTouch")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <Mail className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="font-medium">{t("contact.email")}</p>
                  <a
                    href={`mailto:${CONTACT.EMAIL}`}
                    className="text-muted-foreground hover:text-primary"
                  >
                    {CONTACT.EMAIL}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="font-medium">{t("contact.phone")}</p>
                  <a
                    href={`tel:${CONTACT.PHONE}`}
                    className="text-muted-foreground hover:text-primary"
                  >
                    {CONTACT.PHONE}
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* <Card> */}
          {/* <CardHeader>
              <CardTitle>{t("contact.businessHours")}</CardTitle>
            </CardHeader> */}
          {/* <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("contact.monFri")}
                </span>
                <span className="font-medium">all time</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("contact.saturday")}
                </span>
                <span className="font-medium">all days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("contact.sunday")}
                </span>
                <span className="font-medium">{t("contact.closed")}</span>
              </div>
            </CardContent> */}
          {/* </Card> */}
        </div>
      </div>
    </div>
  );
}
