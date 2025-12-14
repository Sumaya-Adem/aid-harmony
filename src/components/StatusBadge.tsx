import { AidStatus } from '@/types/aid';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: AidStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<AidStatus, { label: string; icon: typeof CheckCircle }> = {
  'not-aided': { label: 'Not Aided', icon: XCircle },
  'partial': { label: 'Partially Aided', icon: AlertCircle },
  'full': { label: 'Fully Aided', icon: CheckCircle },
  'duplicate': { label: 'Duplicate Warning', icon: AlertTriangle },
};

export function StatusBadge({ status, showIcon = true, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <Badge variant={status} className={`gap-1.5 ${sizeClasses[size]}`}>
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      {config.label}
    </Badge>
  );
}
