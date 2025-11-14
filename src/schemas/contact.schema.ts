import { z } from "zod";

export const createContactSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(255, "First name is too long"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(255, "Last name is too long"),
  username: z
    .string()
    .min(1, "Username is required")
    .max(255, "Username is too long"),
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email is too long"),
  phone: z.string().min(1, "Phone is required").max(50, "Phone is too long"),
  avatar: z.string().url("Invalid avatar URL").optional(),
});

export const updateContactSchema = z.object({
  firstName: z.string().min(1).max(255).optional(),
  lastName: z.string().min(1).max(255).optional(),
  username: z.string().min(1).max(255).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional(),
  favorite: z.boolean().optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a valid number"),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
