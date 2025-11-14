"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idParamSchema = exports.updateContactSchema = exports.createContactSchema = void 0;
const zod_1 = require("zod");
exports.createContactSchema = zod_1.z.object({
    firstName: zod_1.z
        .string()
        .min(1, "First name is required")
        .max(255, "First name is too long"),
    lastName: zod_1.z
        .string()
        .min(1, "Last name is required")
        .max(255, "Last name is too long"),
    username: zod_1.z
        .string()
        .min(1, "Username is required")
        .max(255, "Username is too long"),
    email: zod_1.z
        .string()
        .email("Invalid email address")
        .max(255, "Email is too long"),
    phone: zod_1.z.string().min(1, "Phone is required").max(50, "Phone is too long"),
    avatar: zod_1.z.string().url("Invalid avatar URL").optional(),
});
exports.updateContactSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(255).optional(),
    lastName: zod_1.z.string().min(1).max(255).optional(),
    username: zod_1.z.string().min(1).max(255).optional(),
    email: zod_1.z.string().email().max(255).optional(),
    phone: zod_1.z.string().min(1).max(50).optional(),
    avatar: zod_1.z.string().url().optional(),
    favorite: zod_1.z.boolean().optional(),
});
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.string().regex(/^\d+$/, "ID must be a valid number"),
});
