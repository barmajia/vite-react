import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";

export function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Home
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Privacy Policy</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Aurora Privacy Policy
          </CardTitle>
          <CardDescription>Last updated: April 2026</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Information We Collect</h2>
            <p className="text-muted-foreground">
              We collect information you provide directly, such as your name, email, phone number,
              shipping address, and payment information when you create an account or make a purchase.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">2. How We Use Your Information</h2>
            <p className="text-muted-foreground">
              We use the information we collect to provide, maintain, and improve our services,
              process transactions, send notifications, and communicate with you.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">3. Information Sharing</h2>
            <p className="text-muted-foreground">
              We do not sell your personal information. We may share your information with service
              providers who assist us in operating our platform, with your consent, or as required by law.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">4. Data Security</h2>
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational measures to protect your personal
              information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">5. Your Rights</h2>
            <p className="text-muted-foreground">
              You have the right to access, correct, or delete your personal information. You may also
              object to or restrict certain processing of your data. Contact us to exercise these rights.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">6. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:privacy@aurora.com" className="text-accent hover:underline">
                privacy@aurora.com
              </a>
              .
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
