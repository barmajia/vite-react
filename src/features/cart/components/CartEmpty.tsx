import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

export function CartEmpty() {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted mb-6">
        <ShoppingCart className="w-12 h-12 text-muted-foreground" />
      </div>
      
      <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Looks like you haven't added anything to your cart yet. 
        Start shopping to build your cart!
      </p>
      
      <Button asChild size="lg">
        <Link to="/products">Start Shopping</Link>
      </Button>
    </div>
  );
}
