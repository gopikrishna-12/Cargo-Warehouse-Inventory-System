import { useEffect, useState } from "react";
import { apiService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import StatCard from "../../components/dashboard/StatCard";
import toast from "react-hot-toast";
import {
  FaBox,
  FaTruck,
  FaUsers,
  FaWarehouse,
  FaHistory,
  FaCalendarAlt,
  FaUserCog,
  FaFileInvoiceDollar,
  FaTasks,
  FaQrcode,
  FaChevronRight,
  FaLifeRing,
  FaShieldAlt,
  FaInfoCircle,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaTimes,
  FaFileAlt,
  FaPlusCircle,
  FaEdit,
  FaTrash,
  FaSyncAlt,
  FaChevronDown,
  FaChevronUp
} from "react-icons/fa";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

// Helper to parse cargo details serialized into description column
function parseCargo(raw) {
  try {
    const data = JSON.parse(raw);
    return {
      description: data.text || data.description || "Logistics Package",
      weight: data.weight || 1.2,
      quantity: data.quantity || 50,
      warehouse_zone: data.warehouse_zone || "Zone A",
      arrival_date: data.arrival_date || "2026-06-15"
    };
  } catch (e) {
    return {
      description: raw || "Logistics Package",
      weight: 1.2,
      quantity: 50,
      warehouse_zone: "Zone A",
      arrival_date: "2026-06-15"
    };
  }
}

// Helper to parse audit logs containing action and potential JSON diff
function parseAuditAction(actionStr) {
  if (!actionStr) return { message: "", diff: null };
  const parts = actionStr.split(" | Diff: ");
  const message = parts[0];
  let diff = null;
  if (parts.length > 1) {
    try {
      diff = JSON.parse(parts[1]);
    } catch (e) {
      // Ignored
    }
  }
  return { message, diff };
}

// Format property values nicely
function formatAuditValue(key, val) {
  if (val === null || val === undefined) return "N/A";
  if (typeof val === "boolean") return val ? "True" : "False";
  if (typeof val === "object") {
    if (val.address) return val.address;
    if (val.name) return `${val.name} (${val.role || ""})`;
    return JSON.stringify(val);
  }
  if (typeof val === "string" && (val.startsWith("{") || val.startsWith("["))) {
    try {
      const parsed = JSON.parse(val);
      if (parsed.text || parsed.description) return parsed.text || parsed.description;
      if (parsed.address) return parsed.address;
      if (parsed.tracking_id) return `${parsed.tracking_id} (${parsed.carrier || ""})`;
      return JSON.stringify(parsed);
    } catch (e) {}
  }
  return String(val);
}

// Compute differences
function getDiffChanges(diff) {
  if (!diff) return [];
  const changes = [];
  const oldVal = diff.old || {};
  const newVal = diff.new || {};
  
  const allKeys = Array.from(new Set([...Object.keys(oldVal), ...Object.keys(newVal)]));
  const excludeKeys = ["created_at", "updated_at", "passwordHash", "id", "user_id"];
  
  for (const key of allKeys) {
    if (excludeKeys.includes(key)) continue;
    const oldFieldVal = oldVal[key];
    const newFieldVal = newVal[key];
    
    if (JSON.stringify(oldFieldVal) !== JSON.stringify(newFieldVal)) {
      changes.push({
        field: key,
        old: oldFieldVal,
        new: newFieldVal
      });
    }
  }
  return changes;
}

function AuditLogItem({ act }) {
  const [expanded, setExpanded] = useState(false);
  const { message, diff } = parseAuditAction(act.action);
  const changes = getDiffChanges(diff);

  let category = "System Event";
  let icon = <FaInfoCircle className="text-indigo-500 text-sm" />;
  let badgeColor = "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30";
  let borderAccent = "border-l-4 border-l-indigo-500";

  const lowerMsg = message.toLowerCase();
  if (
    lowerMsg.includes("intake scanned") ||
    lowerMsg.includes("added") ||
    lowerMsg.includes("registered") ||
    lowerMsg.includes("created") ||
    lowerMsg.includes("billed")
  ) {
    category = "Register / Create";
    icon = <FaPlusCircle className="text-emerald-500 text-sm" />;
    badgeColor = "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30";
    borderAccent = "border-l-4 border-l-emerald-500";
  } else if (
    lowerMsg.includes("upgraded") ||
    lowerMsg.includes("updated") ||
    lowerMsg.includes("modified") ||
    lowerMsg.includes("status toggle")
  ) {
    category = "Update / Modify";
    icon = <FaSyncAlt className="text-amber-500 text-sm" />;
    badgeColor = "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30";
    borderAccent = "border-l-4 border-l-amber-500";
  } else if (
    lowerMsg.includes("decommissioned") ||
    lowerMsg.includes("deleted") ||
    lowerMsg.includes("removed")
  ) {
    category = "Decommission / Delete";
    icon = <FaTrash className="text-rose-500 text-sm" />;
    badgeColor = "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30";
    borderAccent = "border-l-4 border-l-rose-500";
  }

  const hasChanges = changes.length > 0;

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60 ${borderAccent} p-4 shadow-2xs hover:shadow-xs transition-all hover:scale-[1.005]`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-start gap-3 text-left">
          <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg shrink-0 mt-0.5 border border-slate-100 dark:border-slate-800/80">
            {icon}
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-150 text-sm leading-snug">
              {message}
            </p>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-mono bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-[10px]">
                ID: {String(act.id).slice(0, 8).toUpperCase()}
              </span>
              <span>•</span>
              <span>{new Date(act.created_at).toLocaleString()}</span>
              {act.entity_name && (
                <>
                  <span>•</span>
                  <span className="capitalize font-semibold text-blue-600 dark:text-blue-400">
                    {act.entity_name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <span className={`px-2.5 py-0.75 rounded-full text-[10px] font-bold ${badgeColor}`}>
            {category}
          </span>
          {hasChanges && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg transition-colors cursor-pointer"
            >
              <span>{expanded ? "Hide Details" : "Compare Changes"}</span>
              {expanded ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
            </button>
          )}
        </div>
      </div>

      {expanded && hasChanges && (
        <div className="mt-4 pt-3.5 border-t border-dashed border-slate-200 dark:border-slate-700/80 animate-in fade-in slide-in-from-top-2 duration-200 text-left">
          <p className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
            Audit Parameter Changes:
          </p>
          <div className="overflow-x-auto rounded-lg border border-slate-150 dark:border-slate-700">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-150 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-bold font-mono">
                  <th className="px-3.5 py-2">Parameter</th>
                  <th className="px-3.5 py-2">Previous State</th>
                  <th className="px-3.5 py-2">Updated State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                {changes.map((ch, idx) => {
                  const isNew = ch.old === undefined || ch.old === null || ch.old === "";
                  const isDel = ch.new === undefined || ch.new === null || ch.new === "";
                  
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30">
                      <td className="px-3.5 py-2.5 font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {ch.field}
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-pre-wrap max-w-xs break-all">
                        {isNew ? (
                          <span className="text-slate-400 italic">Empty Field</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-100/50 dark:border-rose-950/40">
                            {formatAuditValue(ch.field, ch.old)}
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-pre-wrap max-w-xs break-all">
                        {isDel ? (
                          <span className="text-rose-500 italic">Decommissioned</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100/50 dark:border-emerald-950/40 font-semibold">
                            {formatAuditValue(ch.field, ch.new)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const { user, role, permissions } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);

  // WMS data states
  const [stats, setStats] = useState({
    cargo: 0,
    shipments: 0,
    customers: 0,
    warehouses: 0,
    users: 6,
    revenue: 125900
  });
  const [cargoItems, setCargoItems] = useState([]);
  const [shipmentsList, setShipmentsList] = useState([]);
  const [activitiesList, setActivitiesList] = useState([]);

  // Customer support tickets state
  const [tickets, setTickets] = useState([]);
  const [newTicket, setNewTicket] = useState({ subject: "", description: "", priority: "Medium" });
  const [ticketModalOpen, setTicketModalOpen] = useState(false);

  // Worker task panel state
  const [workerTasks, setWorkerTasks] = useState([
    { id: "TSK-001", action: "Verify Cargo weight at Gate 4", status: "Pending" },
    { id: "TSK-002", action: "Allocate stored shelf for Zenith Box", status: "In Progress" },
    { id: "TSK-003", action: "Audit shipping label for JFK shipment", status: "Pending" },
    { id: "TSK-004", action: "Sort inbound manifest documents", status: "Completed" }
  ]);

  async function fetchDashboardDetails() {
    try {
      setLoading(true);
      
      const dashboardData = await apiService.getDashboardStats();
      const { stats: dbStats, recentCargo, recentShipments, recentActivities } = dashboardData;

      // Fetch users from API for user management count
      let usersCount = 7;
      try {
        if (role === "Admin" || role === "Super Admin") {
          const usersList = await apiService.getUsers();
          usersCount = usersList.length;
        }
      } catch (err) {}

      setStats({
        cargo: dbStats.cargoCount || 0,
        shipments: dbStats.shipmentCount || 0,
        customers: dbStats.customerCount || 0,
        warehouses: dbStats.warehouseCount || 0,
        users: usersCount,
        revenue: dbStats.revenue || 0
      });

      setCargoItems(recentCargo || []);
      setShipmentsList(recentShipments || []);
      setActivitiesList(recentActivities || []);

    } catch (e) {
      console.error("Dashboard fetch error:", e.message);
      toast.error("Failed to load WMS stats from backend.");
    } finally {
      setLoading(false);
    }
  }

  // Load support tickets from localStorage
  function loadSupportTickets() {
    if (!user?.email) return;
    const key = `orbem_support_tickets_${user.email}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setTickets(JSON.parse(saved));
    } else {
      if (user.email === "customer@orbem.com") {
        const initial = [
          { id: "TKT-1002", subject: "Dispatched Manifest Mismatch", description: "Cargo weight does not match the printed shipping certificate.", priority: "High", status: "In Progress" },
          { id: "TKT-1004", subject: "Zone B Shelving Access", description: "Need updated operator clearances for Zone B high-tier shelves.", priority: "Medium", status: "Open" }
        ];
        setTickets(initial);
        localStorage.setItem(key, JSON.stringify(initial));
      } else {
        setTickets([]);
      }
    }
  }

  useEffect(() => {
    fetchDashboardDetails();
    loadSupportTickets();
  }, [role, user?.email]);

  function handleCreateTicket(e) {
    e.preventDefault();
    if (!newTicket.subject.trim() || !newTicket.description.trim()) return;

    const tkt = {
      id: "TKT-" + Math.floor(1000 + Math.random() * 9000),
      subject: newTicket.subject.trim(),
      description: newTicket.description.trim(),
      priority: newTicket.priority,
      status: "Open"
    };

    const updated = [tkt, ...tickets];
    setTickets(updated);
    if (user?.email) {
      localStorage.setItem(`orbem_support_tickets_${user.email}`, JSON.stringify(updated));
    }
    setNewTicket({ subject: "", description: "", priority: "Medium" });
    setTicketModalOpen(false);
    toast.success("Support ticket registered successfully!");
  }

  // Worker task completes
  function handleToggleTask(taskId) {
    const updated = workerTasks.map((t) => {
      if (t.id === taskId) {
        const next = t.status === "Completed" ? "Pending" : "Completed";
        return { ...t, status: next };
      }
      return t;
    });
    setWorkerTasks(updated);
  }

  // Visual widgets datasets
  const monthlyRevenueData = [
    { name: "Jan", Billing: 12000, Capacity: 58 },
    { name: "Feb", Billing: 15400, Capacity: 64 },
    { name: "Mar", Billing: 18900, Capacity: 62 },
    { name: "Apr", Billing: 24300, Capacity: 71 },
    { name: "May", Billing: 29800, Capacity: 75 },
    { name: "Jun", Billing: stats.revenue || 34500, Capacity: 78 }
  ];

  const cargoStatusData = [
    { name: "Stored", value: cargoItems.filter((c) => c.status === "Stored").length || 8, color: "#3b82f6" },
    { name: "Pending", value: cargoItems.filter((c) => c.status === "Pending" || !c.status).length || 5, color: "#f59e0b" },
    { name: "In Transit", value: cargoItems.filter((c) => c.status === "In Transit").length || 4, color: "#6366f1" },
    { name: "Dispatched", value: cargoItems.filter((c) => c.status === "Dispatched").length || 3, color: "#10b981" }
  ];

  return (
    <div className="space-y-8 pb-10 transition-colors duration-300">
      
      {/* Dynamic Role Greeting Banner */}
      <div className="bg-white dark:bg-[#0b1224] border border-slate-100 dark:border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm transition-colors">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <span>Welcome, {user?.name || "Operations Lead"}</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              {role}
            </span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 leading-relaxed">
            Company Terminal: <strong className="text-slate-700 dark:text-slate-300">ORBEM SOLUTIONS Boston Center</strong> | Audited Session active.
          </p>
        </div>

        {role === "Customer" && (
          <button
            onClick={() => setTicketModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-4 py-2.5 text-xs shadow-md transition-colors cursor-pointer"
          >
            <FaLifeRing />
            <span>Open Support Ticket</span>
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1. SUPER ADMIN / ADMIN DASHBOARD STATE */}
      {/* ======================================================== */}
      {(role === "Admin" || role === "Operations Staff") && (
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Global Warehouses"
              value={loading ? "..." : stats.warehouses}
              icon={FaWarehouse}
              iconBg="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
              trend="+2 Zones"
              trendType="up"
            />
            <StatCard
              title="Stocked Cargo Items"
              value={loading ? "..." : stats.cargo}
              icon={FaBox}
              iconBg="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
              trend="+8.4%"
              trendType="up"
            />
            <StatCard
              title="Courier Shipments"
              value={loading ? "..." : stats.shipments}
              icon={FaTruck}
              iconBg="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
              trend="+14.2%"
              trendType="up"
            />
            <StatCard
              title="Audited Operator Users"
              value={loading ? "..." : stats.users}
              icon={FaUsers}
              iconBg="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
              trend="Constant"
              trendType="up"
            />
          </div>

          {/* Charts panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Area Chart */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-2xl shadow-xs lg:col-span-2 flex flex-col justify-between transition-colors">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Invoiced Billings Revenue ($)</h3>
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg">
                  <FaCalendarAlt />
                  <span>Fiscal Monthly</span>
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyRevenueData}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "dark" ? "#334155" : "#f1f5f9"} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Area type="monotone" dataKey="Billing" name="Billed Revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cargo status Pie Chart */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-2xl shadow-xs flex flex-col justify-between transition-colors">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Cargo Status Division</h3>
                <p className="text-slate-400 text-xs mt-1">Status proportions of raw package inventories.</p>
              </div>
              <div className="h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={cargoStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {cargoStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend grid */}
              <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-50 dark:border-slate-700/60 pt-4 mt-2">
                {cargoStatusData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-500 dark:text-slate-400 truncate">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audit trail list */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-2xl shadow-xs transition-colors">
            <div className="flex justify-between items-center mb-6 border-b border-slate-50 dark:border-slate-750 pb-4 text-left">
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <FaHistory className="text-blue-500 text-sm" />
                <span>Real-Time Operational Audit Trail</span>
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800/80">
                {activitiesList.length} recent entries
              </span>
            </div>
            <div className="space-y-4">
              {activitiesList.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No activity logs registered.
                </div>
              ) : (
                activitiesList.map((act) => (
                  <AuditLogItem key={act.id} act={act} />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. WAREHOUSE MANAGER DASHBOARD STATE */}
      {/* ======================================================== */}
      {role === "Warehouse Staff" && user?.email === "manager@orbem.com" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-xl shadow-xs">
              <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Storage Capacity Used</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-800 dark:text-white">78%</h3>
              <div className="h-2 bg-slate-100 dark:bg-slate-900 rounded-full mt-2.5 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: "78%" }} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-xl shadow-xs">
              <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Occupied Layout Zones</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-500">{stats.warehouses - 1} Zones</h3>
              <p className="text-[10px] text-slate-400 mt-1">Zoning slots actively stacked with package weight.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-xl shadow-xs">
              <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Available Zones</p>
              <h3 className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">1 Zone</h3>
              <p className="text-[10px] text-slate-400 mt-1">Seattle North site currently accepts inbound bulk.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Occupancy trends */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-2xl shadow-xs transition-colors">
              <h3 className="font-bold text-slate-800 dark:text-white text-base mb-6">Historical Occupancy Limits</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "dark" ? "#334155" : "#f1f5f9"} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="Capacity" name="Occupancy %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Inbound queue */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-2xl shadow-xs transition-colors">
              <h3 className="font-bold text-slate-800 dark:text-white text-base mb-4">Seattle Intake Queue</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 text-slate-400 uppercase font-bold">
                      <th className="px-4 py-2.5">Cargo Ref</th>
                      <th className="px-4 py-2.5">Zone Address</th>
                      <th className="px-4 py-2.5">Intake Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-600 dark:text-slate-300">
                    {cargoItems.slice(0, 4).map((c) => {
                      const details = parseCargo(c.description);
                      return (
                        <tr key={c.id}>
                          <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">
                            <p className="truncate max-w-[150px]">{details.description}</p>
                            <span className="text-[9px] text-slate-400 font-mono">ID: {String(c.id).slice(0, 6).toUpperCase()}</span>
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {details.warehouse_zone}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold">{c.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. WAREHOUSE WORKER DASHBOARD STATE */}
      {/* ======================================================== */}
      {role === "Warehouse Staff" && user?.email === "worker@orbem.com" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-905 to-slate-950 text-white rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
            <div>
              <h3 className="font-extrabold text-xl">Floor Operator Console</h3>
              <p className="text-slate-400 text-xs mt-1">Scan, check placement shelves, and tick completed assignments.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => alert("Launching Camera scanner simulator")} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-4 py-3 text-xs flex items-center gap-2 transition-transform hover:scale-102 cursor-pointer">
                <FaQrcode />
                <span>Camera Intake Scan</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task list list */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-2xl shadow-xs space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-base border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
                <FaTasks className="text-slate-400" />
                <span>Today's Placement Sheets</span>
              </h3>
              
              <div className="space-y-3">
                {workerTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleToggleTask(t.id)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                      t.status === "Completed"
                        ? "bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/30 text-slate-500 line-through"
                        : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={t.status === "Completed"}
                        onChange={() => {}} // Swapped by div container click
                        className="h-4 w-4 rounded-sm text-emerald-600 focus:ring-emerald-500 border-slate-300 shrink-0"
                      />
                      <div>
                        <p className="text-xs font-bold font-mono tracking-wider text-slate-400">{t.id}</p>
                        <p className="text-xs font-semibold mt-0.5">{t.action}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      t.status === "Completed" ? "bg-emerald-105 text-emerald-700" : "bg-blue-50 text-blue-705"
                    }`}>{t.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Placement instructions */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-2xl shadow-xs space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Zoning Instructions</h3>
              <div className="space-y-3.5 text-xs">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 rounded-r-lg text-slate-705 dark:text-slate-300">
                  <p className="font-bold">Intake Gates protocol</p>
                  <p className="text-slate-400 dark:text-slate-400 mt-1 leading-relaxed">Always check package labels against manifests in document vaults before signing warehouse storage placement.</p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-r-lg text-slate-750 dark:text-slate-300">
                  <p className="font-bold">Heavy weight Alert</p>
                  <p className="text-slate-400 dark:text-slate-400 mt-1 leading-relaxed">All cargo items weighing over 10 Tons must be placed in Ground Row shelves at Seattle Zone A or B.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. DISPATCH MANAGER (PARTNER) DASHBOARD STATE */}
      {/* ======================================================== */}
      {role === "Partner" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <StatCard
              title="Active Deliveries"
              value={shipmentsList.filter((s) => s.status === "In Transit").length || 3}
              icon={FaTruck}
              iconBg="bg-blue-50 dark:bg-blue-900/20 text-blue-600"
            />
            <StatCard
              title="Delayed Shipments"
              value={shipmentsList.filter((s) => s.status === "Delayed").length || 1}
              icon={FaExclamationTriangle}
              iconBg="bg-amber-50 dark:bg-amber-900/20 text-amber-600"
            />
            <StatCard
              title="Scheduled Intake"
              value={shipmentsList.filter((s) => s.status === "Pending").length || 2}
              icon={FaClock}
              iconBg="bg-slate-50 dark:bg-slate-900/20 text-slate-500"
            />
            <StatCard
              title="Completed Routes"
              value={shipmentsList.filter((s) => s.status === "Delivered").length || 5}
              icon={FaCheckCircle}
              iconBg="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Shipment routes list */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-2xl shadow-xs transition-colors">
              <h3 className="font-bold text-slate-800 dark:text-white text-base mb-4">Transit Deliveries List</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 text-slate-400 uppercase font-bold">
                      <th className="px-4 py-2.5">Tracking ID</th>
                      <th className="px-4 py-2.5">Route Coordinates</th>
                      <th className="px-4 py-2.5">Delivery Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-600 dark:text-slate-300">
                    {shipmentsList.slice(0, 5).map((s) => (
                      <tr key={s.id}>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-800 dark:text-white">
                          {String(s.id).slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{s.origin}</span>
                          <span className="text-slate-400 mx-1.5">→</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">{s.destination}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === "Delivered" ? "bg-emerald-50 text-emerald-700" : s.status === "Delayed" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
                          }`}>{s.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Deliveries Trends */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-2xl shadow-xs transition-colors">
              <h3 className="font-bold text-slate-800 dark:text-white text-base mb-6">Dispatch Volume Trends</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "dark" ? "#334155" : "#f1f5f9"} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="Capacity" name="Deliveries" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. CUSTOMER PORTAL VIEW */}
      {/* ======================================================== */}
      {role === "Customer" && (
        <div className="space-y-8">
          {/* Customer Specific widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="My Inbounded Cargo"
              value={cargoItems.length}
              icon={FaBox}
              iconBg="bg-blue-50 dark:bg-blue-900/20 text-blue-600"
            />
            <StatCard
              title="Dispatched Deliveries"
              value={shipmentsList.length}
              icon={FaTruck}
              iconBg="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600"
            />
            <StatCard
              title="Linked Manifests"
              value={cargoItems.length + 1}
              icon={FaUsers}
              iconBg="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
            />
            <StatCard
              title="Support Tickets"
              value={tickets.length}
              icon={FaLifeRing}
              iconBg="bg-amber-50 dark:bg-amber-900/20 text-amber-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cargo directory */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-2xl shadow-xs transition-colors">
              <h3 className="font-bold text-slate-800 dark:text-white text-base mb-4">My Cargo Inventory</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 text-slate-400 uppercase font-bold">
                      <th className="px-4 py-2.5">Cargo Description</th>
                      <th className="px-4 py-2.5">Storage Status</th>
                      <th className="px-4 py-2.5">Check-In Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-400 dark:text-slate-300">
                    {cargoItems.map((c) => {
                      const details = parseCargo(c.description);
                      return (
                        <tr key={c.id}>
                          <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">
                            <p className="truncate max-w-[200px]">{details.description}</p>
                            <span className="text-[9px] text-slate-400 font-mono">Ref ID: {String(c.id).slice(0, 8).toUpperCase()}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              c.status === "Stored" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-blue-50 text-blue-700 border border-blue-100"
                            }`}>{c.status || "Pending"}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {new Date(c.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Support tickets list */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-2xl shadow-xs transition-colors flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base mb-4 flex items-center gap-2">
                  <FaLifeRing className="text-amber-500" />
                  <span>Support Tickets</span>
                </h3>
                
                <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                  {tickets.map((t) => (
                    <div key={t.id} className="p-3 border border-slate-100 dark:border-slate-700 rounded-xl space-y-1 bg-slate-50/50 dark:bg-slate-900/30">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[120px]">{t.subject}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          t.status === "Resolved" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                        }`}>{t.status}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{t.description}</p>
                      <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-50 dark:border-slate-700/40 text-[9px] text-slate-400">
                        <span>ID: {t.id}</span>
                        <span className={`font-semibold ${t.priority === "High" ? "text-red-500" : "text-slate-400"}`}>Priority: {t.priority}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. AUDITOR / ACCOUNTS STAFF DASHBOARD STATE */}
      {/* ======================================================== */}
      {(role === "Auditor" || role === "Accounts Staff") && (
        <div className="space-y-8">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Billed Revenue"
              value={loading ? "..." : `$${stats.revenue.toLocaleString()}`}
              icon={FaFileInvoiceDollar}
              iconBg="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
              trend="Fiscal YTD"
              trendType="up"
            />
            <StatCard
              title="Audit Stocked Cargo"
              value={loading ? "..." : stats.cargo}
              icon={FaBox}
              iconBg="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
              trend="Constant"
              trendType="up"
            />
            <StatCard
              title="Active Shipments Checked"
              value={loading ? "..." : stats.shipments}
              icon={FaTruck}
              iconBg="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
              trend="Verified"
              trendType="up"
            />
            <StatCard
              title="Registered Operators"
              value={loading ? "..." : stats.users}
              icon={FaUsers}
              iconBg="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
              trend="Audited logs"
              trendType="up"
            />
          </div>

          {/* Charts panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Area Chart */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-2xl shadow-xs lg:col-span-2 flex flex-col justify-between transition-colors">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Auditor Billings Ledgers ($)</h3>
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg">
                  <FaCalendarAlt />
                  <span>Fiscal Monthly</span>
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyRevenueData}>
                    <defs>
                      <linearGradient id="revenueGradAud" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "dark" ? "#334155" : "#f1f5f9"} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Area type="monotone" dataKey="Billing" name="Billed Revenue" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGradAud)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cargo status Pie Chart */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-2xl shadow-xs flex flex-col justify-between transition-colors">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Cargo Status Division</h3>
                <p className="text-slate-400 text-xs mt-1">Status proportions of raw package inventories.</p>
              </div>
              <div className="h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={cargoStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {cargoStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend grid */}
              <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-50 dark:border-slate-700/60 pt-4 mt-2">
                {cargoStatusData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-500 dark:text-slate-400 truncate">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl flex items-center gap-4 text-slate-700 dark:text-slate-350">
            <FaShieldAlt className="text-3xl text-blue-600 shrink-0" />
            <div className="text-xs text-left">
              <p className="font-extrabold text-slate-900 dark:text-white text-base">Auditor Compliance Console</p>
              <p className="text-slate-400 mt-1">Audit privileges enabled. Compliance logs and analytics exports are viewable. Modifications are disabled by system policies.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cargo audit list */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-2xl shadow-xs transition-colors">
              <h3 className="font-bold text-slate-800 dark:text-white text-base mb-4">Stock Ledger Compliance Check</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 text-slate-400 uppercase font-bold">
                      <th className="px-4 py-2.5">Cargo Description</th>
                      <th className="px-4 py-2.5">Weight (Tons)</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-400 dark:text-slate-300">
                    {cargoItems.slice(0, 5).map((c) => {
                      const details = parseCargo(c.description);
                      return (
                        <tr key={c.id}>
                          <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">
                            <p className="truncate max-w-[150px]">{details.description}</p>
                            <span className="text-[9px] text-slate-400 font-mono">ID: {String(c.id).slice(0, 8).toUpperCase()}</span>
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold">
                            {details.weight} T
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-705 font-semibold">{c.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audit log list */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-2xl shadow-xs transition-colors">
              <div className="flex justify-between items-center mb-6 border-b border-slate-50 dark:border-slate-750 pb-4 text-left">
                <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                  <FaHistory className="text-blue-500" />
                  <span>Audited Operational Trail</span>
                </h3>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800/80">
                  {activitiesList.length} verified logs
                </span>
              </div>
              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                {activitiesList.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No verified operations logs.
                  </div>
                ) : (
                  activitiesList.map((a) => (
                    <AuditLogItem key={a.id} act={a} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. DOCUMENTATION EXECUTIVE DASHBOARD STATE */}
      {/* ======================================================== */}
      {role === "Documentation Executive" && (
        <div className="space-y-8">
          {/* Documentation Specific widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Vault Documents"
              value={12}
              icon={FaFileAlt}
              iconBg="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            />
            <StatCard
              title="Pending Review Manifests"
              value={3}
              icon={FaClock}
              iconBg="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
            />
            <StatCard
              title="Custom Clearance Certificates"
              value={8}
              icon={FaCheckCircle}
              iconBg="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              title="Intake Cargo Items Linked"
              value={stats.cargo}
              icon={FaBox}
              iconBg="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cargo directory */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-2xl shadow-xs transition-colors">
              <h3 className="font-bold text-slate-800 dark:text-white text-base mb-4">Intake Cargo Documentation Queue</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 text-slate-400 uppercase font-bold">
                      <th className="px-4 py-2.5">Cargo Details</th>
                      <th className="px-4 py-2.5">Document Association</th>
                      <th className="px-4 py-2.5">Clearance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-400 dark:text-slate-350">
                    {cargoItems.slice(0, 5).map((c) => {
                      const details = parseCargo(c.description);
                      return (
                        <tr key={c.id}>
                          <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">
                            <p className="truncate max-w-[200px]">{details.description}</p>
                            <span className="text-[9px] text-slate-400 font-mono">Ref ID: {String(c.id).slice(0, 8).toUpperCase()}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-slate-400 dark:text-slate-300">manifest_{String(c.id).slice(0, 6)}.pdf</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              c.status === "Stored" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-705"
                            }`}>{c.status || "Pending"}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Custom Clearance Instructions */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-2xl shadow-xs space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Customs Compliance Rules</h3>
              <div className="space-y-3.5 text-xs text-left">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 rounded-r-lg text-slate-700 dark:text-slate-300">
                  <p className="font-bold">Bill of Lading Audits</p>
                  <p className="text-slate-400 dark:text-slate-400 mt-1 leading-relaxed">Ensure all imports from non-domestic ports contain fully certified custom clearing manifests before zoning approval.</p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-r-lg text-slate-700 dark:text-slate-300">
                  <p className="font-bold">Digital Archiving</p>
                  <p className="text-slate-400 dark:text-slate-400 mt-1 leading-relaxed">Backup raw custom declarations PDFs directly in Supabase Storage buckets, linking generated URLs within the document vaults.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER CREATE TICKET MODAL */}
      {ticketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md border border-slate-205 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700/60 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-white text-base">Open Customer Support Ticket</h3>
              <button onClick={() => setTicketModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Subject Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shipment manifest file error"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Ticket Description Details *</label>
                <textarea
                  required
                  placeholder="Describe operations issue or compliance query in detail..."
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  rows={4}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Priority Level</label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setTicketModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
                >
                  Open Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;