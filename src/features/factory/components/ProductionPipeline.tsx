import { CheckCircle2, Clock, Package, Truck, AlertCircle, Settings } from 'lucide-react';
import type { ProductionStatus } from '../types/factory';

const statusConfig: Record<ProductionStatus, { label: string; icon: any; color: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-500' },
  in_production: { label: 'In Production', icon: Settings, color: 'text-blue-500' },
  quality_check: { label: 'Quality Check', icon: AlertCircle, color: 'text-orange-500' },
  ready_to_ship: { label: 'Ready to Ship', icon: Package, color: 'text-green-500' },
  shipped: { label: 'Shipped', icon: Truck, color: 'text-purple-500' },
  delivered: { label: 'Delivered', icon: CheckCircle2, color: 'text-emerald-500' },
  cancelled: { label: 'Cancelled', icon: AlertCircle, color: 'text-red-500' },
};

const statusOrder: ProductionStatus[] = [
  'pending',
  'in_production',
  'quality_check',
  'ready_to_ship',
  'shipped',
  'delivered',
];

interface ProductionPipelineProps {
  status: ProductionStatus;
  onChangeStatus?: (status: ProductionStatus) => void;
  readOnly?: boolean;
}

export const ProductionPipeline = ({ status, onChangeStatus, readOnly = false }: ProductionPipelineProps) => {
  const currentIndex = statusOrder.indexOf(status);

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted -translate-y-1/2" />
        <div
          className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 transition-all duration-500"
          style={{ width: `${((currentIndex + 1) / (statusOrder.length - 1)) * 100}%` }}
        />
        
        {/* Status Nodes */}
        <div className="relative flex justify-between">
          {statusOrder.map((s, index) => {
            const config = statusConfig[s];
            const Icon = config.icon;
            const isActive = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={s} className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => !readOnly && onChangeStatus?.(s)}
                  disabled={readOnly || index > currentIndex}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    border-2 transition-all duration-300
                    ${isActive
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-background border-muted text-muted-foreground'
                    }
                    ${isCurrent && !readOnly ? 'ring-2 ring-primary ring-offset-2' : ''}
                    ${!readOnly && index <= currentIndex ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                    ${readOnly ? 'cursor-default' : ''}
                  `}
                >
                  <Icon className="h-5 w-5" />
                </button>
                <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
