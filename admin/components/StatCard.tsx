import {
  TrendingUp,
  TrendingDown,
  Minus,
  type LucideIcon,
} from 'lucide-react';

type Accent = 'default' | 'violet' | 'emerald' | 'amber' | 'red';
type Direction = 'up' | 'down' | 'flat';

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: { value: string; direction: Direction };
  icon?: LucideIcon;
  accent?: Accent;
}

const ACCENT_BG: Record<Accent, string> = {
  default: 'bg-gray-50 text-gray-600',
  violet: 'bg-violet-50 text-violet-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
};

const TREND_ICONS: Record<Direction, LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

const TREND_COLOR: Record<Direction, string> = {
  up: 'text-emerald-600',
  down: 'text-red-600',
  flat: 'text-gray-500',
};

export default function StatCard({
  label,
  value,
  sublabel,
  trend,
  icon: Icon,
  accent = 'default',
}: StatCardProps) {
  const TrendIcon = trend ? TREND_ICONS[trend.direction] : null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${ACCENT_BG[accent]}`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
      {(sublabel || trend) && (
        <div className="flex items-center gap-2 mt-2 text-xs">
          {trend && TrendIcon && (
            <span
              className={`flex items-center gap-0.5 font-semibold ${TREND_COLOR[trend.direction]}`}
            >
              <TrendIcon className="w-3 h-3" />
              {trend.value}
            </span>
          )}
          {sublabel && <span className="text-gray-500">{sublabel}</span>}
        </div>
      )}
    </div>
  );
}
