import type { Request, Response, NextFunction } from "express";
import type { AuthService } from "@/auth/services/auth.service.ts";

export function authMiddleware(authService: AuthService) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing or invalid authorization header" });
      return;
    }

    const token = header.slice(7);
    try {
      const payload = authService.verifyToken(token);
      req.headers["x-user-id"] = payload.userId;
      req.headers["x-user-email"] = payload.email;
      next();
    } catch {
      res.status(401).json({ error: "Invalid or expired token" });
    }
  };
}
