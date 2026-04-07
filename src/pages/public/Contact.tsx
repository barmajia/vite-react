import { useState } from "react";
import { Mail, Phone, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
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
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  sanitizeMessageContent,
  sanitizeDisplayName,
} from "@/lib/chat-security";
import { toast } from "sonner";

export function Contact() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  // Pre-fill name and email if user is logged in
  useState(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.user_metadata?.full_name || user.email || "",
        email: user.email || "",
      }));
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(false);
    setSubmitError(null);
    setSubmitSuccess(false);

    // Sanitize inputs
    const sanitizedName = sanitizeDisplayName(formData.name.trim());
    const sanitizedEmail = formData.email.trim().toLowerCase();
    const sanitizedSubject = sanitizeMessageContent(formData.subject.trim());
    const sanitizedMessage = sanitizeMessageContent(formData.message.trim());

    // Validate inputs
    if (!sanitizedName || sanitizedName.length < 2) {
      setSubmitError("Please enter a valid name (at least 2 characters)");
      return;
    }

    if (!sanitizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
      setSubmitError("Please enter a valid email address");
      return;
    }

    if (!sanitizedMessage || sanitizedMessage.length < 10) {
      setSubmitError("Message must be at least 10 characters long");
      return;
    }

    if (sanitizedMessage.length > 5000) {
      setSubmitError("Message must be less than 5000 characters");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc("submit_contact_message", {
        p_name: sanitizedName,
        p_email: sanitizedEmail,
        p_subject: sanitizedSubject,
        p_message: sanitizedMessage,
        p_user_id: user?.id || null,
      });

      if (error) throw error;

      if (data?.success) {
        setSubmitSuccess(true);
        toast.success("Message sent successfully!", {
          description: "We will respond within 24 hours.",
          duration: 5000,
        });
        // Reset form
        setFormData({ name: "", email: "", subject: "", message: "" });
        // Hide success message after 5 seconds
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        setSubmitError(data?.error || "Failed to submit message");
        toast.error("Submission failed", {
          description: data?.error || "Please try again later.",
        });
      }
    } catch (err) {
      console.error("Contact form error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit message";
      setSubmitError(errorMessage);
      toast.error("Submission failed", {
        description: "Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
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
            {/* Success Message */}
            {submitSuccess && (
              <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-emerald-900 dark:text-emerald-100">
                    Message sent successfully!
                  </p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    We will respond within 24 hours.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {submitError && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  {submitError}
                </p>
              </div>
            )}

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
