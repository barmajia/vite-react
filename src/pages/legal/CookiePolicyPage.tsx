import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cookie, ArrowLeft } from "lucide-react";

export function CookiePolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Home
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Cookie Policy</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cookie className="h-5 w-5" />
            Aurora Cookie Policy
          </CardTitle>
          <CardDescription>Last updated: April 2026</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. What Are Cookies</h2>
            <p className="text-muted-foreground">
              Cookies are small text files stored on your device when you visit our website. They help
              us provide you with a better experience by remembering your preferences and understanding
              how you use our platform.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">2. How We Use Cookies</h2>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Essential cookies:</strong> Required for the platform to function (authentication, security)</li>
              <li><strong>Analytics cookies:</strong> Help us understand how visitors interact with our platform</li>
              <li><strong>Preference cookies:</strong> Remember your settings (language, currency, theme)</li>
              <li><strong>Marketing cookies:</strong> Used to deliver relevant advertisements</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">3. Managing Cookies</h2>
            <p className="text-muted-foreground">
              You can control and delete cookies through your browser settings. Note that disabling
              cookies may affect the functionality of our platform.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">4. Third-Party Cookies</h2>
            <p className="text-muted-foreground">
              Some cookies are placed by third-party services that appear on our pages, such as
              analytics providers and advertising partners. We do not control these cookies.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">5. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about our use of cookies, contact us at{" "}
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
