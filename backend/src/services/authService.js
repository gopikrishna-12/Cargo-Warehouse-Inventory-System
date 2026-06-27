import bcrypt from "bcrypt";
import { userRepository } from "../repositories/userRepository.js";
import { customerRepository } from "../repositories/customerRepository.js";
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

  async register(customerData) {
    const email = customerData.email.toLowerCase().trim();
    const existingUser = userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error("A user with this email address already exists.");
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(customerData.password, saltRounds);

    // Create the customer record in Supabase
    const dbCustomer = await customerRepository.create({
      company_name: customerData.company_name.trim(),
      email: email,
      phone: customerData.phone ? customerData.phone.trim() : null,
      address: customerData.address ? customerData.address.trim() : null
    });

    // Create the user login credentials in users.json
    const newUser = {
      id: "u-" + Math.floor(100000 + Math.random() * 900000),
      email: email,
      name: customerData.company_name.trim(),
      role: "Customer",
      description: "Customer Portal: view own cargo, download manifests, track shipping, billings.",
      isActive: true,
      passwordHash
    };

    userRepository.create(newUser);

    // Log registration audit
    await auditService.log({
      userId: email,
      action: `Customer self-registration complete: ${customerData.company_name}`,
      entityName: "users",
      entityId: newUser.id
    });

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      customerId: dbCustomer.id
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
