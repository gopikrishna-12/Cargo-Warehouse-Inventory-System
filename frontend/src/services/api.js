import axios from "axios";

let backendBaseURL = import.meta.env.VITE_API_URL;

if (!backendBaseURL) {
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    // Dynamically target the host PC running the backend when accessed on a local network or hosted environment
    backendBaseURL = `${window.location.protocol}//${window.location.hostname}:5000/api`;
  } else {
    backendBaseURL = "http://localhost:5000/api";
  }
}

const API = axios.create({
  baseURL: backendBaseURL,
  timeout: 10000,
});

// Automatically inject JWT token into all outgoing requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("orbem_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept 401 Unauthorized responses to auto-logout
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("orbem_token");
      localStorage.removeItem("orbem_user");
      localStorage.removeItem("orbem_role");
      // Redirect to login page if we are in browser
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Auth
  async login(email, password) {
    const res = await API.post("/auth/login", { email, password });
    return res.data;
  },
  async register(data) {
    const res = await API.post("/auth/register", data);
    return res.data;
  },
  async logout() {
    try {
      await API.post("/auth/logout");
    } catch (e) {}
    localStorage.removeItem("orbem_token");
    localStorage.removeItem("orbem_user");
    localStorage.removeItem("orbem_role");
  },
  async me() {
    const res = await API.get("/auth/me");
    return res.data;
  },

  // Cargo
  async getCargo(search = "", status = "all") {
    const res = await API.get("/cargo", { params: { search, status } });
    return res.data;
  },
  async getCargoById(id) {
    const res = await API.get(`/cargo/${id}`);
    return res.data;
  },
  async createCargo(data) {
    const res = await API.post("/cargo", data);
    return res.data;
  },
  async updateCargo(id, data) {
    const res = await API.put(`/cargo/${id}`, data);
    return res.data;
  },
  async deleteCargo(id) {
    const res = await API.delete(`/cargo/${id}`);
    return res.data;
  },

  // Shipments
  async getShipments(search = "", status = "all") {
    const res = await API.get("/shipments", { params: { search, status } });
    return res.data;
  },
  async createShipment(data) {
    const res = await API.post("/shipments", data);
    return res.data;
  },
  async updateShipment(id, data) {
    const res = await API.put(`/shipments/${id}`, data);
    return res.data;
  },
  async deleteShipment(id) {
    const res = await API.delete(`/shipments/${id}`);
    return res.data;
  },

  // Warehouses
  async getWarehouses() {
    const res = await API.get("/warehouse");
    return res.data;
  },
  async createWarehouse(data) {
    const res = await API.post("/warehouse", data);
    return res.data;
  },
  async updateWarehouse(id, data) {
    const res = await API.put(`/warehouse/${id}`, data);
    return res.data;
  },
  async deleteWarehouse(id) {
    const res = await API.delete(`/warehouse/${id}`);
    return res.data;
  },

  // Customers
  async getCustomers(search = "") {
    const res = await API.get("/customers", { params: { search } });
    return res.data;
  },
  async getCustomerHistory(id) {
    const res = await API.get(`/customers/${id}/history`);
    return res.data;
  },
  async createCustomer(data) {
    const res = await API.post("/customers", data);
    return res.data;
  },
  async updateCustomer(id, data) {
    const res = await API.put(`/customers/${id}`, data);
    return res.data;
  },
  async deleteCustomer(id) {
    const res = await API.delete(`/customers/${id}`);
    return res.data;
  },
  async createInvoice(customerId, data) {
    const res = await API.post(`/customers/${customerId}/invoices`, data);
    return res.data;
  },

  // Documents
  async getDocuments(search = "") {
    const res = await API.get("/documents", { params: { search } });
    return res.data;
  },
  async createDocument(data) {
    const res = await API.post("/documents", data);
    return res.data;
  },
  async deleteDocument(id) {
    const res = await API.delete(`/documents/${id}`);
    return res.data;
  },

  // User Management
  async getUsers() {
    const res = await API.get("/users");
    return res.data;
  },
  async createUser(data) {
    const res = await API.post("/users", data);
    return res.data;
  },
  async updateUser(id, data) {
    const res = await API.put(`/users/${id}`, data);
    return res.data;
  },
  async toggleUserStatus(id) {
    const res = await API.patch(`/users/${id}/status`);
    return res.data;
  },
  async deleteUser(id) {
    const res = await API.delete(`/users/${id}`);
    return res.data;
  },

  // Theme Preference
  async getTheme() {
    const res = await API.get("/settings/theme");
    return res.data;
  },
  async setTheme(theme) {
    const res = await API.post("/settings/theme", { theme });
    return res.data;
  },
  async getNotifications() {
    const res = await API.get("/settings/notifications");
    return res.data;
  },
  async markNotificationsRead(ids) {
    const res = await API.put("/settings/notifications/read", { ids });
    return res.data;
  },

  // Dashboard Stats & Export Reports
  async getDashboardStats() {
    const res = await API.get("/reports/stats");
    return res.data;
  },
  async getExportData(table) {
    const res = await API.get("/reports/export", { params: { table } });
    return res.data;
  },
  async askAI(message) {
    const res = await API.post("/chat", { message });
    return res.data;
  }
};

export default API;
