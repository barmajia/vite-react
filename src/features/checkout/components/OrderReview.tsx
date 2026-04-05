import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Wallet } from "lucide-react";
import type { CartItem as CartItemType } from "@/hooks/useCart";

interface OrderReviewProps {
  items: CartItemType[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  isPlacing: boolean;
  error: Error | null;
  onPlaceOrder: (paymentMethod?: "fawry" | "card") => void;
}

export function OrderReview({
  items,
  subtotal,
  shipping,
  tax,
  total,
  isPlacing,
  error,
  onPlaceOrder,
}: OrderReviewProps) {
  return (
    <div className="glass-card p-8 border-slate-200/50 dark:border-slate-800/50 sticky top-24 rounded-3xl bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl shadow-xl shadow-slate-200/20 dark:shadow-none">
      <h2 className="text-xl font-bold mb-6 tracking-tight">Order Summary</h2>
      
      {/* Items List */}
      <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        {items.map((item) => (
          <div key={item.productId} className="flex gap-4 group">
            <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 dark:border-slate-800 shadow-sm transition-transform group-hover:scale-105">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                  No Pic
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Link
                to={`/product/${item.productId}`}
                className="text-sm font-semibold hover:text-primary line-clamp-1 transition-colors"
              >
                {item.name}
              </Link>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-medium">
                  Qty: {item.quantity}
                </span>
                <span className="text-sm font-bold">
                  ${((item.salePrice ?? item.price) * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 mb-8">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-bold text-foreground">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Shipping</span>
            <span className="font-bold">
              {shipping === 0 ? (
                <span className="text-green-500 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full text-xs">FREE</span>
              ) : (
                <span className="text-foreground">${shipping.toFixed(2)}</span>
              )}
            </span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Estimated Tax</span>
            <span className="font-bold text-foreground">${tax.toFixed(2)}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">Total</span>
            <div className="text-right">
              <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-400">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-50">Payment Method</h3>
          <RadioGroup defaultValue="card" className="space-y-3">
            <div className="relative group">
              <RadioGroupItem value="card" id="card" className="absolute left-4 top-1/2 -translate-y-1/2 z-10" />
              <Label
                htmlFor="card"
                className="flex items-center gap-4 p-4 pl-12 rounded-2xl border-2 border-slate-100 dark:border-slate-800 cursor-pointer transition-all hover:border-primary group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary/5"
              >
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-data-[state=checked]:bg-primary/10">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">Credit/Debit Card</div>
                  <div className="text-xs text-muted-foreground">Stripe Secure Payment</div>
                </div>
              </Label>
            </div>
            <div className="relative group">
              <RadioGroupItem value="fawry" id="fawry" className="absolute left-4 top-1/2 -translate-y-1/2 z-10" />
              <Label
                htmlFor="fawry"
                className="flex items-center gap-4 p-4 pl-12 rounded-2xl border-2 border-slate-100 dark:border-slate-800 cursor-pointer transition-all hover:border-[#29A19C] group-data-[state=checked]:border-[#29A19C] group-data-[state=checked]:bg-[#29A19C]/5"
              >
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-data-[state=checked]:bg-[#29A19C]/10">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">Fawry Pay</div>
                  <div className="text-xs text-muted-foreground">Kiosk & Online (EGP)</div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {error && (
          <div className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 p-4 rounded-2xl border border-red-100 dark:border-red-500/20 animate-in fade-in slide-in-from-top-1">
            {error.message}
          </div>
        )}

        <div className="space-y-3 pt-2">
          <Button
            className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => onPlaceOrder("card")}
            disabled={isPlacing}
          >
            {isPlacing ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </div>
            ) : `Confirm Order - $${total.toFixed(2)}`}
          </Button>

          <p className="text-[10px] text-muted-foreground text-center px-6 leading-relaxed">
            By clicking "Confirm Order", you agree to Aurora's{" "}
            <Link to="/help" className="underline font-bold hover:text-primary">Terms</Link> &{" "}
            <Link to="/help" className="underline font-bold hover:text-primary">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
