import bcrypt from "bcrypt";
import { userRepository } from "../repositories/userRepository.js";
import { generateToken } from "../utils/jwt.js";
import { auditService } from "./auditService.js";

export const authService = {
  async login(email, password) {
    const user = userRepository.findByEmail(email);
    if (!user) {
      throw new Error("Invalid email or password.");
    }

    if (!user.isActive) {
      throw new Error("Account is deactivated. Please contact an administrator.");
    }

    // Verify password (in development we support password bypass or hashed checks)
    // Pre-seeded password is 'password123'
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error("Invalid email or password.");
    }

    // Generate JWT
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    // Log login audit
    await auditService.log({
      userId: user.email,
      action: `User session opened: ${user.name} (${user.role})`,
      entityName: "users",
      entityId: user.id
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        description: user.description
      }
    };
  },

  async logout(userEmail) {
    await auditService.log({
      userId: userEmail,
      action: `User session closed: ${userEmail}`,
      entityName: "users"
    });
    return true;
  }
};
