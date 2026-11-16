import React from 'react';
import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div
      className={`text-center py-12 px-6 rounded-2xl bg-white border border-dashed border-slate-200/90 ${className}`}
    >
      {Icon && (
        <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50/80 flex items-center justify-center text-indigo-600 mb-3.5 border border-indigo-100/60 shadow-xs">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
