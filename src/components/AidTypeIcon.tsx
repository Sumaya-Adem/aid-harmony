import { AidType, AID_TYPE_LABELS } from '@/types/aid';
import { Droplets, Utensils, HeartPulse, Banknote } from 'lucide-react';

interface AidTypeIconProps {
  type: AidType;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const iconMap: Record<AidType, typeof Droplets> = {
  water: Droplets,
  food: Utensils,
  health: HeartPulse,
  cash: Banknote,
};

const colorMap: Record<AidType, string> = {
  water: 'text-blue-500',
  food: 'text-amber-500',
  health: 'text-rose-500',
  cash: 'text-emerald-500',
};

export function AidTypeIcon({ type, showLabel = false, size = 'md' }: AidTypeIconProps) {
  const Icon = iconMap[type];
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <Icon className={`${sizeClasses[size]} ${colorMap[type]}`} />
      {showLabel && (
        <span className="text-sm font-medium">{AID_TYPE_LABELS[type]}</span>
      )}
    </div>
  );
}
