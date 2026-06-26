import bcrypt from "bcrypt";
import { userRepository } from "../repositories/userRepository.js";
import { auditService } from "./auditService.js";

export const userService = {
  async getUsers() {
    // Return all users (excluding password hashes for safety)
    const list = userRepository.findAll();
    return list.map(({ passwordHash, ...u }) => u);
  },

  async createUser(userData, requestedByUser) {
    const existing = userRepository.findByEmail(userData.email);
    if (existing) {
      throw new Error("A user with this email address already exists.");
    }

    const saltRounds = 10;
    const plainPassword = userData.password || "password123";
    const passwordHash = await bcrypt.hash(plainPassword, saltRounds);

    const newUser = {
      id: "u-" + Math.floor(100000 + Math.random() * 900000),
      email: userData.email.toLowerCase().trim(),
      name: userData.name.trim(),
      role: userData.role,
      description: userData.description || `${userData.role} user profile.`,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      passwordHash
    };

    const created = userRepository.create(newUser);

    await auditService.log({
      userId: requestedByUser,
      action: `Created WMS Operator Profile: ${created.name} (${created.role})`,
      entityName: "users",
      entityId: created.id,
      newValue: { id: created.id, name: created.name, email: created.email, role: created.role }
    });

    const { passwordHash: _, ...userWithoutPassword } = created;
    return userWithoutPassword;
  },

  async updateUser(id, userData, requestedByUser) {
    const oldUser = userRepository.findById(id);
    if (!oldUser) throw new Error("Operator profile not found.");

    const updatedFields = {
      name: userData.name,
      role: userData.role,
      description: userData.description,
      isActive: userData.isActive
    };

    if (userData.password) {
      updatedFields.passwordHash = await bcrypt.hash(userData.password, 10);
    }

    const updated = userRepository.update(id, updatedFields);

    await auditService.log({
      userId: requestedByUser,
      action: `Updated WMS Operator Profile: ${updated.name}`,
      entityName: "users",
      entityId: id,
      previousValue: { name: oldUser.name, role: oldUser.role, isActive: oldUser.isActive },
      newValue: { name: updated.name, role: updated.role, isActive: updated.isActive }
    });

    const { passwordHash: _, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  },

  async toggleUserStatus(id, requestedByUser) {
    const oldUser = userRepository.findById(id);
    if (!oldUser) throw new Error("Operator profile not found.");

    const newStatus = !oldUser.isActive;
    const updated = userRepository.update(id, { isActive: newStatus });

    await auditService.log({
      userId: requestedByUser,
      action: `WMS Status Toggle: ${updated.name} (Active: ${oldUser.isActive} -> ${updated.isActive})`,
      entityName: "users",
      entityId: id,
      previousValue: { isActive: oldUser.isActive },
      newValue: { isActive: updated.isActive }
    });

    const { passwordHash: _, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  },

  async deleteUser(id, requestedByUser) {
    const oldUser = userRepository.findById(id);
    if (!oldUser) throw new Error("Operator profile not found.");

    userRepository.delete(id);

    await auditService.log({
      userId: requestedByUser,
      action: `Deleted WMS Operator Profile: ${oldUser.name}`,
      entityName: "users",
      entityId: id,
      previousValue: { name: oldUser.name, email: oldUser.email }
    });

    return true;
  }
};
