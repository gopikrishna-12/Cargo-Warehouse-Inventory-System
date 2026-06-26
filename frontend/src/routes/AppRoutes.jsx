import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import LandingPage from "../pages/LandingPage/LandingPage";
import Login from "../pages/Login/Login";

import Dashboard from "../pages/Dashboard/Dashboard";
import Cargo from "../pages/Cargo/Cargo";
import Shipments from "../pages/Shipments/Shipments";
import Warehouse from "../pages/Warehouse/Warehouse";
import Customers from "../pages/Customers/Customers";
import Documents from "../pages/Documents/Documents";
import Reports from "../pages/Reports/Reports";
import Settings from "../pages/Settings/Settings";
import UserManagement from "../pages/UserManagement/UserManagement";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Gateway routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard core shell */}
        <Route path="/dashboard" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="cargo" element={<Cargo />} />
          <Route path="shipments" element={<Shipments />} />
          <Route path="warehouse" element={<Warehouse />} />
          <Route path="customers" element={<Customers />} />
          <Route path="documents" element={<Documents />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="users" element={<UserManagement />} />
        </Route>

        {/* Route mismatch fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;