import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FaWarehouse,
  FaChartPie,
  FaBox,
  FaTruck,
  FaUsers,
  FaFileAlt,
  FaChartBar,
  FaUserCog,
  FaCog,
  FaSignOutAlt,
  FaRobot
} from "react-icons/fa";

function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  
  // Hover state to control sidebar expansion on desktop/tablet
  const [isHovered, setIsHovered] = useState(false);

  function handleLogoutClick() {
    logout();
    setSidebarOpen(false);
    setIsHovered(false);
    navigate("/");
  }

  // Define WMS navigation items
  const allItems = [
    { title: "Dashboard", path: "/dashboard", icon: FaChartPie, badge: "Live" },
    { title: "Cargo Management", path: "/dashboard/cargo", icon: FaBox, badge: "18" },
    { title: "Shipments", path: "/dashboard/shipments", icon: FaTruck, badge: "3 Active" },
    { title: "Warehouse Zones", path: "/dashboard/warehouse", icon: FaWarehouse, badge: "4 Zones" },
    { title: "Customer Directory", path: "/dashboard/customers", icon: FaUsers, badge: "12 Clients" },
    { title: "Documents", path: "/dashboard/documents", icon: FaFileAlt, badge: "8" },
    { title: "Reports", path: "/dashboard/reports", icon: FaChartBar, badge: "New" },
    { title: "User Management", path: "/dashboard/users", icon: FaUserCog, badge: "8 Staff" },
    { title: "Settings", path: "/dashboard/settings", icon: FaCog, badge: "System" },
  ];

  // Dynamic filter based on database/auth role permissions
  const filteredItems = allItems.filter((item) => {
    if (item.path === "/dashboard") return true;

    switch (role) {
      case "Admin":
        return true; // Super Admin sees all

      case "Operations Staff":
        return item.path !== "/dashboard/users"; // Admin sees all except User Management

      case "Warehouse Staff":
        // Distinguish between Manager and Worker
        if (user?.email === "manager@orbem.com") {
          return ["/dashboard/cargo", "/dashboard/warehouse", "/dashboard/documents", "/dashboard/settings"].includes(item.path);
        } else {
          // Worker
          return ["/dashboard/cargo", "/dashboard/warehouse", "/dashboard/settings"].includes(item.path);
        }

      case "Partner":
        return ["/dashboard/cargo", "/dashboard/shipments", "/dashboard/warehouse", "/dashboard/settings"].includes(item.path);

      case "Customer":
        return ["/dashboard/cargo", "/dashboard/shipments", "/dashboard/documents", "/dashboard/settings"].includes(item.path);

      case "Accounts Staff":
        return ["/dashboard/cargo", "/dashboard/shipments", "/dashboard/warehouse", "/dashboard/customers", "/dashboard/documents", "/dashboard/reports"].includes(item.path);

      case "Documentation Executive":
        return ["/dashboard/cargo", "/dashboard/documents", "/dashboard/settings"].includes(item.path);

      default:
        return false;
    }
  });

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          fixed left-0 top-0 bottom-0 z-50 bg-[#070c1e] dark:bg-[#020817] text-white
          border-r border-slate-800 dark:border-slate-900 shadow-2xl
          transition-all duration-300 ease-in-out flex flex-col
          desktop-sidebar-visible
          
          ${
            sidebarOpen 
              ? "w-64 translate-x-0" 
              : "-translate-x-full md:translate-x-0 w-20"
          }
          
          ${isHovered ? "md:w-64" : "md:w-20"}
        `}
      >
        {/* Sidebar Header */}
        <div className={`
          h-16 flex items-center border-b border-slate-800/80 dark:border-slate-900/80 transition-all duration-300
          ${(isHovered || sidebarOpen) ? "justify-between px-6" : "justify-center px-0"}
        `}>
          <div className="flex items-center gap-3">
            {/* Custom rotated squircle logo */}
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center transform rotate-45 shrink-0 shadow-md">
              <div className="w-3 h-3 border border-white rounded-xs transform -rotate-45" />
            </div>
            
            <div className={`
              leading-none select-none transition-all duration-300
              ${(isHovered || sidebarOpen) ? "opacity-100 translate-x-0 max-w-[150px]" : "opacity-0 -translate-x-4 max-w-0 pointer-events-none overflow-hidden"}
            `}>
              <span className="font-extrabold text-sm tracking-[0.1em] text-white leading-none uppercase block">
                ORBEM
              </span>
              <span className="text-[9px] text-slate-400 font-bold tracking-[0.15em] leading-none uppercase block mt-1">
                LOGISTICS
              </span>
            </div>
          </div>

          <button
            className={`
              md:hidden text-slate-400 hover:text-white p-1 hover:bg-slate-850 rounded-lg transition-colors cursor-pointer
              ${(isHovered || sidebarOpen) ? "block" : "hidden"}
            `}
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/dashboard"}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center rounded-xl text-sm font-semibold transition-all duration-300 group relative
                  
                  ${(isHovered || sidebarOpen) ? "justify-between px-4 py-3" : "justify-center p-3"}
                  
                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                      : "text-slate-400 hover:bg-slate-800/60 dark:hover:bg-slate-900/60 hover:text-slate-100"
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <div className={`
                      flex items-center min-w-0 transition-all duration-300
                      ${(isHovered || sidebarOpen) ? "gap-3.5" : "gap-0 justify-center"}
                    `}>
                      <Icon className={`text-lg shrink-0 transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`} />
                      
                      <span className={`
                        transition-all duration-300 whitespace-nowrap truncate
                        ${(isHovered || sidebarOpen) ? "opacity-100 translate-x-0 max-w-[150px]" : "opacity-0 -translate-x-4 max-w-0 pointer-events-none overflow-hidden"}
                      `}>
                        {item.title}
                      </span>
                    </div>

                    {/* Pill Badge */}
                    {item.badge && (
                      <span className={`
                        whitespace-nowrap shrink-0 px-2 py-0.5 text-[9px] font-bold rounded-lg
                        transition-all duration-300
                        ${(isHovered || sidebarOpen) ? "opacity-100 scale-100" : "opacity-0 scale-50 w-0 h-0 p-0 overflow-hidden pointer-events-none"}
                        ${
                          item.badge === "New"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : isActive
                            ? "bg-white/20 text-white"
                            : "bg-slate-800 dark:bg-slate-900 text-slate-400"
                        }
                      `}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer (Operator Profile & Logout) */}
        <div className={`
          p-4 border-t border-slate-800/80 dark:border-slate-900/80 transition-all duration-300
          ${(isHovered || sidebarOpen) ? "space-y-3" : "space-y-0"}
        `}>
          <div className={`
            flex items-center gap-3 transition-all duration-300 rounded-xl
            ${(isHovered || sidebarOpen) ? "bg-slate-800/20 dark:bg-slate-900/20 border border-slate-800/50 justify-between px-2 py-1.5 w-full" : "bg-transparent border-transparent justify-center w-full p-0"}
          `}>
            <div className={`
              flex items-center min-w-0 transition-all duration-300
              ${(isHovered || sidebarOpen) ? "gap-2.5" : "gap-0 justify-center"}
            `}>
              <div className="h-8 w-8 bg-blue-600 font-bold rounded-lg flex items-center justify-center text-xs text-white shrink-0">
                {user?.name?.slice(0, 2).toUpperCase() || "AD"}
              </div>
              <div className={`
                truncate text-left transition-all duration-300
                ${(isHovered || sidebarOpen) ? "opacity-100 translate-x-0 max-w-[120px]" : "opacity-0 -translate-x-4 max-w-0 pointer-events-none overflow-hidden"}
              `}>
                <p className="text-xs font-semibold text-slate-200 leading-tight truncate">{user?.name || "Controller"}</p>
                <p className="text-[10px] text-slate-400 leading-none mt-1 truncate">{role}</p>
              </div>
            </div>

            <button
              onClick={handleLogoutClick}
              className={`
                text-slate-500 hover:text-red-400 p-1 hover:bg-slate-800 rounded-lg transition-all duration-300 cursor-pointer
                ${(isHovered || sidebarOpen) ? "opacity-100 scale-100 w-auto" : "opacity-0 scale-50 w-0 h-0 p-0 overflow-hidden pointer-events-none"}
              `}
              title="Logout"
            >
              <FaSignOutAlt className="text-sm" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;