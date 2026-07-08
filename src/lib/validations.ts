import { z } from "zod";
import { VERTICAL_TYPES } from "@/types";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    role: z.enum(["buyer", "seller"]),
    business_name: z.string().min(2, "Business name is required"),
    vertical_type: z.enum(VERTICAL_TYPES),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const resetPasswordSchema = z
  .object({
    new_password: z.string().min(8, "At least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const productSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(2, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid price")
    .refine((v) => parseFloat(v) > 0, "Price must be greater than 0"),
  // Optional reference / list price. When set it must be a valid amount;
  // the cross-field check below enforces mrp >= price.
  mrp: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid MRP")
    .optional()
    .or(z.literal("")),
  inventory_count: z.coerce.number().int().min(0, "Cannot be negative"),
  min_order_qty: z.coerce.number().int().min(1, "Minimum is 1"),
  category: z.string().optional(),
  // Return / exchange policy (seller-set).
  is_returnable: z.boolean().default(true),
  return_window_days: z.coerce
    .number()
    .int()
    .min(0, "Cannot be negative")
    .max(365, "Too long")
    .default(7),
  is_exchangeable: z.boolean().default(true),
  return_policy_note: z.string().optional(),
}).refine(
  (v) => !v.mrp || parseFloat(v.mrp) >= parseFloat(v.price),
  { message: "MRP cannot be lower than price", path: ["mrp"] },
);
export type ProductInput = z.infer<typeof productSchema>;

export const addressSchema = z.object({
  label: z.string().min(1, "Label is required"),
  recipient_name: z.string().min(2, "Recipient name is required"),
  phone: z.string().min(5, "Phone is required"),
  line1: z.string().min(2, "Address is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip_code: z.string().min(1, "ZIP is required"),
  country: z.string().min(2, "Country is required"),
  is_default: z.boolean().optional(),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const commissionRateSchema = z.object({
  category: z.string().min(1, "Category is required"),
  percent: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid percent"),
  min_fee: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid fee")
    .optional(),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Review body is required"),
});

export const returnRequestSchema = z.object({
  type: z.enum(["return", "exchange"]),
  reason: z.enum([
    "defective",
    "wrong_item",
    "not_as_described",
    "size_fit",
    "no_longer_needed",
    "other",
  ]),
  reason_note: z.string().optional(),
  quantity: z.coerce.number().int().min(1, "Minimum is 1"),
});
export type ReturnRequestInput = z.infer<typeof returnRequestSchema>;
