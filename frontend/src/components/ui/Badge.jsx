import React from 'react';

export default function Badge({
  variant = 'default',
  children,
  dot = false,
  className = '',
}) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200/80',
    brand: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    info: 'bg-sky-50 text-sky-700 border-sky-200/60',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/60',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/60',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/60',
  };

  const dotColors = {
    default: 'bg-slate-400',
    brand: 'bg-indigo-500',
    info: 'bg-sky-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    purple: 'bg-purple-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        variants[variant] || variants.default
      } ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            dotColors[variant] || dotColors.default
          }`}
        />
      )}
      {children}
    </span>
  );
}
