import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';

export function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-primary">404</h1>
          <h2 className="text-3xl font-bold">Page Not Found</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link to={ROUTES.HOME}>Go Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={ROUTES.PRODUCTS}>Browse Products</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
