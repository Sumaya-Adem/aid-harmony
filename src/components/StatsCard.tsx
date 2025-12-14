import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const variantStyles = {
  default: 'bg-card border-border',
  success: 'bg-success/5 border-success/20',
  warning: 'bg-warning/5 border-warning/20',
  danger: 'bg-destructive/5 border-destructive/20',
  info: 'bg-primary/5 border-primary/20',
};

const iconVariantStyles = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
  info: 'bg-primary/10 text-primary',
};

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  variant = 'default',
  className 
}: StatsCardProps) {
  return (
    <div className={cn(
      'rounded-xl border p-4 transition-all hover:shadow-sm',
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={cn(
            'rounded-lg p-2',
            iconVariantStyles[variant]
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
