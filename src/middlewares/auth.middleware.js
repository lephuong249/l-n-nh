import { verifyToken } from "../utils/jwt.util.js";
//import redis from "../config/redis.js";

export const authMiddleware = (roles = []) => {
  return async (req, res, next) => {
  try{
    const token = req.cookies?.authToken;
    if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

    const decoded = verifyToken(token);
      if (!decoded || !decoded.id) return res.status(401).json({ message: "Invalid token." });

      // const redisToken = await redis.get(`auth:user:${decoded.id}`);
      // if (!redisToken || redisToken !== token) {
      //   return res.status(401).json({ message: "Token expired or invalid." });
      // }

      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: "Forbidden: insufficient role" });
      }

      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        isActive: decoded.isActive,
      };

      next();
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};
