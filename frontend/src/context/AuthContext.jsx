import { createContext, useContext, useEffect, useState } from "react";
import { apiService } from "../services/api";

const AuthContext = createContext();

export const MOCK_PROFILES = [
  {
    email: "superadmin@orbem.com",
    name: "Super Admin Controller",
    role: "Admin",
    description: "Full system orchestration, permissions, and security auditing.",
  },
  {
    email: "admin@orbem.com",
    name: "Operations Admin",
    role: "Operations Staff",
    description: "Core inventory, client directory, and shipment lifecycle management.",
  },
  {
    email: "manager@orbem.com",
    name: "Zone A Warehouse Manager",
    role: "Warehouse Staff",
    description: "Warehouse zoning, storage slots allocation, and intake approval.",
  },
  {
    email: "worker@orbem.com",
    name: "Floor Operator Staff",
    role: "Warehouse Staff",
    description: "Touch-optimized task updates, storage scanning, and cargo sorting.",
  },
  {
    email: "dispatch@orbem.com",
    name: "Logistics Dispatch Lead",
    role: "Partner",
    description: "Couriers tracking, delivery scheduling, and routing timelines.",
  },
  {
    email: "customer@orbem.com",
    name: "Zenith Shipping Client",
    role: "Customer",
    description: "Customer Portal: view own cargo, download manifests, track shipping.",
  },
  {
    email: "auditor@orbem.com",
    name: "Compliance Auditor",
    role: "Accounts Staff",
    description: "Financial ledger, invoice details, billing, and reports auditing.",
  },
  {
    email: "doc@orbem.com",
    name: "Documentation Specialist",
    role: "Documentation Executive",
    description: "Upload and check shipping manifests, custom declarations, and origin certificates.",
  },
];

// Helper to determine capability flags per role
function getRolePermissions(role) {
  return {
    manageUsers: role === "Admin",
    managePermissions: role === "Admin",
    manageSystemSettings: role === "Admin",
    manageCargo: ["Admin", "Operations Staff", "Warehouse Staff"].includes(role),
    manageShipments: ["Admin", "Operations Staff", "Partner"].includes(role),
    manageWarehouse: ["Admin", "Operations Staff", "Warehouse Staff"].includes(role),
    manageCustomers: ["Admin", "Operations Staff"].includes(role),
    uploadDocuments: ["Admin", "Operations Staff", "Documentation Executive", "Customer"].includes(role),
    viewLogs: ["Admin", "Accounts Staff"].includes(role),
    viewReports: ["Admin", "Operations Staff", "Accounts Staff", "Customer", "Partner"].includes(role),
    isReadOnly: ["Accounts Staff", "Partner"].includes(role),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("orbem_user");
    const savedRole = localStorage.getItem("orbem_role");
    const savedToken = localStorage.getItem("orbem_token");

    if (savedUser && savedRole && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setRole(savedRole);
        setPermissions(getRolePermissions(savedRole));
      } catch (e) {
        logout();
      }
    }
    setLoading(false);
  }, []);

  async function login(email, selectedRole, password = "password123") {
    try {
      const response = await apiService.login(email, password);
      
      const loggedUser = response.user;
      const token = response.token;

      setUser(loggedUser);
      setRole(loggedUser.role);
      setPermissions(getRolePermissions(loggedUser.role));

      localStorage.setItem("orbem_user", JSON.stringify(loggedUser));
      localStorage.setItem("orbem_role", loggedUser.role);
      localStorage.setItem("orbem_token", token);
      
      return response;
    } catch (error) {
      let msg = "Login failed. Please verify credentials.";
      if (error.response) {
        msg = error.response.data?.error || msg;
      } else if (error.request) {
        msg = "Unable to connect to the backend server. Please make sure the backend is running.";
      } else {
        msg = error.message || msg;
      }
      throw new Error(msg);
    }
  }

  async function logout() {
    await apiService.logout();
    setUser(null);
    setRole(null);
    setPermissions({});
  }

  return (
    <AuthContext.Provider value={{ user, role, permissions, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

