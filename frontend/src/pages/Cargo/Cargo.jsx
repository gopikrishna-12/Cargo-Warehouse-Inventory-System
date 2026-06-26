import { useEffect, useState } from "react";
import { apiService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  FaBox,
  FaSearch,
  FaFilter,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrashAlt,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaMapMarkerAlt,
  FaUser,
  FaWarehouse,
  FaCalendarAlt,
  FaWeight,
  FaBoxes,
  FaCheckCircle,
  FaTruck,
  FaClipboardCheck,
  FaSpinner
} from "react-icons/fa";

// Helper to serialize cargo properties to description column
function serializeCargoDesc(text, weight, qty, zone, arrival) {
  return JSON.stringify({
    text: text || "Logistics Cargo",
    weight: Number(weight) || 1.0,
    quantity: Number(qty) || 1,
    warehouse_zone: zone || "Zone A",
    arrival_date: arrival || new Date().toISOString().split("T")[0]
  });
}

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

function Cargo() {
  const { user, role, permissions } = useAuth();

  // Main states
  const [cargoList, setCargoList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [warehouseZones, setWarehouseZones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Selection
  const [selectedCargo, setSelectedCargo] = useState(null);

  // Form states (extended fields)
  const [formData, setFormData] = useState({
    description: "",
    weight: 1.5,
    quantity: 100,
    warehouse_zone: "",
    status: "Pending",
    customer_id: "",
    arrival_date: new Date().toISOString().split("T")[0]
  });

  useEffect(() => {
    if (role) {
      fetchData();
    }
  }, [role]);

  async function fetchData() {
    try {
      setLoading(true);
      
      const cargoData = await apiService.getCargo();
      setCargoList(cargoData || []);

      // Fetch customers list only if user role has permissions to access customer directory
      if (["Admin", "Operations Staff", "Accounts Staff"].includes(role)) {
        const customerData = await apiService.getCustomers();
        setCustomers(customerData || []);
      }

      const whData = await apiService.getWarehouses();
      setWarehouseZones(whData || []);

    } catch (e) {
      toast.error("Failed to load cargo records: " + e.message);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Add Cargo
  async function handleAddCargo(e) {
    e.preventDefault();
    if (permissions.isReadOnly) {
      toast.error("Auditor has read-only access. Actions blocked.");
      return;
    }
    if (!formData.description.trim() || !formData.customer_id || !formData.warehouse_zone) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      
      // Serialize details to description column
      const serializedDesc = serializeCargoDesc(
        formData.description.trim(),
        formData.weight,
        formData.quantity,
        formData.warehouse_zone,
        formData.arrival_date
      );

      await apiService.createCargo({
        description: serializedDesc,
        status: formData.status,
        customer_id: formData.customer_id
      });

      toast.success("New cargo intaken and logged successfully!");
      setAddModalOpen(false);
      
      // Determine the customer profile for the report (either the logged-in Customer or the selected customer for Admin/Staff)
      let reportCustomer = user;
      if (role !== "Customer") {
        reportCustomer = customers.find(c => String(c.id) === String(formData.customer_id)) || user;
      }
      
      resetForm();
      fetchData();

      // Automatically generate professional WMS manifest receipt PDF for the customer
      try {
        const [cargoData, shipmentsData, statsData] = await Promise.all([
          apiService.getCargo(),
          apiService.getShipments(),
          apiService.getDashboardStats()
        ]);
        const { generateOrbemReport } = await import("../../utils/reportGenerator");
        generateOrbemReport(reportCustomer, cargoData, shipmentsData, statsData.invoices || []);
      } catch (reportErr) {
        console.error("Auto-report generation failed:", reportErr);
      }
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      toast.error("Intake scanner failed: " + msg);
    } finally {
      setLoading(false);
    }
  }

  // Edit Cargo
  async function handleEditCargo(e) {
    e.preventDefault();
    if (permissions.isReadOnly) {
      toast.error("Auditor has read-only access. Actions blocked.");
      return;
    }
    if (!formData.description.trim() || !formData.customer_id || !formData.warehouse_zone) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      
      // Serialize details
      const serializedDesc = serializeCargoDesc(
        formData.description.trim(),
        formData.weight,
        formData.quantity,
        formData.warehouse_zone,
        formData.arrival_date
      );

      await apiService.updateCargo(selectedCargo.id, {
        description: serializedDesc,
        status: formData.status,
        customer_id: formData.customer_id
      });

      toast.success("Cargo specifications updated successfully!");
      setEditModalOpen(false);
      resetForm();
      fetchData();
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      toast.error("Update failed: " + msg);
    } finally {
      setLoading(false);
    }
  }

  // Delete Cargo
  async function handleDeleteCargo() {
    if (permissions.isReadOnly) {
      toast.error("Auditor has read-only access. Actions blocked.");
      return;
    }
    try {
      setLoading(true);
      await apiService.deleteCargo(selectedCargo.id);

      toast.success("Cargo record decommissioned successfully.");
      setDeleteModalOpen(false);
      fetchData();
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      toast.error("Failed to delete cargo: " + msg);
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(cargo) {
    const details = parseCargo(cargo.description);
    setSelectedCargo(cargo);
    setFormData({
      description: details.description,
      weight: details.weight,
      quantity: details.quantity,
      warehouse_zone: details.warehouse_zone,
      status: cargo.status,
      customer_id: cargo.customer_id,
      arrival_date: details.arrival_date
    });
    setEditModalOpen(true);
  }

  function openDeleteModal(cargo) {
    setSelectedCargo(cargo);
    setDeleteModalOpen(true);
  }

  function openDetailsModal(cargo) {
    setSelectedCargo(cargo);
    setDetailsModalOpen(true);
  }

  function resetForm() {
    setFormData({
      description: "",
      weight: 1.5,
      quantity: 100,
      warehouse_zone: warehouseZones[0]?.address || "Zone A",
      status: "Pending",
      customer_id: "",
      arrival_date: new Date().toISOString().split("T")[0]
    });
    setSelectedCargo(null);
  }

  // Filter and search
  const filteredCargo = cargoList.filter((item) => {
    if (role === "Customer") {
      const companyName = item.customers?.company_name?.toLowerCase() || "";
      const userPrefix = user?.email ? user.email.split("@")[0].toLowerCase() : "";
      if (!companyName.includes("zenith") && (userPrefix && !companyName.includes(userPrefix))) {
        return false;
      }
    }

    const details = parseCargo(item.description);
    const matchesSearch = 
      details.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      details.warehouse_zone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.id)?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCargo.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCargo.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Determine visual step for timeline stepper
  function getTimelineStep(status) {
    switch (status) {
      case "Pending":
        return 0;
      case "Inspected":
        return 1;
      case "Stored":
        return 2;
      case "Ready for Dispatch":
        return 3;
      case "Dispatched":
        return 4;
      case "Delivered":
        return 5;
      default:
        return 0;
    }
  }

  return (
    <div className="space-y-6 transition-colors duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Cargo Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Register new warehouse cargo, adjust package profiles, and trigger dispatch timelines.</p>
        </div>
        
        {!permissions.isReadOnly && (
          <button
            onClick={() => {
              resetForm();
              setAddModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-4 py-2.5 text-sm shadow-xs transition-colors cursor-pointer"
          >
            <FaPlus />
            <span>Check In Cargo</span>
          </button>
        )}
      </div>

      {/* Search & Filters Controls */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 shadow-xs rounded-xl flex flex-col md:flex-row items-center gap-4 transition-colors">
        <div className="relative w-full md:flex-1">
          <FaSearch className="absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search cargo by description, warehouse zone, or ID ref..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <FaFilter className="text-slate-400 text-sm" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full md:w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-850 dark:text-slate-100 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Storage Status</option>
            <option value="Pending">Pending Intake</option>
            <option value="Inspected">Inspected</option>
            <option value="Stored">Stored in Zone</option>
            <option value="Ready for Dispatch">Ready for Dispatch</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Main Records Table */}
      {loading && cargoList.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-3xl text-blue-600" />
        </div>
      ) : filteredCargo.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-8 text-center shadow-xs rounded-xl">
          <FaBox className="mx-auto text-4xl text-slate-350 dark:text-slate-500 mb-3" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">No cargo items found</h3>
          <p className="text-slate-400 dark:text-slate-450 text-sm mt-1">Try matching other search query values or register a new cargo intake.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xs rounded-xl overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase border-b border-slate-100 dark:border-slate-700">
                  <th className="px-6 py-4">Ref ID</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Metrics (Weight / Qty)</th>
                  <th className="px-6 py-4">Zoning Location</th>
                  <th className="px-6 py-4">Storage Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm text-slate-650 dark:text-slate-300">
                {currentItems.map((item) => {
                  const details = parseCargo(item.description);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-755/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-400 dark:text-slate-500">
                        {String(item.id).slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-850 dark:text-white max-w-xs truncate">
                        <p className="truncate">{details.description}</p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Owner: {item.customers?.company_name || "Unassigned"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-xs">
                          <span className="font-semibold text-slate-750 dark:text-slate-205">{details.weight} Tons</span>
                          <span className="text-slate-400 dark:text-slate-500">{details.quantity} Units</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          <FaMapMarkerAlt className="text-slate-400 text-xs shrink-0" />
                          <span className="truncate max-w-[150px]">{details.warehouse_zone}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-block border ${
                          item.status === "Stored"
                            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
                            : item.status === "In Transit"
                            ? "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/30"
                            : item.status === "Dispatched" || item.status === "Delivered"
                            ? "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                            : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30"
                        }`}>
                          {item.status || "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openDetailsModal(item)}
                            className="p-2 bg-slate-50 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-955/30 text-slate-650 dark:text-slate-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                            title="View Lifecycle Timeline"
                          >
                            <FaEye />
                          </button>
                          
                          {!permissions.isReadOnly && (
                            <>
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-2 bg-slate-50 dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-955/30 text-slate-655 dark:text-slate-400 hover:text-amber-600 rounded-lg transition-colors cursor-pointer"
                                title="Edit Cargo Specifications"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => openDeleteModal(item)}
                                className="p-2 bg-slate-50 dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-955/30 text-slate-655 dark:text-slate-400 hover:text-red-650 rounded-lg transition-colors cursor-pointer"
                                title="Delete Cargo"
                              >
                                <FaTrashAlt />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCargo.length)} of {filteredCargo.length} items
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                >
                  <FaChevronLeft className="text-xs" />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`h-8 w-8 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                      currentPage === i + 1
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                >
                  <FaChevronRight className="text-xs" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE CARGO MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg border border-slate-150 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-white text-base">Check In New Cargo</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddCargo} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Customer Owner *</label>
                <select
                  required
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-850 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Select a Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Cargo Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Raw Material Batch A, Plastic Units"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Weight (Tons) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Quantity (Units) *</label>
                  <input
                    type="number"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Warehouse Zone *</label>
                  <select
                    required
                    value={formData.warehouse_zone}
                    onChange={(e) => setFormData({ ...formData, warehouse_zone: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-850 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">Select storage zone</option>
                    {warehouseZones.map((z) => (
                      <option key={z.id} value={z.address}>{z.address}</option>
                    ))}
                    {warehouseZones.length === 0 && <option value="Zone A">Zone A (Seattle WH)</option>}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Arrival Intake Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.arrival_date}
                    onChange={(e) => setFormData({ ...formData, arrival_date: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Intake Storage Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-850 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Pending">Pending Intake</option>
                  <option value="Inspected">Inspected</option>
                  <option value="Stored">Stored in Zone</option>
                  <option value="Ready for Dispatch">Ready for Dispatch</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="Delivered">Delivered</option>
                </select>
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
                  Confirm Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CARGO MODAL */}
      {editModalOpen && selectedCargo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg border border-slate-150 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-white text-base">Edit Cargo Specifications</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleEditCargo} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Customer Owner *</label>
                <select
                  required
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-850 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Cargo Description *</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-805 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Weight (Tons) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Quantity (Units) *</label>
                  <input
                    type="number"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Warehouse Zone *</label>
                  <select
                    required
                    value={formData.warehouse_zone}
                    onChange={(e) => setFormData({ ...formData, warehouse_zone: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-850 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {warehouseZones.map((z) => (
                      <option key={z.id} value={z.address}>{z.address}</option>
                    ))}
                    {warehouseZones.length === 0 && <option value="Zone A">Zone A</option>}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Arrival Intake Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.arrival_date}
                    onChange={(e) => setFormData({ ...formData, arrival_date: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Storage Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-850 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Pending">Pending Intake</option>
                  <option value="Inspected">Inspected</option>
                  <option value="Stored">Stored in Zone</option>
                  <option value="Ready for Dispatch">Ready for Dispatch</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="Delivered">Delivered</option>
                </select>
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

      {/* VIEW CARGO DETAILS & VISUAL LIFE TIMELINE */}
      {detailsModalOpen && selectedCargo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg border border-slate-150 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-white text-base">Cargo Operation Lifecycle</h3>
              <button onClick={() => setDetailsModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">
                <FaTimes />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Stepper Timeline UI */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block text-center">Lifecycle Progress</h4>
                
                <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-700 ml-4 space-y-6">
                  {/* Step 1: Received */}
                  <div className="relative text-xs">
                    <span className={`absolute -left-8.5 top-0.5 h-5 w-5 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-[9px] font-bold ${
                      getTimelineStep(selectedCargo.status) >= 0 ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                    }`}>
                      {getTimelineStep(selectedCargo.status) >= 0 ? "✓" : "1"}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">Received</p>
                      <p className="text-slate-455 dark:text-slate-450 mt-0.5 text-[10px]">Intake scanner checked cargo at warehouse docks.</p>
                    </div>
                  </div>

                  {/* Step 2: Inspected */}
                  <div className="relative text-xs">
                    <span className={`absolute -left-8.5 top-0.5 h-5 w-5 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-[9px] font-bold ${
                      getTimelineStep(selectedCargo.status) >= 1 ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                    }`}>
                      {getTimelineStep(selectedCargo.status) >= 1 ? "✓" : "2"}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">Inspected</p>
                      <p className="text-slate-455 dark:text-slate-455 mt-0.5 text-[10px]">Quality control checked weight packaging, sorting safety markers.</p>
                    </div>
                  </div>

                  {/* Step 3: Stored */}
                  <div className="relative text-xs">
                    <span className={`absolute -left-8.5 top-0.5 h-5 w-5 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-[9px] font-bold ${
                      getTimelineStep(selectedCargo.status) >= 2 ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                    }`}>
                      {getTimelineStep(selectedCargo.status) >= 2 ? "✓" : "3"}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">Stored</p>
                      <p className="text-slate-455 dark:text-slate-455 mt-0.5 text-[10px]">Floor operator confirms shelf placement allocations.</p>
                    </div>
                  </div>

                  {/* Step 4: Ready for Dispatch */}
                  <div className="relative text-xs">
                    <span className={`absolute -left-8.5 top-0.5 h-5 w-5 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-[9px] font-bold ${
                      getTimelineStep(selectedCargo.status) >= 3 ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                    }`}>
                      {getTimelineStep(selectedCargo.status) >= 3 ? "✓" : "4"}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">Ready for Dispatch</p>
                      <p className="text-slate-455 dark:text-slate-455 mt-0.5 text-[10px]">Manifests approved. Cargo moved to outbound loading zones.</p>
                    </div>
                  </div>

                  {/* Step 5: Dispatched */}
                  <div className="relative text-xs">
                    <span className={`absolute -left-8.5 top-0.5 h-5 w-5 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-[9px] font-bold ${
                      getTimelineStep(selectedCargo.status) >= 4 ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                    }`}>
                      {getTimelineStep(selectedCargo.status) >= 4 ? "✓" : "5"}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">Dispatched</p>
                      <p className="text-slate-455 dark:text-slate-455 mt-0.5 text-[10px]">Loaded into shipping couriers. Outbound routing activated.</p>
                    </div>
                  </div>

                  {/* Step 6: Delivered */}
                  <div className="relative text-xs">
                    <span className={`absolute -left-8.5 top-0.5 h-5 w-5 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-[9px] font-bold ${
                      getTimelineStep(selectedCargo.status) === 5 ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                    }`}>
                      {getTimelineStep(selectedCargo.status) === 5 ? "✓" : "6"}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">Delivered</p>
                      <p className="text-slate-455 dark:text-slate-455 mt-0.5 text-[10px]">Successfully reached destination and delivery receipt signed.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data specifications card */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/60 p-4 rounded-xl space-y-3.5 text-xs text-slate-650 dark:text-slate-300 transition-colors">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-455 dark:text-slate-500">Intake Description</span>
                  <span className="font-bold text-slate-850 dark:text-white">{parseCargo(selectedCargo.description).description}</span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-455 dark:text-slate-500">Weight Cargo Limit</span>
                  <span className="font-bold text-slate-850 dark:text-white">{parseCargo(selectedCargo.description).weight} Tons</span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-455 dark:text-slate-500">Total Quantity</span>
                  <span className="font-bold text-slate-850 dark:text-white">{parseCargo(selectedCargo.description).quantity} Units</span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-455 dark:text-slate-500">Assigned Zone Address</span>
                  <span className="font-bold text-slate-850 dark:text-white">{parseCargo(selectedCargo.description).warehouse_zone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-455 dark:text-slate-500">Registered Arrival Date</span>
                  <span className="font-bold text-slate-850 dark:text-white">{parseCargo(selectedCargo.description).arrival_date}</span>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setDetailsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Close Operations Chart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CARGO MODAL */}
      {deleteModalOpen && selectedCargo && (
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
                Are you sure you want to delete cargo reference <strong className="font-mono text-slate-850 dark:text-white">{String(selectedCargo.id).slice(0, 8).toUpperCase()}</strong>?
                This operation is permanent.
              </p>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-650 dark:text-slate-305 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCargo}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer"
                >
                  Delete Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cargo;