import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  label?: string;
  position?: "bottom-right" | "bottom-left" | "bottom-center";
}

export function FloatingActionButton({
  onClick,
  className,
  icon = <Plus className="h-6 w-6" />,
  label = "Add Product",
  position = "bottom-right",
}: FloatingActionButtonProps) {
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "bottom-center": "bottom-6 left-1/2 -translate-x-1/2",
  };

  return (
    <Button
      size="icon"
      className={cn(
        "fixed z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 bg-violet-600 hover:bg-violet-700 text-white",
        positionClasses[position],
        className,
      )}
      onClick={onClick}
      title={label}
    >
      {icon}
    </Button>
  );
}
