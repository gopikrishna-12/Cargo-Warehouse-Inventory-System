import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  FaCog,
  FaUser,
  FaBell,
  FaDatabase,
  FaShieldAlt,
  FaSave,
  FaUserShield,
  FaLock
} from "react-icons/fa";

function Settings() {
  const { user, role, permissions } = useAuth();
  const [activeTab, setActiveTab] = useState("general");

  const [notificationRules, setNotificationRules] = useState({
    arrivalAlerts: true,
    dispatchAlerts: true,
    invoiceOverdue: false,
    lowSpaceWarning: true,
  });

  const [profileData, setProfileData] = useState({
    name: user?.name || "Controller Staff",
    email: user?.email || "staff@orbem.com"
  });

  const [passwords, setPasswords] = useState({
    new: "",
    confirm: ""
  });

  function handleSaveGeneral(e) {
    e.preventDefault();
    if (permissions.isReadOnly) {
      toast.error("Auditor has read-only access. Saving blocked.");
      return;
    }
    toast.success("General WMS parameters updated successfully!");
  }

  function handleSaveProfile(e) {
    e.preventDefault();
    if (permissions.isReadOnly) {
      toast.error("Auditor has read-only access. Profile modifications blocked.");
      return;
    }
    toast.success("User account profile specifications saved.");
  }

  function handleSaveAlerts(e) {
    e.preventDefault();
    if (permissions.isReadOnly) {
      toast.error("Auditor has read-only access. Alert config blocked.");
      return;
    }
    toast.success("Automated notification dispatch rules synchronized!");
  }

  function handleSaveSecurity(e) {
    e.preventDefault();
    if (permissions.isReadOnly) {
      toast.error("Auditor has read-only access. Security settings blocked.");
      return;
    }
    if (passwords.new && passwords.new !== passwords.confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    toast.success("Security keys and access credentials rotated!");
    setPasswords({ new: "", confirm: "" });
  }

  return (
    <div className="space-y-6 transition-colors duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">System Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Configure WMS notification rules, general parameters, and access permissions.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-64 shrink-0 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs transition-colors">
          <nav className="p-2 space-y-1">
            <button
              onClick={() => setActiveTab("general")}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "general"
                  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900/60"
              }`}
            >
              <FaCog />
              <span>General Settings</span>
            </button>
            
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "profile"
                  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900/60"
              }`}
            >
              <FaUser />
              <span>User Account</span>
            </button>

            <button
              onClick={() => setActiveTab("notifications")}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "notifications"
                  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900/60"
              }`}
            >
              <FaBell />
              <span>Notification Rules</span>
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "security"
                  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900/60"
              }`}
            >
              <FaShieldAlt />
              <span>Security & Roles</span>
            </button>
          </nav>
        </div>

        {/* Configurations Form Container */}
        <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xs p-6 w-full transition-colors">
          {activeTab === "general" && (
            <form onSubmit={handleSaveGeneral} className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3">Warehouse Parameters</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">System Currency</label>
                  <select className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-750 text-slate-850 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                    <option value="USD">USD ($) - United States Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">WMS Operations Timezone</label>
                  <select className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-750 text-slate-850 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                    <option value="UTC">UTC / GMT 0:00</option>
                    <option value="EST">EST / GMT -5:00</option>
                    <option value="IST">IST / GMT +5:30</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Critical Cargo Threshold (Tons)</label>
                  <input
                    type="number"
                    defaultValue={10}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Warehouse Code Prefix</label>
                  <input
                    type="text"
                    defaultValue="WH-ZONE-"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-slate-50 dark:border-slate-700">
                <button
                  type="submit"
                  disabled={permissions.isReadOnly}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <FaSave />
                  <span>Save General Config</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3">User Profile</h3>
              </div>
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-6">
                <div className="h-20 w-20 bg-blue-650 text-white font-bold rounded-full flex items-center justify-center text-3xl shadow-md uppercase">
                  {user?.name?.slice(0, 2).toUpperCase() || "AD"}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-850 dark:text-white text-lg">{profileData.name}</h4>
                  <p className="text-slate-450 dark:text-slate-400 text-xs mt-0.5 flex items-center gap-1.5">
                    <FaUserShield className="text-blue-500" />
                    <span>Role: {role} | Access Level: {permissions.isReadOnly ? "Read-Only Auditor" : "Full Access Operations"}</span>
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Full Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-750 text-slate-805 dark:text-slate-101 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Contact Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-750 text-slate-805 dark:text-slate-101 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end pt-4 border-t border-slate-50 dark:border-slate-700">
                <button
                  type="submit"
                  disabled={permissions.isReadOnly}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <FaSave />
                  <span>Update Profile</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === "notifications" && (
            <form onSubmit={handleSaveAlerts} className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3">Automated System Alerts</h3>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Select events that dispatch notifications in the application tray and log auditing lines.</p>
              </div>
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationRules.arrivalAlerts}
                    onChange={(e) => setNotificationRules({ ...notificationRules, arrivalAlerts: e.target.checked })}
                    className="h-4 w-4 rounded-sm text-blue-600 dark:text-blue-500 border-slate-300 dark:border-slate-700 mt-1 cursor-pointer focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">Cargo Intake & Arrival</span>
                    <p className="text-slate-400 dark:text-slate-500 text-xs">Notify when a customer registers new cargo or items are scanned at warehouse gates.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationRules.dispatchAlerts}
                    onChange={(e) => setNotificationRules({ ...notificationRules, dispatchAlerts: e.target.checked })}
                    className="h-4 w-4 rounded-sm text-blue-600 dark:text-blue-500 border-slate-300 dark:border-slate-700 mt-1 cursor-pointer focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">Logistics Shipments & Dispatch</span>
                    <p className="text-slate-400 dark:text-slate-500 text-xs">Notify when shipments are marked as dispatched, delayed, or successfully delivered.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationRules.invoiceOverdue}
                    onChange={(e) => setNotificationRules({ ...notificationRules, invoiceOverdue: e.target.checked })}
                    className="h-4 w-4 rounded-sm text-blue-600 dark:text-blue-500 border-slate-300 dark:border-slate-700 mt-1 cursor-pointer focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">Invoice Status Warnings</span>
                    <p className="text-slate-400 dark:text-slate-500 text-xs">Dispatch reminders when outstanding cargo billing invoices cross their due date thresholds.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationRules.lowSpaceWarning}
                    onChange={(e) => setNotificationRules({ ...notificationRules, lowSpaceWarning: e.target.checked })}
                    className="h-4 w-4 rounded-sm text-blue-600 dark:text-blue-500 border-slate-300 dark:border-slate-700 mt-1 cursor-pointer focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">Zone Utilization Alerts</span>
                    <p className="text-slate-400 dark:text-slate-500 text-xs">Trigger critical space warning indicators when warehouse zoning occupancy exceeds 90% capacity.</p>
                  </div>
                </label>
              </div>
              
              <div className="flex justify-end pt-4 border-t border-slate-50 dark:border-slate-700">
                <button
                  type="submit"
                  disabled={permissions.isReadOnly}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <FaSave />
                  <span>Update Rules</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === "security" && (
            <form onSubmit={handleSaveSecurity} className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3">Audit Logs & Access Control</h3>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 flex items-center gap-4 text-slate-655 dark:text-slate-300 border border-slate-100 dark:border-slate-700/60 transition-colors">
                <FaDatabase className="text-2xl text-blue-550 shrink-0 animate-pulse" />
                <div className="text-xs">
                  <p className="font-bold text-slate-800 dark:text-white">Active Supabase Core Connection</p>
                  <p className="text-slate-400 dark:text-slate-500 mt-0.5">SSL secure queries. Row Level Security policies are actively enforced on all records.</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-555 dark:text-slate-400 uppercase flex items-center gap-1">
                  <FaLock className="text-[10px]" />
                  <span>Rotational Access Credentials</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="password"
                    placeholder="New rotated password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-750 text-slate-800 dark:text-slate-105 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="password"
                    placeholder="Confirm rotated password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-750 text-slate-800 dark:text-slate-105 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end pt-4 border-t border-slate-50 dark:border-slate-700">
                <button
                  type="submit"
                  disabled={permissions.isReadOnly}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <FaSave />
                  <span>Save Rotational Config</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;