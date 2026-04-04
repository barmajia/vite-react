import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft } from "lucide-react";

export function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Home
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Terms of Service</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Aurora Terms of Service
          </CardTitle>
          <CardDescription>Last updated: April 2026</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using the Aurora platform, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, do not use our services.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">2. Use of Services</h2>
            <p className="text-muted-foreground">
              You may use our services only for lawful purposes and in accordance with these terms.
              You agree not to use the services to engage in fraudulent, harmful, or illegal activities.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">3. User Accounts</h2>
            <p className="text-muted-foreground">
              You are responsible for maintaining the confidentiality of your account credentials and
              for all activities that occur under your account. You must notify us immediately of any
              unauthorized use of your account.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">4. Products and Transactions</h2>
            <p className="text-muted-foreground">
              Aurora facilitates transactions between buyers and sellers. We do not guarantee the
              quality, safety, or legality of products listed by third-party sellers. All transactions
              are subject to our payment and refund policies.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">5. Intellectual Property</h2>
            <p className="text-muted-foreground">
              The Aurora platform, including its content, features, and functionality, is owned by
              Aurora and is protected by intellectual property laws. You may not reproduce, distribute,
              or create derivative works without our express written consent.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">6. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              Aurora shall not be liable for any indirect, incidental, special, consequential, or
              punitive damages arising from your use of or inability to use the services.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">7. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these Terms, contact us at{" "}
              <a href="mailto:legal@aurora.com" className="text-accent hover:underline">
                legal@aurora.com
              </a>
              .
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
