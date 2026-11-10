import { z } from 'zod';

export const productSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(150, 'Name cannot exceed 150 characters'),
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(50, 'SKU cannot exceed 50 characters')
    .toUpperCase(),
  description: z.string().optional().nullable(),
  category: z.string().max(50, 'Category cannot exceed 50 characters').optional().nullable(),
  price: z.coerce
    .number({ invalid_type_error: 'Price must be a number' })
    .min(0, 'Price cannot be negative'),
  cost_price: z.coerce
    .number({ invalid_type_error: 'Cost price must be a number' })
    .min(0, 'Cost price cannot be negative')
    .optional()
    .nullable(),
  quantity: z.coerce
    .number({ invalid_type_error: 'Quantity must be a whole number' })
    .int('Quantity must be an integer')
    .min(0, 'Quantity cannot be negative'),
  low_stock_threshold: z
    .union([
      z.literal(''),
      z.coerce
        .number({ invalid_type_error: 'Threshold must be a whole number' })
        .int('Threshold must be an integer')
        .min(0, 'Threshold cannot be negative'),
    ])
    .optional()
    .nullable(),
});

export const stockAdjustmentSchema = z.object({
  type: z.enum(['in', 'out', 'adjustment']),
  quantity: z.coerce
    .number({ invalid_type_error: 'Quantity must be a valid number' })
    .int('Quantity must be an integer')
    .min(0, 'Quantity cannot be negative'),
  reason: z.string().max(255, 'Reason cannot exceed 255 characters').optional().nullable(),
});

export const organizationSettingsSchema = z.object({
  name: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name cannot exceed 100 characters'),
  default_low_stock_threshold: z.coerce
    .number({ invalid_type_error: 'Threshold must be a whole number' })
    .int('Threshold must be an integer')
    .min(0, 'Threshold cannot be negative'),
});

