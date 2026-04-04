import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  hover = false,
  shadow = "md",
  onClick,
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  const shadowStyles = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };

  const hoverStyle = hover ? 'hover:shadow-xl transition-shadow duration-300 cursor-pointer' : '';

  return (
    <div
      className={`bg-white rounded-xl ${paddingStyles[padding]} ${shadowStyles[shadow]} ${hoverStyle} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '', action }) => (
  <div className={`flex items-center justify-between mb-4 ${className}`}>
    <h3 className="text-lg font-semibold text-gray-900">{children}</h3>
    {action && <div>{action}</div>}
  </div>
);

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  bordered?: boolean;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '', bordered = true }) => (
  <div className={`pt-4 ${bordered ? 'border-t border-gray-100' : ''} ${className}`}>
    {children}
  </div>
);

export default Card;
