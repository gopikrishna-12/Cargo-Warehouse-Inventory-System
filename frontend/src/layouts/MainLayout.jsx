import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import FloatingChatbot from "../components/chat/FloatingChatbot";

function MainLayout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020817] transition-colors duration-300 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to Landing or Login if unauthenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#020817] text-slate-800 dark:text-slate-100 transition-colors duration-300 antialiased font-sans">
      
      {/* Dynamic sidebar shell */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main container panel */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-20 transition-all duration-300">
        
        {/* Dynamic header navbar */}
        <Navbar
          setSidebarOpen={setSidebarOpen}
        />

        {/* Dashboard subpage outlets */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
      {user?.role === "Customer" && <FloatingChatbot />}
    </div>
  );
}

export default MainLayout;