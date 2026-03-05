import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';

export function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">About Aurora</h1>
        <p className="text-xl text-muted-foreground">
          Your trusted marketplace for premium products
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <p>
          Founded in 2026, Aurora has grown to become one of the most trusted online marketplaces,
          connecting customers with verified sellers from around the world. Our mission is to make
          quality products accessible to everyone while ensuring a secure and seamless shopping experience.
        </p>

        <h2>Our Values</h2>
        <ul>
          <li><strong>Quality First:</strong> Every product is verified for authenticity and quality</li>
          <li><strong>Customer Focus:</strong> Your satisfaction is our top priority</li>
          <li><strong>Trust & Security:</strong> Safe transactions and data protection</li>
          <li><strong>Sustainability:</strong> Committed to eco-friendly practices</li>
        </ul>

        <h2>Why Choose Aurora?</h2>
        <ul>
          <li>Thousands of verified sellers</li>
          <li>Secure payment processing</li>
          <li>Fast and reliable shipping</li>
          <li>24/7 customer support</li>
          <li>Easy returns and refunds</li>
        </ul>
      </div>

      <div className="flex justify-center gap-4">
        <Button asChild>
          <Link to={ROUTES.PRODUCTS}>
            Shop Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={ROUTES.CONTACT}>Contact Us</Link>
        </Button>
      </div>
    </div>
  );
}
