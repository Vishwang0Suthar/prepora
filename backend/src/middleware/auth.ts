import type { NextFunction, Request, Response } from "express";

import { supabase } from "../db/supabase";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    console.log("AUTH: request received");

    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      console.log("AUTH: missing bearer");

      return res.status(401).json({
        ok: false,
        error: "UNAUTHORIZED",
      });
    }

    const token = authorization.slice("Bearer ".length).trim();

    console.log("AUTH: token received");

    if (!token) {
      return res.status(401).json({
        ok: false,
        error: "UNAUTHORIZED",
      });
    }

    console.log("AUTH: calling Supabase getUser...");

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    console.log("AUTH: getUser completed", {
      userId: user?.id,
      error: error?.message,
    });

    if (error || !user) {
      return res.status(401).json({
        ok: false,
        error: "UNAUTHORIZED",
      });
    }

    req.userId = user.id;

    console.log("AUTH: authenticated", user.id);

    next();
  } catch (error) {
    console.error("Authentication failed:", error);

    return res.status(401).json({
      ok: false,
      error: "UNAUTHORIZED",
    });
  }
}
