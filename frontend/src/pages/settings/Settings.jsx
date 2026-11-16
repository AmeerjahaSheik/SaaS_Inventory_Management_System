import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Sliders, ShieldCheck, User, Database, CheckCircle2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsApi } from '../../api/settingsApi';
import { useAuth } from '../../context/AuthContext';
import { organizationSettingsSchema } from '../../schemas/productSchemas';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

export default function Settings() {
  const queryClient = useQueryClient();
  const { user, organization, updateOrganizationState } = useAuth();

  const {
    data: settingsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['settings-organization'],
    queryFn: async () => {
      const res = await settingsApi.getSettings();
      return res.data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: {
      name: '',
      default_low_stock_threshold: 10,
    },
  });

  useEffect(() => {
    if (settingsData) {
      reset({
        name: settingsData.name,
        default_low_stock_threshold: settingsData.default_low_stock_threshold,
      });
    }
  }, [settingsData, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      return await settingsApi.updateSettings(data);
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Settings saved successfully!');
      updateOrganizationState(res.data);
      queryClient.invalidateQueries({ queryKey: ['settings-organization'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update settings.');
    },
  });

  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Sliders className="w-6 h-6 text-indigo-600" />
          Organization Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage workspace defaults, inventory low-stock thresholds, and security parameters.
        </p>
      </div>

      {/* Organization Defaults Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Workspace & Thresholds</h3>
            <p className="text-xs text-slate-500">Global parameters applied across your catalog inventory</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <Input
            label="Organization / Business Name"
            placeholder="Acme Supply Co."
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Default Low Stock Threshold (Units)"
            type="number"
            min="0"
            helperText="When an item has no custom threshold configured, this default will trigger low-stock alerts on the dashboard and product catalog."
            error={errors.default_low_stock_threshold?.message}
            {...register('default_low_stock_threshold')}
          />

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!isDirty}
              isLoading={updateMutation.isPending}
            >
              Save Organization Settings
            </Button>
          </div>
        </form>
      </div>

      {/* Account Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Your Account Profile</h3>
            <p className="text-xs text-slate-500">Signed in as organization administrator</p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Full Name</p>
            <p className="text-sm font-bold text-slate-900 mt-1">{user?.name || 'Administrator'}</p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Email Address</p>
            <p className="text-sm font-semibold text-slate-900 mt-1">{user?.email}</p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Role & Access</p>
            <div className="mt-1">
              <Badge variant="brand" dot>
                {user?.role?.toUpperCase() || 'ADMIN'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-tenant Partition & Security Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-2xs">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Multi-Tenancy & Data Privacy</h3>
            <p className="text-xs text-slate-500">Cryptographically scoped workspace partitioning</p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <span>Workspace Identifier</span>
            </div>
            <div className="font-mono text-xs font-bold text-slate-800 break-all bg-white p-2 rounded-lg border border-slate-200/60">
              {organization?.id || 'Active Workspace'}
            </div>
            <p className="text-[11px] text-slate-500">
              All inventory transactions, products, stock movements, and suppliers are bound strictly to this tenant scope.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Isolation Status</span>
            </div>
            <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 p-2 rounded-lg border border-emerald-200/80">
              <ShieldCheck className="w-4 h-4" />
              Strict Row-Level Partition Active
            </div>
            <p className="text-[11px] text-slate-500">
              Zero cross-tenant visibility. All queries enforce foreign-key tenant verification at the database and API layer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

