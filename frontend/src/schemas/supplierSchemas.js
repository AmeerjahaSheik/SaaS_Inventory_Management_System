import { z } from 'zod';

export const supplierSchema = z.object({
  supplier_name: z
    .string()
    .min(2, 'Supplier name must be at least 2 characters')
    .max(150, 'Supplier name cannot exceed 150 characters'),
  company_name: z
    .string()
    .max(150, 'Company name cannot exceed 150 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  email: z
    .string()
    .email('Please enter a valid email address')
    .optional()
    .nullable()
    .or(z.literal('')),
  phone: z
    .string()
    .max(50, 'Phone number cannot exceed 50 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  address: z
    .string()
    .optional()
    .nullable()
    .or(z.literal('')),
  notes: z
    .string()
    .optional()
    .nullable()
    .or(z.literal('')),
});
