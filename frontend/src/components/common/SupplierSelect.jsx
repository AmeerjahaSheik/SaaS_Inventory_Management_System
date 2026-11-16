import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, Plus, AlertCircle } from 'lucide-react';
import { supplierApi } from '../../api/supplierApi';

export default function SupplierSelect({
  value,
  onChange,
  onBlur,
  error,
  label = 'Select Supplier',
  required = false,
  onAddNew,
  className = '',
  disabled = false,
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['suppliers-list-all'],
    queryFn: async () => {
      const res = await supplierApi.getSuppliers({ limit: 100 });
      return res.data?.suppliers || [];
    },
  });

  const suppliers = data || [];

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {onAddNew && (
          <button
            type="button"
            onClick={onAddNew}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            New Supplier
          </button>
        )}
      </div>

      <div className="relative">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled || isLoading}
          className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm transition focus:outline-none focus:ring-2 appearance-none pr-10 ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900'
              : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20 text-slate-900'
          } ${disabled || isLoading ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''}`}
        >
          <option value="">
            {isLoading ? 'Loading suppliers...' : '-- Choose a supplier --'}
          </option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.supplier_name} {s.company_name ? `(${s.company_name})` : ''}
            </option>
          ))}
        </select>

        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
          <Truck className="w-4 h-4" />
        </div>
      </div>

      {isError && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Failed to load suppliers</span>
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>
      )}

      {suppliers.length === 0 && !isLoading && !isError && (
        <p className="text-xs text-slate-500 italic">
          No suppliers found. Click &quot;New Supplier&quot; to create one.
        </p>
      )}
    </div>
  );
}
