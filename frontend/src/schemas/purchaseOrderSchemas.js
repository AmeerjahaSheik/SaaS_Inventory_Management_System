import { z } from 'zod';

export const purchaseOrderItemSchema = z.object({
  product_id: z.string().min(1, 'Product selection is required'),
  quantity: z.coerce
    .number({ invalid_type_error: 'Quantity must be a number' })
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1'),
  unit_cost: z.coerce
    .number({ invalid_type_error: 'Unit cost must be a number' })
    .min(0, 'Unit cost cannot be negative'),
});

export const purchaseOrderSchema = z.object({
  supplier_id: z.string().min(1, 'Please select a supplier'),
  po_number: z.string().optional().nullable().or(z.literal('')),
  expected_delivery_date: z.string().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable().or(z.literal('')),
  items: z.array(purchaseOrderItemSchema).min(1, 'At least one line item is required'),
});
