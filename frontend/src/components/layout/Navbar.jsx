import { useState, useEffect, useRef } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { apiService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  FaBars,
  FaBell,
  FaSignOutAlt,
  FaCog,
  FaInbox,
  FaSun,
  FaMoon,
  FaSearch,
  FaBox,
  FaTruck,
  FaWarehouse,
  FaUsers,
  FaFileAlt,
  FaSpinner
} from "react-icons/fa";

function Navbar({ setSidebarOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Dropdown controls
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({
    cargo: [],
    shipments: [],
    warehouses: [],
    customers: [],
    documents: []
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const searchRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
  }, [location.pathname]);

  // Click outside to close search dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Trigger global search queries across backend API
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults({ cargo: [], shipments: [], warehouses: [], customers: [], documents: [] });
      setSearchLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      triggerGlobalSearch();
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function triggerGlobalSearch() {
    try {
      setSearchLoading(true);
      const query = searchQuery.trim();

      // Run parallel api calls for global search performance
      const [cargo, shipments, warehousesAll, customers, documents] = await Promise.all([
        apiService.getCargo(query).then(res => res.slice(0, 3)),
        apiService.getShipments(query).then(res => res.slice(0, 3)),
        apiService.getWarehouses().then(res => 
          res.filter(w => w.address?.toLowerCase().includes(query.toLowerCase())).slice(0, 3)
        ),
        apiService.getCustomers(query).then(res => res.slice(0, 3)),
        apiService.getDocuments(query).then(res => res.slice(0, 3))
      ]);

      setSearchResults({
        cargo: cargo || [],
        shipments: shipments || [],
        warehouses: warehousesAll || [],
        customers: customers || [],
        documents: documents || []
      });
      setShowSearchDropdown(true);
    } catch (e) {
      console.error("Global search failed:", e.message);
    } finally {
      setSearchLoading(false);
    }
  }

  async function fetchNotifications() {
    try {
      const data = await apiService.getNotifications();
      setNotifications(data || []);
      setUnreadCount((data || []).filter((n) => !n.is_read).length);
    } catch (e) {
      console.error("Error fetching notifications:", e.message);
    }
  }

  async function markAllAsRead() {
    try {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
      if (unreadIds.length === 0) return;

      await apiService.markNotificationsRead(unreadIds);
      fetchNotifications();
    } catch (e) {
      console.error("Error marking notifications read:", e.message);
    }
  }

  // Determine dynamic title for headers
  function getPageTitle() {
    switch (location.pathname) {
      case "/dashboard":
        return `${role} Console`;
      case "/dashboard/cargo":
        return "Cargo Inventory Management";
      case "/dashboard/shipments":
        return "Shipment Dispatch & Tracking";
      case "/dashboard/warehouse":
        return "Warehouse Zones Layout";
      case "/dashboard/customers":
        return "Client Contacts Directory";
      case "/dashboard/documents":
        return "Manifests & Documents Vault";
      case "/dashboard/reports":
        return "Operational Reports & CSV";
      case "/dashboard/users":
        return "User Access Control";
      case "/dashboard/settings":
        return "System Settings Config";
      default:
        return "ORBEM Logistics WMS";
    }
  }

  function handleLogoutClick() {
    logout();
    setProfileOpen(false);
    navigate("/");
  }

  const hasSearchResults = 
    searchResults.cargo.length > 0 ||
    searchResults.shipments.length > 0 ||
    searchResults.warehouses.length > 0 ||
    searchResults.customers.length > 0 ||
    searchResults.documents.length > 0;

  return (
    <div className="sticky top-0 z-30 h-16 bg-white dark:bg-[#0b1224] border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 shadow-sm transition-colors duration-300">
      
      {/* Left section: Hamburger & dynamic title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          <FaBars className="text-xl" />
        </button>

        <h1 className="font-extrabold text-base md:text-lg text-slate-800 dark:text-white tracking-tight shrink-0 hidden sm:block">
          {getPageTitle()}
        </h1>
      </div>

      {/* Center Section: Global search bar */}
      <div ref={searchRef} className="flex-1 max-w-md mx-4 relative hidden md:block">
        <div className="relative">
          <FaSearch className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search Cargo, Shipments, Warehouses, Clients..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            className="w-full bg-slate-50 dark:bg-[#020817] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl py-2.5 pl-10 pr-10 text-xs focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
          />
          {searchLoading && (
            <FaSpinner className="absolute right-3.5 top-3.5 text-blue-500 animate-spin text-sm" />
          )}
        </div>

        {/* Global Search Categorized Dropdown */}
        {showSearchDropdown && (searchQuery.trim().length >= 2) && (
          <div className="absolute left-0 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700 max-h-96 overflow-y-auto">
            {!hasSearchResults && !searchLoading ? (
              <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
                No matching results found in database.
              </div>
            ) : (
              <>
                {/* 1. Cargo Category */}
                {searchResults.cargo.length > 0 && (
                  <div className="p-3">
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <FaBox className="text-blue-500" />
                      <span>Cargo Entries</span>
                    </p>
                    <div className="space-y-1">
                      {searchResults.cargo.map((item) => (
                        <Link
                          key={item.id}
                          to="/dashboard/cargo"
                          onClick={() => { setShowSearchDropdown(false); setSearchQuery(""); }}
                          className="block text-xs hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded-lg text-slate-700 dark:text-slate-350 font-semibold"
                        >
                          <p className="truncate">{item.description}</p>
                          <span className="text-[9px] text-slate-400 font-mono">Ref ID: {String(item.id).slice(0, 8).toUpperCase()} | Status: {item.status}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Shipments Category */}
                {searchResults.shipments.length > 0 && (
                  <div className="p-3">
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <FaTruck className="text-indigo-500" />
                      <span>Shipment Logs</span>
                    </p>
                    <div className="space-y-1">
                      {searchResults.shipments.map((item) => (
                        <Link
                          key={item.id}
                          to="/dashboard/shipments"
                          onClick={() => { setShowSearchDropdown(false); setSearchQuery(""); }}
                          className="block text-xs hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded-lg text-slate-700 dark:text-slate-350 font-semibold"
                        >
                          <p className="truncate">{item.origin} → {item.destination}</p>
                          <span className="text-[9px] text-slate-400 font-mono">ID: {String(item.id).slice(0, 8).toUpperCase()} | State: {item.status}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Warehouse Category */}
                {searchResults.warehouses.length > 0 && (
                  <div className="p-3">
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <FaWarehouse className="text-emerald-500" />
                      <span>Warehouse Locations</span>
                    </p>
                    <div className="space-y-1">
                      {searchResults.warehouses.map((item) => (
                        <Link
                          key={item.id}
                          to="/dashboard/warehouse"
                          onClick={() => { setShowSearchDropdown(false); setSearchQuery(""); }}
                          className="block text-xs hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded-lg text-slate-700 dark:text-slate-350 font-semibold"
                        >
                          <p className="truncate">{item.address}</p>
                          <span className="text-[9px] text-slate-400 font-mono">Zone Ref: {String(item.id).slice(0, 8).toUpperCase()}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Customer Category */}
                {searchResults.customers.length > 0 && (
                  <div className="p-3">
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <FaUsers className="text-amber-500" />
                      <span>Customer Clients</span>
                    </p>
                    <div className="space-y-1">
                      {searchResults.customers.map((item) => (
                        <Link
                          key={item.id}
                          to="/dashboard/customers"
                          onClick={() => { setShowSearchDropdown(false); setSearchQuery(""); }}
                          className="block text-xs hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded-lg text-slate-700 dark:text-slate-350 font-semibold"
                        >
                          <p className="truncate">{item.company_name}</p>
                          <span className="text-[9px] text-slate-400 font-mono">Client ID: {String(item.id).slice(0, 8).toUpperCase()}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Documents Category */}
                {searchResults.documents.length > 0 && (
                  <div className="p-3">
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <FaFileAlt className="text-red-500" />
                      <span>Document Vault</span>
                    </p>
                    <div className="space-y-1">
                      {searchResults.documents.map((item) => (
                        <a
                          key={item.id}
                          href={item.file_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => { setShowSearchDropdown(false); setSearchQuery(""); }}
                          className="block text-xs hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded-lg text-slate-700 dark:text-slate-350 font-semibold"
                        >
                          <p className="truncate">{item.file_url.split("/").pop()}</p>
                          <span className="text-[9px] text-slate-400 font-mono">Link ID: {String(item.id).slice(0, 8).toUpperCase()}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right controls section */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          title="Toggle Theme"
        >
          {theme === "light" ? <FaMoon /> : <FaSun className="text-amber-400" />}
        </button>

        {/* Notifications Tray */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileOpen(false);
              if (!notificationsOpen) markAllAsRead();
            }}
            className="p-2.5 text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer relative"
          >
            <FaBell className="text-lg" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full flex items-center justify-center text-[8px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden transition-colors">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <span className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">Operational Alerts</span>
                {unreadCount > 0 && (
                  <span className="text-[9px] bg-red-500 text-white font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 dark:text-slate-500">
                    <FaInbox className="mx-auto text-xl mb-1.5 text-slate-300" />
                    <p className="text-xs">No notifications available</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className={`p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${!notif.is_read ? "bg-blue-50/10 dark:bg-blue-950/10" : ""}`}>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{notif.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">{notif.message}</p>
                      <span className="text-[9px] text-slate-400 mt-1 block">
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-center">
                <Link
                  to="/dashboard/settings"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400"
                >
                  Configure WMS Alert Rules
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile menu */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2 p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <div className="h-8 w-8 bg-blue-600 font-bold rounded-lg flex items-center justify-center text-xs text-white uppercase shadow-sm">
              {user?.name?.slice(0, 2).toUpperCase() || "AD"}
            </div>
          </button>

          {/* Profile Menu Dropdown */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden py-1 transition-colors">
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/20 dark:bg-slate-900/20">
                <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{user?.name || "Controller"}</p>
                <p className="text-[9px] text-slate-400 truncate mt-0.5 leading-none">{role}</p>
              </div>

              <Link
                to="/dashboard/settings"
                onClick={() => setProfileOpen(false)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <FaCog className="text-slate-400" />
                <span>Account Settings</span>
              </Link>

              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left border-t border-slate-50 dark:border-slate-700 cursor-pointer"
              >
                <FaSignOutAlt className="text-red-400" />
                <span>Sign Out Console</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;