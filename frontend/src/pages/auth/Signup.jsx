import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, User, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { signupSchema } from '../../schemas/authSchemas';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      organizationName: '',
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await signup(data);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create organization. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-indigo-500 selection:text-white">
      {/* Soft ambient background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/40 via-slate-50 to-slate-50 pointer-events-none -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-card shadow-indigo-600/20 mb-3 transition-transform hover:scale-105">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Create Workspace</h2>
        <p className="mt-1 text-sm text-slate-500">
          Set up StockFlow for your business in 30 seconds
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-card rounded-2xl sm:px-10 border border-slate-200/80">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Input
              label="Business / Organization Name"
              type="text"
              placeholder="Acme Supply Co."
              icon={Building2}
              error={errors.organizationName?.message}
              {...register('organizationName')}
            />

            <Input
              label="Your Full Name"
              type="text"
              placeholder="Jane Doe"
              icon={User}
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Work Email"
              type="email"
              placeholder="jane@acmesupply.com"
              icon={Mail}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Minimum 6 characters"
              icon={Lock}
              error={errors.password?.message}
              helperText="Must be at least 6 characters"
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
                Create Workspace & Account
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Reassurance pills */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Row-Level Partitioned
          </span>
          <span>&bull;</span>
          <span>Zero Card Required</span>
          <span>&bull;</span>
          <span>Instant Setup</span>
        </div>
      </div>
    </div>
  );
}

