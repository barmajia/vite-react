import { UserRole } from "@/types/signup";

import { Button } from "@/components/ui/button";

interface RoleSelectionProps {
  onSelect: (role: UserRole) => void;
}

const roles: {
  id: UserRole;
  title: string;
  description: string;
  icon: string;
  color: string;
}[] = [
  {
    id: "customer",
    title: "Customer",
    description: "Browse and buy products from sellers",
    icon: "🛒",
    color: "hover:border-blue-500",
  },
  {
    id: "seller",
    title: "Seller",
    description: "Sell products to customers and factories",
    icon: "📦",
    color: "hover:border-green-500",
  },
  {
    id: "factory",
    title: "Factory",
    description: "Manufacture products for wholesale",
    icon: "🏭",
    color: "hover:border-orange-500",
  },
  {
    id: "middleman",
    title: "Middleman",
    description: "Connect buyers and sellers, earn commissions",
    icon: "🤝",
    color: "hover:border-purple-500",
  },
  {
    id: "delivery",
    title: "Delivery",
    description: "Deliver orders and earn per delivery",
    icon: "🚚",
    color: "hover:border-red-500",
  },
];

export function RoleSelection({ onSelect }: RoleSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <Button
            key={role.id}
            onClick={() => onSelect(role.id)}
            variant="outline"
            className={`h-auto p-6 rounded-lg border-2 transition-all ${role.color} hover:shadow-lg text-left bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700`}
          >
            <div className="space-y-3">
              <div className="text-4xl">{role.icon}</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {role.title}
                </h3>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
