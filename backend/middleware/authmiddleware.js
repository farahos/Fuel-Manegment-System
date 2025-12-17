import jwt from "jsonwebtoken";
import { jwt_secret } from "../config/config.js";

/**
 * ✅ Verify JWT and attach user payload to req.user
 */
export const authenticate = (req, res, next) => {
  const token = req.cookies?.token; // cookie must be set from login
  if (!token) {
    return res.status(401).json({ message: "Access denied. please login " });
  }

  try {
    const decoded = jwt.verify(token, jwt_secret);
    // decoded: { _id: "...", role: "admin" | "user", iat, exp }
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT verify error:", err);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

/**
 * ✅ Optional helper to restrict specific roles
 *    Usage: router.post('/admin-only', authenticate, authorizeRoles('admin'), handler)
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }
    next();
  };
};

