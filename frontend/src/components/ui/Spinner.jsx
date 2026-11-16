import React from 'react';

export default function Spinner({ size = 'md', className = '', color = 'indigo' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  };

  const colors = {
    indigo: 'border-slate-200 border-t-indigo-600',
    white: 'border-white/30 border-t-white',
    emerald: 'border-emerald-100 border-t-emerald-600',
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`${sizes[size] || sizes.md} animate-spin rounded-full ${colors[color] || colors.indigo}`}
      />
    </div>
  );
}

