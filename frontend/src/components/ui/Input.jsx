import React, { forwardRef } from 'react';

const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      type = 'text',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative rounded-xl">
          {Icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Icon className="h-4 w-4 text-slate-400" />
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={`block w-full rounded-xl border text-sm transition-all duration-150 focus:outline-none focus:ring-4 ${
              Icon ? 'pl-10' : 'pl-3.5'
            } pr-3.5 py-2.5 ${
              error
                ? 'border-rose-300 text-rose-900 placeholder-rose-300 focus:border-rose-500 focus:ring-rose-500/10 bg-rose-50/20'
                : 'border-slate-200 text-slate-900 placeholder-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/10 bg-white shadow-xs'
            } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
            <span>•</span>
            <span>{error}</span>
          </p>
        )}
        {!error && helperText && (
          <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
