import { CreditCard, Building, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaymentMethod } from '../hooks/useCheckout';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
}

const paymentMethods = [
  {
    id: 'card' as PaymentMethod,
    name: 'Credit/Debit Card',
    description: 'Pay securely with Stripe',
    icon: CreditCard,
    color: 'text-blue-500',
  },
  {
    id: 'fawry' as PaymentMethod,
    name: 'Fawry',
    description: 'Pay at any Fawry kiosk',
    icon: Building,
    color: 'text-amber-500',
  },
  {
    id: 'cod' as PaymentMethod,
    name: 'Cash on Delivery',
    description: 'Pay when you receive your order',
    icon: Wallet,
    color: 'text-emerald-500',
  },
];

export function PaymentMethodSelector({
  selectedMethod,
  onSelectMethod,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Payment Method</h2>
        <p className="text-muted-foreground">
          Choose how you'd like to pay for your order.
        </p>
      </div>

      <div className="grid gap-4">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;

          return (
            <button
              key={method.id}
              onClick={() => onSelectMethod(method.id)}
              className={cn(
                "flex items-start gap-4 p-6 rounded-xl border-2 transition-all text-left",
                isSelected
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <Icon className={cn("w-8 h-8 flex-shrink-0 mt-1", method.color)} />
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">{method.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {method.description}
                </p>
              </div>
              <div
                className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-border"
                )}
              >
                {isSelected && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>🔒 Secure Payment:</strong> All payment information is encrypted and securely processed.
        </p>
      </div>
    </div>
  );
}
