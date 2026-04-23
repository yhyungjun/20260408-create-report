import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  CircleDashed,
  type LucideIcon,
} from 'lucide-react';

export type StatusVariant = 'success' | 'pending' | 'warning' | 'danger' | 'neutral';

interface StatusBadgeProps {
  variant: StatusVariant;
  label: string;
  showIcon?: boolean;
}

const VARIANT_STYLES: Record<StatusVariant, { cls: string; icon: LucideIcon }> = {
  success: {
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  pending: {
    cls: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
  },
  warning: {
    cls: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: AlertCircle,
  },
  danger: {
    cls: 'bg-red-50 text-red-700 border-red-200',
    icon: XCircle,
  },
  neutral: {
    cls: 'bg-gray-50 text-gray-600 border-gray-200',
    icon: CircleDashed,
  },
};

export default function StatusBadge({ variant, label, showIcon = true }: StatusBadgeProps) {
  const { cls, icon: Icon } = VARIANT_STYLES[variant];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      {label}
    </span>
  );
}
