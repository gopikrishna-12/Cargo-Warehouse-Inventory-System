import { useEffect, useState } from "react";
import { apiService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import toast from "react-hot-toast";
import {
  FaFileCsv,
  FaChartLine,
  FaTruck,
  FaBoxOpen,
  FaFileInvoiceDollar,
  FaPrint,
  FaCalendarAlt,
  FaHistory,
  FaSpinner,
  FaBan
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

function Reports() {
  const { role, permissions } = useAuth();
  const { theme } = useTheme();
  
  const isDark = theme === "dark";
  const axisColor = isDark ? "#64748b" : "#94a3b8";
  const gridColor = isDark ? "#334155" : "#f1f5f9";
  const tooltipStyle = isDark 
    ? { backgroundColor: "#1e293b", borderColor: "#475569", color: "#fff" } 
    : undefined;

  // Access control
  const canViewReports = permissions?.viewReports;

  // Stats
  const [dataCounts, setDataCounts] = useState({
    cargo: 0,
    shipments: 0,
    invoices: 0,
    invoiceTotal: 0
  });
  const [invoicesList, setInvoicesList] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchReportData() {
    try {
      setLoading(true);
      
      const statsData = await apiService.getDashboardStats();
      const stats = statsData.stats || {};
      const invoices = statsData.invoices || [];

      setDataCounts({
        cargo: stats.cargoCount || 0,
        shipments: stats.shipmentCount || 0,
        invoices: invoices.length,
        invoiceTotal: stats.revenue || 0
      });
      setInvoicesList(invoices);

    } catch (e) {
      toast.error("Failed to load WMS analytics: " + e.message);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canViewReports) {
      fetchReportData();
    }
  }, [canViewReports]);

  // Monthly statistics throughput metrics
  const monthlyData = [
    { name: "Jan", CargoStored: 45, ShipmentsHandled: 24, Revenue: 12000 },
    { name: "Feb", CargoStored: 55, ShipmentsHandled: 30, Revenue: 15400 },
    { name: "Mar", CargoStored: 68, ShipmentsHandled: 42, Revenue: 18900 },
    { name: "Apr", CargoStored: 82, ShipmentsHandled: 55, Revenue: 24300 },
    { name: "May", CargoStored: 95, ShipmentsHandled: 64, Revenue: 29800 },
    { name: "Jun", CargoStored: 110, ShipmentsHandled: 78, Revenue: 34500 }
  ];

  async function exportTableToCSV(table, fileName) {
    try {
      toast.loading(`Querying ${table} and compiling CSV...`, { id: "csvExport" });
      const data = await apiService.getExportData(table);
      
      if (!data || data.length === 0) {
        toast.error(`No rows exist in table ${table} to compile CSV.`, { id: "csvExport" });
        return;
      }

      // Convert JSON to CSV
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(","),
        ...data.map(row => 
          headers.map(fieldName => {
            const val = row[fieldName];
            return typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val;
          }).join(",")
        )
      ];
      
      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${fileName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV download started successfully!", { id: "csvExport" });
    } catch (error) {
      toast.error("CSV Export error: " + error.message, { id: "csvExport" });
    }
  }

  if (!canViewReports) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center text-center space-y-4">
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-full">
          <FaBan className="text-4xl" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Reports Area Restricted</h2>
        <p className="text-slate-500 dark:text-slate-455 max-w-sm text-sm">
          Your role configuration ({role}) does not have permissions to access financial ledgers and spreadsheet exports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 transition-colors duration-300">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Operational Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Download statistics summaries, trace logistical workflows, and export spreadsheets.</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs shadow-xs transition-colors cursor-pointer"
        >
          <FaPrint />
          <span>Print Summary</span>
        </button>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-6 flex items-center justify-between shadow-xs transition-colors">
          <div>
            <p className="text-slate-400 dark:text-slate-500 text-xs uppercase font-bold tracking-wider">Cargo Registered</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">{loading ? "..." : dataCounts.cargo}</h3>
          </div>
          <div className="p-3.5 bg-blue-50 dark:bg-blue-900/25 text-blue-650 dark:text-blue-450 rounded-xl">
            <FaBoxOpen className="text-xl" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-6 flex items-center justify-between shadow-xs transition-colors">
          <div>
            <p className="text-slate-400 dark:text-slate-500 text-xs uppercase font-bold tracking-wider">Shipments Logged</p>
            <h3 className="text-2xl font-extrabold text-slate-805 dark:text-white mt-1">{loading ? "..." : dataCounts.shipments}</h3>
          </div>
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-900/25 text-indigo-650 dark:text-indigo-455 rounded-xl">
            <FaTruck className="text-xl" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-6 flex items-center justify-between shadow-xs transition-colors">
          <div>
            <p className="text-slate-400 dark:text-slate-500 text-xs uppercase font-bold tracking-wider">Invoice Revenue Billed</p>
            <h3 className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-450 mt-1">
              {loading ? "..." : `$${dataCounts.invoiceTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            </h3>
          </div>
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-900/25 text-emerald-650 dark:text-emerald-450 rounded-xl">
            <FaFileInvoiceDollar className="text-xl" />
          </div>
        </div>
      </div>

      {/* Dual Graphs Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Storage Flow bar graph */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-6 shadow-xs transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-slate-800 dark:text-white text-base flex items-center gap-2">
              <FaBoxOpen className="text-blue-500" />
              <span>Logistics Cargo Flow & Tonnage</span>
            </h3>
            <span className="text-xs text-slate-550 dark:text-slate-400 font-semibold flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg">
              <FaCalendarAlt />
              <span>Throughput</span>
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" stroke={axisColor} fontSize={11} tickLine={false} />
                <YAxis stroke={axisColor} fontSize={11} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="CargoStored" name="Cargo Stored (Tons)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ShipmentsHandled" name="Shipments Dispatched" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Billing revenue line graph */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-6 shadow-xs transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-slate-800 dark:text-white text-base flex items-center gap-2">
              <FaChartLine className="text-emerald-500" />
              <span>Monthly Invoiced Billings ($)</span>
            </h3>
            <span className="text-xs text-slate-550 dark:text-slate-400 font-semibold flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg">
              <FaCalendarAlt />
              <span>Monthly Trend</span>
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" stroke={axisColor} fontSize={11} tickLine={false} />
                <YAxis stroke={axisColor} fontSize={11} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Line type="monotone" dataKey="Revenue" name="Billed Revenue ($)" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ledger and export panels row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export panel */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-6 shadow-xs transition-colors flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white text-base mb-2">Spreadsheet Exports</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-6">
              Select database tables to export spreadsheet formats conforming to RFC 4180.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => exportTableToCSV("cargo", "Cargo_Inventory_WMS")}
                className="w-full inline-flex items-center justify-between border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FaFileCsv className="text-emerald-500 text-lg" />
                  <span>Cargo Inventory</span>
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Download</span>
              </button>

              <button 
                onClick={() => exportTableToCSV("shipments", "Shipments_Tracker_WMS")}
                className="w-full inline-flex items-center justify-between border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FaFileCsv className="text-emerald-500 text-lg" />
                  <span>Shipment Logs</span>
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Download</span>
              </button>

              <button 
                onClick={() => exportTableToCSV("customers", "Customers_Directory_WMS")}
                className="w-full inline-flex items-center justify-between border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FaFileCsv className="text-emerald-500 text-lg" />
                  <span>Customer Directory</span>
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Download</span>
              </button>

              <button 
                onClick={() => exportTableToCSV("invoices", "Financial_Ledger_WMS")}
                className="w-full inline-flex items-center justify-between border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FaFileCsv className="text-emerald-500 text-lg" />
                  <span>Billing Invoices</span>
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Download</span>
              </button>
            </div>
          </div>
          <div className="text-slate-400 dark:text-slate-500 text-[10px] text-center mt-6">
            CSV formats conform to RFC 4180 standards.
          </div>
        </div>

        {/* Live Invoices list */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-6 shadow-xs transition-colors lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white text-base mb-4 flex items-center gap-2">
              <FaHistory className="text-slate-400 dark:text-slate-500" />
              <span>Billing Invoice Ledger</span>
            </h3>
            <div className="overflow-x-auto max-h-64">
              {loading ? (
                <div className="flex justify-center items-center h-20">
                  <FaSpinner className="animate-spin text-2xl text-blue-600" />
                </div>
              ) : invoicesList.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">No invoices logged in database.</p>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-slate-700">
                      <th className="px-4 py-2">Invoice No</th>
                      <th className="px-4 py-2">Customer Client</th>
                      <th className="px-4 py-2">Due Date</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/60 text-slate-650 dark:text-slate-350">
                    {invoicesList.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-755/50 transition-colors">
                        <td className="px-4 py-2.5 font-mono font-semibold uppercase text-slate-800 dark:text-white">
                          {invoice.invoice_number}
                        </td>
                        <td className="px-4 py-2.5 truncate max-w-[150px] font-medium text-slate-800 dark:text-slate-200">
                          {invoice.customers?.company_name || <span className="text-slate-400 italic">None</span>}
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 dark:text-slate-500">
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-emerald-700 dark:text-emerald-450">
                          ${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;