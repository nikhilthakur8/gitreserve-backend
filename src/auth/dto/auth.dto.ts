import { z } from "zod/v4";

export const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).trim(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type SignupDto = z.infer<typeof signupSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
