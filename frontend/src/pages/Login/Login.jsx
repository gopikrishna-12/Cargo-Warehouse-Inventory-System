import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, MOCK_PROFILES } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { FaWarehouse, FaArrowRight, FaUserShield, FaUnlockAlt, FaSun, FaMoon } from "react-icons/fa";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Super Admin");
  const [password, setPassword] = useState("••••••••");

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!email) {
      alert("Please provide an email address.");
      return;
    }
    try {
      await login(email, role);
      navigate("/dashboard");
    } catch (err) {
      alert(err.message || "Login failed");
    }
  }

  async function handleProfileClick(profile) {
    try {
      await login(profile.email, profile.role);
      navigate("/dashboard");
    } catch (err) {
      console.error("Quick profile login failed:", err);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-4 md:p-6 transition-colors duration-300 font-sans">
      
      {/* Header controls */}
      <div className="absolute top-6 right-6 flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-755 text-slate-500 dark:text-slate-400 cursor-pointer transition-colors"
        >
          {theme === "light" ? <FaMoon /> : <FaSun className="text-amber-450" />}
        </button>
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-8">
        
        {/* Left side: Login selector Form */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-2xl shadow-xl p-6 md:p-8 flex flex-col justify-between transition-colors duration-300">
          <div className="space-y-6">
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-650 text-white rounded-xl shadow-md shadow-blue-500/25 shrink-0">
                <FaWarehouse className="text-xl" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-wider text-slate-900 dark:text-white uppercase leading-none block">
                  ORBEM SOLUTIONS
                </span>
                <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                  WMS CONSOLE
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Welcome back</h2>
              <p className="text-slate-400 text-xs mt-1">Select your profile or enter credentials to launch the dashboard.</p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">Login Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@orbem.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">Select Dashboard Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors cursor-pointer"
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="Warehouse Manager">Warehouse Manager</option>
                  <option value="Warehouse Worker">Warehouse Worker</option>
                  <option value="Dispatch Manager">Dispatch Manager</option>
                  <option value="Customer">Customer</option>
                  <option value="Auditor">Auditor</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 mt-6 cursor-pointer"
              >
                <span>Access Terminal</span>
                <FaArrowRight className="text-xs" />
              </button>
            </form>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-700/60 pt-4 mt-6 text-[10px] text-slate-400 text-center leading-normal">
            * Standard WMS session timeouts are enforced. For compliance auditing, all access logs are archived.
          </div>
        </div>

        {/* Right side: Simulation Profiles list */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FaUserShield className="text-blue-500" />
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Quick Access Simulation Panel</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal max-w-xl mb-2">
            Click any profile card to instantly log in with that specialized role. Swapping roles customizes sidebars, dashboards, statistics, and permission sets.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
            {MOCK_PROFILES.map((profile) => (
              <div
                key={profile.email}
                onClick={() => handleProfileClick(profile)}
                className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 p-4 rounded-xl shadow-xs hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-slate-850 dark:text-slate-150 text-sm group-hover:text-blue-600 transition-colors">
                    {profile.role}
                  </span>
                  <span className="p-1 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-550 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <FaUnlockAlt className="text-[10px]" />
                  </span>
                </div>
                <p className="text-[10px] font-mono text-slate-400 truncate">{profile.email}</p>
                <p className="text-[10px] text-slate-450 dark:text-slate-400 leading-relaxed mt-2 border-t border-slate-50 dark:border-slate-700/50 pt-2">
                  {profile.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
