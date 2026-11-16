import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
  className = '',
}) {
  const iconVariants = {
    default: 'bg-slate-100 text-slate-600 border-slate-200/80',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <div
      className={`bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-card-hover hover:border-slate-300/80 transition-all duration-200 group ${className}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </p>
        {Icon && (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-transform duration-200 group-hover:scale-105 ${
              iconVariants[variant] || iconVariants.default
            }`}
          >
            <Icon className="w-4.5 h-4.5" />
          </div>
        )}
      </div>

      <div className="mt-3.5 flex items-baseline justify-between">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
          {value}
        </h3>
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.isPositive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                : 'bg-rose-50 text-rose-700 border border-rose-200/60'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 font-medium">{subtitle}</p>
      )}
    </div>
  );
}
