import { useEffect, useState } from "react";
import { apiService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  FaUsers,
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaSearch,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrashAlt,
  FaTimes,
  FaBoxOpen,
  FaFileInvoiceDollar,
  FaChevronRight,
  FaHistory,
  FaSpinner,
  FaCalendarAlt,
  FaCoins
} from "react-icons/fa";

// Helper to parse cargo details serialized into description column
function parseCargo(raw) {
  try {
    const data = JSON.parse(raw);
    return {
      description: data.text || data.description || "Logistics Package",
      weight: data.weight || 0,
      quantity: data.quantity || 0,
      warehouse_zone: data.warehouse_zone || "Zone A",
      arrival_date: data.arrival_date || ""
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

function Customers() {
  const { role, permissions } = useAuth();
  const canModify = ["Super Admin", "Admin"].includes(role);

  // Main states
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Detail ledger states
  const [cargoHistory, setCargoHistory] = useState([]);
  const [invoiceHistory, setInvoiceHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Modals control
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Selection
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    company_name: "",
    email: "",
    phone: "",
    address: "",
  });

  // Invoice generator state
  const [invoiceData, setInvoiceData] = useState({
    amount: 1500,
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      setLoading(true);
      const data = await apiService.getCustomers();
      setCustomers(data || []);
    } catch (e) {
      toast.error("Failed to load customer directory: " + e.message);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Fetch detailed history for a selected customer
  async function fetchCustomerHistory(customerId) {
    try {
      setHistoryLoading(true);
      
      const history = await apiService.getCustomerHistory(customerId);
      setCargoHistory(history.cargoHistory || []);
      setInvoiceHistory(history.invoiceHistory || []);

    } catch (e) {
      toast.error("Failed to load customer operations ledger: " + e.message);
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  }

  // Add Customer
  async function handleAddCustomer(e) {
    e.preventDefault();
    if (!canModify) {
      toast.error("Unauthorized action blocked.");
      return;
    }
    if (!formData.company_name.trim() || !formData.email.trim()) {
      toast.error("Company Name and Email are required.");
      return;
    }

    try {
      setLoading(true);
      await apiService.createCustomer({
        company_name: formData.company_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
      });

      toast.success("Customer client registered successfully!");
      setAddModalOpen(false);
      resetForm();
      fetchCustomers();
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      toast.error("Failed to register customer: " + msg);
    } finally {
      setLoading(false);
    }
  }

  // Edit Customer
  async function handleEditCustomer(e) {
    e.preventDefault();
    if (!canModify) {
      toast.error("Unauthorized action blocked.");
      return;
    }
    if (!formData.company_name.trim() || !formData.email.trim()) {
      toast.error("Company Name and Email are required.");
      return;
    }

    try {
      setLoading(true);
      await apiService.updateCustomer(selectedCustomer.id, {
        company_name: formData.company_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
      });

      toast.success("Customer profile updated successfully!");
      setEditModalOpen(false);
      resetForm();
      fetchCustomers();
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      toast.error("Failed to update customer: " + msg);
    } finally {
      setLoading(false);
    }
  }

  // Delete Customer
  async function handleDeleteCustomer() {
    if (!canModify) {
      toast.error("Unauthorized action blocked.");
      return;
    }
    try {
      setLoading(true);
      await apiService.deleteCustomer(selectedCustomer.id);

      toast.success("Customer client removed from database.");
      setDeleteModalOpen(false);
      fetchCustomers();
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      toast.error("Failed to remove customer: " + msg);
    } finally {
      setLoading(false);
    }
  }

  // Generate Invoices directly from client detail ledger
  async function handleGenerateInvoice(e) {
    e.preventDefault();
    if (!canModify) {
      toast.error("Unauthorized billing actions.");
      return;
    }
    if (!invoiceData.amount || invoiceData.amount <= 0) {
      toast.error("Provide a valid billing amount.");
      return;
    }

    try {
      await apiService.createInvoice(selectedCustomer.id, {
        amount: parseFloat(invoiceData.amount),
        due_date: invoiceData.due_date
      });

      toast.success(`Billing invoice issued and logged!`);
      // Reload history ledger
      fetchCustomerHistory(selectedCustomer.id);
      // Reset invoice values
      setInvoiceData({
        amount: 1500,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      });
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      toast.error("Billing failure: " + msg);
    }
  }

  function openEditModal(customer) {
    setSelectedCustomer(customer);
    setFormData({
      company_name: customer.company_name,
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });
    setEditModalOpen(true);
  }

  function openDeleteModal(customer) {
    setSelectedCustomer(customer);
    setDeleteModalOpen(true);
  }

  function openDetailsModal(customer) {
    setSelectedCustomer(customer);
    fetchCustomerHistory(customer.id);
    setDetailsModalOpen(true);
  }

  function resetForm() {
    setFormData({
      company_name: "",
      email: "",
      phone: "",
      address: "",
    });
    setSelectedCustomer(null);
  }

  // Client-side search matching
  const filteredCustomers = customers.filter(c =>
    c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  return (
    <div className="space-y-6 transition-colors duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Customer Directory</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage client shipping accounts, query cargo histories, and issue financial billing invoices.</p>
        </div>

        {canModify && (
          <button
            onClick={() => {
              resetForm();
              setAddModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-4 py-2.5 text-sm shadow-xs transition-colors cursor-pointer"
          >
            <FaPlus />
            <span>Add Customer</span>
          </button>
        )}
      </div>

      {/* Search Input bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 shadow-xs transition-colors">
        <div className="relative w-full">
          <FaSearch className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search customers by company, email, or contact phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-105 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Customers Cards list */}
      {loading && customers.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-3xl text-blue-600" />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-8 text-center shadow-xs">
          <FaUsers className="mx-auto text-4xl text-slate-350 dark:text-slate-550 mb-3" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">No customers found</h3>
          <p className="text-slate-400 dark:text-slate-455 text-sm mt-1">Try refining search parameters or register a new client company.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/25 text-blue-650 dark:text-blue-450 rounded-xl">
                      <FaBuilding className="text-xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-850 dark:text-white text-lg leading-tight truncate max-w-[160px]">{customer.company_name}</h3>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Ref: {String(customer.id).slice(0, 8).toUpperCase()}</span>
                    </div>
                  </div>

                  {canModify && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(customer)}
                        className="p-2 bg-slate-50 dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-955/30 text-slate-500 hover:text-amber-600 rounded-lg transition-colors cursor-pointer"
                        title="Edit Customer"
                      >
                        <FaEdit className="text-xs" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(customer)}
                        className="p-2 bg-slate-50 dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-955/30 text-slate-500 hover:text-red-650 rounded-lg transition-colors cursor-pointer"
                        title="Delete Customer"
                      >
                        <FaTrashAlt className="text-xs" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2.5 border-t border-slate-50 dark:border-slate-700/60 pt-4 text-xs text-slate-655 dark:text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <FaEnvelope className="text-slate-400 shrink-0" />
                    <a href={`mailto:${customer.email}`} className="hover:text-blue-600 dark:hover:text-blue-400 truncate">{customer.email || "No email info"}</a>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <FaPhone className="text-slate-400 shrink-0" />
                    <a href={`tel:${customer.phone}`} className="hover:text-blue-600 dark:hover:text-blue-400">{customer.phone || "No contact info"}</a>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <FaMapMarkerAlt className="text-slate-400 shrink-0" />
                    <span className="truncate">{customer.address || "No address listed"}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-50 dark:border-slate-700/60 pt-3 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Created: {new Date(customer.created_at).toLocaleDateString()}</span>
                <button
                  onClick={() => openDetailsModal(customer)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-450 hover:text-blue-700 dark:hover:text-blue-400 cursor-pointer"
                >
                  <span>Operations Ledger</span>
                  <FaChevronRight className="text-[10px]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CUSTOMER DETAILS & LOGS HISTORY MODAL */}
      {detailsModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-4xl border border-slate-150 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <FaHistory className="text-blue-600 dark:text-blue-450 text-lg" />
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">{selectedCustomer.company_name}</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">ID: {selectedCustomer.id}</p>
                </div>
              </div>
              <button onClick={() => setDetailsModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer">
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Historical Cargo Log */}
                <div className="space-y-3 lg:col-span-1">
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2 border-b border-slate-105 dark:border-slate-700 pb-2">
                    <FaBoxOpen className="text-blue-500" />
                    <span>Inbounded Cargo Log</span>
                  </h4>
                  {historyLoading ? (
                    <p className="text-xs text-slate-400 py-4"><FaSpinner className="animate-spin text-blue-600 inline mr-1" />Loading cargo...</p>
                  ) : cargoHistory.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 py-4 italic">No cargo intaken for this customer.</p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto border border-slate-100 dark:border-slate-700 rounded-lg overflow-hidden transition-colors">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-slate-700">
                            <th className="px-3 py-2">Details</th>
                            <th className="px-3 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/60 text-slate-650 dark:text-slate-300">
                          {cargoHistory.map((cargo) => {
                            const details = parseCargo(cargo.description);
                            return (
                              <tr key={cargo.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-755/50 transition-colors">
                                <td className="px-3 py-2">
                                  <p className="font-semibold text-slate-850 dark:text-white truncate max-w-[140px]">{details.description}</p>
                                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Date: {new Date(cargo.created_at).toLocaleDateString()}</span>
                                </td>
                                <td className="px-3 py-2">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    cargo.status === "Stored"
                                      ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30"
                                      : "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30"
                                  }`}>
                                    {cargo.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 2. Billing Invoice Ledger */}
                <div className="space-y-3 lg:col-span-1">
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2 border-b border-slate-105 dark:border-slate-700 pb-2">
                    <FaFileInvoiceDollar className="text-emerald-600" />
                    <span>Invoice Billings Ledger</span>
                  </h4>
                  {historyLoading ? (
                    <p className="text-xs text-slate-400 py-4"><FaSpinner className="animate-spin text-blue-600 inline mr-1" />Loading ledger...</p>
                  ) : invoiceHistory.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 py-4 italic">No invoices billed to this customer.</p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto border border-slate-100 dark:border-slate-700 rounded-lg overflow-hidden transition-colors">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-slate-700">
                            <th className="px-3 py-2">Invoice No</th>
                            <th className="px-3 py-2">Amount</th>
                            <th className="px-3 py-2">Due Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/60 text-slate-650 dark:text-slate-300">
                          {invoiceHistory.map((invoice) => (
                            <tr key={invoice.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-755/50 transition-colors">
                              <td className="px-3 py-2 font-mono text-slate-800 dark:text-white font-semibold uppercase">
                                {invoice.invoice_number}
                              </td>
                              <td className="px-3 py-2 font-semibold text-emerald-700 dark:text-emerald-400">
                                ${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-3 py-2 text-slate-400 dark:text-slate-500 text-[10px]">
                                {new Date(invoice.due_date).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 3. Issue New Invoice Panel (Admins only) */}
                <div className="space-y-3 lg:col-span-1">
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2 border-b border-slate-105 dark:border-slate-700 pb-2">
                    <FaCoins className="text-amber-500" />
                    <span>Issue New Billing Invoice</span>
                  </h4>
                  
                  {canModify ? (
                    <form onSubmit={handleGenerateInvoice} className="bg-slate-50 dark:bg-slate-900 p-4 border border-slate-150 dark:border-slate-700/60 rounded-xl space-y-4 transition-colors">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Billed Amount ($) *</label>
                        <input
                          type="number"
                          required
                          value={invoiceData.amount}
                          onChange={(e) => setInvoiceData({ ...invoiceData, amount: parseFloat(e.target.value) })}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-205 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Due Date *</label>
                        <input
                          type="date"
                          required
                          value={invoiceData.due_date}
                          onChange={(e) => setInvoiceData({ ...invoiceData, due_date: e.target.value })}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-205 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-3 py-2 text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <FaPlus className="text-[10px]" />
                        <span>Issue Invoice Receipt</span>
                      </button>
                    </form>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border border-dashed border-slate-200 dark:border-slate-750 rounded-xl text-center text-xs text-slate-400 py-8">
                      Billing tools are locked. Only administrative roles can issue new cargo invoices.
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-650 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER CUSTOMER MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md border border-slate-150 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-white text-base">Register Customer Client</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zenith Shipping Logistics"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. operations@zenith.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Contact Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +1 (555) 902-1234"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Billing Address</label>
                <input
                  type="text"
                  placeholder="e.g. 100 Portway blvd, New Jersey, NJ"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-555"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-50 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
                >
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {editModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md border border-slate-150 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-white text-base">Edit Customer Client</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleEditCustomer} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Contact Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-808 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Billing Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-808 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-50 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
                >
                  Save Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CUSTOMER MODAL */}
      {deleteModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md border border-slate-150 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-white text-base">Confirm Deletion</h3>
              <button onClick={() => setDeleteModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer">
                <FaTimes />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-655 dark:text-slate-400 leading-normal">
                Are you sure you want to remove customer client <strong className="text-slate-850 dark:text-white">{selectedCustomer.company_name}</strong>?
                This operation is permanent. All historical cargo intakes and invoices linked to this customer reference will be orphaned.
              </p>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCustomer}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer"
                >
                  Delete Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;