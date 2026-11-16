import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Package, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginSchema } from '../../schemas/authSchemas';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to sign in. Please check your credentials.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoCredentials = () => {
    setValue('email', 'admin@stockflow.io', { shouldValidate: true });
    setValue('password', 'password123', { shouldValidate: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-indigo-500 selection:text-white">
      {/* Soft ambient background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/40 via-slate-50 to-slate-50 pointer-events-none -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-card shadow-indigo-600/20 mb-3 transition-transform hover:scale-105">
          <Package className="w-6 h-6" />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">StockFlow</h2>
        <p className="mt-1 text-sm text-slate-500">
          Sign in to your organization inventory workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-card rounded-2xl sm:px-10 border border-slate-200/80">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Input
              label="Work Email"
              type="email"
              placeholder="you@company.com"
              icon={Mail}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full py-2.5 text-base font-semibold shadow-xs"
                isLoading={isSubmitting}
                icon={ArrowRight}
              >
                Sign In to Workspace
              </Button>
            </div>
          </form>

          {/* Quick Demo Helper */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="w-full py-2 px-3 text-xs font-semibold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200/60 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Fill Demo Credentials
            </button>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-600">
              Don't have an organization yet?{' '}
              <Link
                to="/signup"
                className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Create your workspace
              </Link>
            </p>
          </div>
        </div>

        {/* Footer reassurance */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Multi-tenant isolation &bull; Real-time ledger &bull; 99.9% uptime SLA
        </p>
      </div>
    </div>
  );
}

