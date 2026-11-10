import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
}) {
  const iconVariants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </p>
        {Icon && (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              iconVariants[variant] || iconVariants.default
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </h3>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

