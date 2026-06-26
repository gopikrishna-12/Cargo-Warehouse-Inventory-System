import { verifyToken } from "../utils/jwt.js";
import { userRepository } from "../repositories/userRepository.js";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "Access denied. Invalid or expired token." });
  }

  // Retrieve user to make sure they are active
  const user = userRepository.findById(decoded.id);
  if (!user || !user.isActive) {
    return res.status(401).json({ error: "Access denied. User account is inactive or deleted." });
  }

  req.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };

  next();
}

export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized. Authentication required." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Forbidden. Role '${req.user.role}' does not have permission to access this resource.` 
      });
    }

    next();
  };
}
