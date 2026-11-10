import { z } from 'zod';

export const stockMovementFormSchema = z.object({
  productId: z
    .string()
    .min(1, 'Please select a product'),
  movementType: z
    .enum(['IN', 'OUT', 'ADJUSTMENT'], {
      errorMap: () => ({ message: "Please select 'IN', 'OUT', or 'ADJUSTMENT'" }),
    }),
  quantity: z.coerce
    .number({ invalid_type_error: 'Quantity must be a number' })
    .int('Quantity must be a whole number')
    .min(0, 'Quantity cannot be negative'),
  reason: z
    .string()
    .max(255, 'Reason cannot exceed 255 characters')
    .optional()
    .nullable(),
  referenceNumber: z
    .string()
    .max(100, 'Reference number cannot exceed 100 characters')
    .optional()
    .nullable(),
});

