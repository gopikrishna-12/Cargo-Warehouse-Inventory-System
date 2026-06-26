import { useEffect, useState } from "react";
import { apiService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  FaTruck,
  FaSearch,
  FaFilter,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrashAlt,
  FaTimes,
  FaMapMarkerAlt,
  FaBox,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaRoad,
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaSpinner,
  FaBarcode
} from "react-icons/fa";

// Helper to serialize origin details to text column
function serializeOrigin(address, dispatchDate) {
  return JSON.stringify({
    address: address || "",
    dispatch_date: dispatchDate || new Date().toISOString().split("T")[0]
  });
}

function parseOrigin(raw) {
  try {
    const data = JSON.parse(raw);
    return {
      address: data.address || raw || "",
      dispatch_date: data.dispatch_date || new Date().toISOString().split("T")[0]
    };
  } catch (e) {
    return {
      address: raw || "",
      dispatch_date: new Date().toISOString().split("T")[0]
    };
  }
}

// Helper to serialize destination details to text column
function serializeDestination(address, deliveryDate, trackingId, carrier) {
  return JSON.stringify({
    address: address || "",
    delivery_date: deliveryDate || "",
    tracking_id: trackingId || "TRK-" + Math.floor(100000 + Math.random() * 900000),
    carrier: carrier || "ORBEM Logistics"
  });
}

function parseDestination(raw) {
  try {
    const data = JSON.parse(raw);
    return {
      address: data.address || raw || "",
      delivery_date: data.delivery_date || "",
      tracking_id: data.tracking_id || "TRK-" + Math.floor(100000 + Math.random() * 900000),
      carrier: data.carrier || "ORBEM Logistics"
    };
  } catch (e) {
    return {
      address: raw || "",
      delivery_date: "",
      tracking_id: "TRK-GEN-" + Math.floor(100000 + Math.random() * 900000),
      carrier: "ORBEM Logistics"
    };
  }
}

function Shipments() {
  const { role, permissions } = useAuth();
  const canModify = ["Super Admin", "Admin", "Dispatch Manager"].includes(role);

  // Main states
  const [shipments, setShipments] = useState([]);
  const [cargoOptions, setCargoOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Modals control
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);

  // Selection
  const [selectedShipment, setSelectedShipment] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    originAddress: "",
    dispatchDate: new Date().toISOString().split("T")[0],
    destinationAddress: "",
    deliveryDate: "",
    trackingId: "",
    carrier: "ORBEM Fleet",
    status: "Pending",
    cargo_id: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const shipmentsData = await apiService.getShipments();
      setShipments(shipmentsData || []);

      const cargoData = await apiService.getCargo();
      setCargoOptions(cargoData || []);

    } catch (e) {
      toast.error("Failed to load Shipments data: " + e.message);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Add Shipment
  async function handleAddShipment(e) {
    e.preventDefault();
    if (!canModify) {
      toast.error("Unauthorized. Action blocked for this role.");
      return;
    }
    if (!formData.originAddress.trim() || !formData.destinationAddress.trim() || !formData.cargo_id) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);

      const serializedOrigin = serializeOrigin(formData.originAddress.trim(), formData.dispatchDate);
      const activeTrackingId = formData.trackingId.trim() || "TRK-" + Math.floor(100000 + Math.random() * 900000);
      const serializedDest = serializeDestination(
        formData.destinationAddress.trim(),
        formData.deliveryDate,
        activeTrackingId,
        formData.carrier
      );

      await apiService.createShipment({
        origin: serializedOrigin,
        destination: serializedDest,
        status: formData.status,
        cargo_id: formData.cargo_id
      });

      toast.success("Shipment registered and dispatched successfully!");
      setAddModalOpen(false);
      resetForm();
      fetchData();
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      toast.error("Failed to dispatch shipment: " + msg);
    } finally {
      setLoading(false);
    }
  }

  // Edit Shipment
  async function handleEditShipment(e) {
    e.preventDefault();
    if (!canModify) {
      toast.error("Unauthorized. Action blocked for this role.");
      return;
    }
    if (!formData.originAddress.trim() || !formData.destinationAddress.trim() || !formData.cargo_id) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);

      const serializedOrigin = serializeOrigin(formData.originAddress.trim(), formData.dispatchDate);
      const activeTrackingId = formData.trackingId.trim() || parseDestination(selectedShipment.destination).tracking_id;
      const serializedDest = serializeDestination(
        formData.destinationAddress.trim(),
        formData.deliveryDate,
        activeTrackingId,
        formData.carrier
      );

      await apiService.updateShipment(selectedShipment.id, {
        origin: serializedOrigin,
        destination: serializedDest,
        status: formData.status,
        cargo_id: formData.cargo_id
      });

      toast.success("Shipment status and tracking updated!");
      setEditModalOpen(false);
      resetForm();
      fetchData();
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      toast.error("Failed to update shipment: " + msg);
    } finally {
      setLoading(false);
    }
  }

  // Delete Shipment
  async function handleDeleteShipment() {
    if (!canModify) {
      toast.error("Unauthorized. Action blocked for this role.");
      return;
    }
    try {
      setLoading(true);
      await apiService.deleteShipment(selectedShipment.id);

      toast.success("Shipment tracking removed from database.");
      setDeleteModalOpen(false);
      fetchData();
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      toast.error("Failed to delete shipment: " + msg);
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(shipment) {
    const originParsed = parseOrigin(shipment.origin);
    const destParsed = parseDestination(shipment.destination);

    setSelectedShipment(shipment);
    setFormData({
      originAddress: originParsed.address,
      dispatchDate: originParsed.dispatch_date,
      destinationAddress: destParsed.address,
      deliveryDate: destParsed.delivery_date,
      trackingId: destParsed.tracking_id,
      carrier: destParsed.carrier,
      status: shipment.status,
      cargo_id: shipment.cargo_id
    });
    setEditModalOpen(true);
  }

  function openDeleteModal(shipment) {
    setSelectedShipment(shipment);
    setDeleteModalOpen(true);
  }

  function openTrackingModal(shipment) {
    setSelectedShipment(shipment);
    setTrackingModalOpen(true);
  }

  function resetForm() {
    setFormData({
      originAddress: "",
      dispatchDate: new Date().toISOString().split("T")[0],
      destinationAddress: "",
      deliveryDate: "",
      trackingId: "",
      carrier: "ORBEM Fleet",
      status: "Pending",
      cargo_id: "",
    });
    setSelectedShipment(null);
  }

  // Filtering & search with role restriction
  const filteredShipments = shipments.filter((item) => {
    // Customer sees only their own cargo shipments
    if (role === "Customer" && item.cargo?.customers?.company_name && !item.cargo.customers.company_name.toLowerCase().includes("zenith")) {
      return false;
    }

    const originParsed = parseOrigin(item.origin);
    const destParsed = parseDestination(item.destination);

    const matchesSearch = 
      originParsed.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      destParsed.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cargo?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      destParsed.tracking_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      destParsed.carrier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.id)?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredShipments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredShipments.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  function getStatusIcon(status) {
    switch (status?.toLowerCase()) {
      case "delivered":
        return <FaCheckCircle className="text-emerald-500 text-lg shrink-0" />;
      case "in transit":
        return <FaTruck className="text-blue-500 text-lg shrink-0 animate-pulse" />;
      case "delayed":
        return <FaExclamationTriangle className="text-amber-500 text-lg shrink-0 animate-bounce" />;
      default:
        return <FaClock className="text-slate-400 dark:text-slate-500 text-lg shrink-0" />;
    }
  }

  function getStatusBadge(status) {
    const norm = status?.toLowerCase();
    if (norm === "delivered") {
      return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">Delivered</span>;
    } else if (norm === "in transit") {
      return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">In Transit</span>;
    } else if (norm === "delayed") {
      return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">Delayed</span>;
    } else {
      return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800">{status || "Pending"}</span>;
    }
  }

  function getTrackingStepIndex(status) {
    switch (status?.toLowerCase()) {
      case "delivered":
        return 3;
      case "delayed":
        return 2;
      case "in transit":
        return 1;
      case "pending":
      default:
        return 0;
    }
  }

  return (
    <div className="space-y-6 transition-colors duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Shipment Tracker</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Deploy delivery pathways, parse simulated tracking IDs, and check dispatch timelines.</p>
        </div>
        
        {canModify && (
          <button
            onClick={() => {
              resetForm();
              // Generate mock tracking
              setFormData({
                ...formData,
                trackingId: "TRK-" + Math.floor(100000 + Math.random() * 900000),
                dispatchDate: new Date().toISOString().split("T")[0]
              });
              setAddModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-4 py-2.5 text-sm shadow-xs transition-colors cursor-pointer"
          >
            <FaPlus />
            <span>Dispatch Cargo</span>
          </button>
        )}
      </div>

      {/* Search & Filters Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 shadow-xs flex flex-col md:flex-row items-center gap-4 transition-colors">
        <div className="relative w-full md:flex-1">
          <FaSearch className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search shipments by tracking number, origin, destination, or courier..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-805 dark:text-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-blue-500 transition-colors"
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
            <option value="all">All Dispatch Status</option>
            <option value="Pending">Pending Dispatch</option>
            <option value="In Transit">In Transit</option>
            <option value="Delayed">Delayed</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Shipments List */}
      {loading && shipments.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-3xl text-blue-600" />
        </div>
      ) : filteredShipments.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-8 text-center shadow-xs">
          <FaTruck className="mx-auto text-4xl text-slate-350 dark:text-slate-500 mb-3" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">No shipments found</h3>
          <p className="text-slate-400 dark:text-slate-450 text-sm mt-1">Try refining search parameters or register a new dispatch pathway.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-xs overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase border-b border-slate-100 dark:border-slate-700">
                  <th className="px-6 py-4">Tracking Code</th>
                  <th className="px-6 py-4">Associated Cargo</th>
                  <th className="px-6 py-4">Logistics Route</th>
                  <th className="px-6 py-4">Courier Service</th>
                  <th className="px-6 py-4">Dispatch Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm text-slate-650 dark:text-slate-300">
                {currentItems.map((shipment) => {
                  const originParsed = parseOrigin(shipment.origin);
                  const destParsed = parseDestination(shipment.destination);
                  return (
                    <tr key={shipment.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-755/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <FaBarcode className="text-slate-400 text-sm" />
                          <span>{destParsed.tracking_id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white max-w-xs truncate">
                        <div className="flex flex-col text-xs">
                          <span className="font-bold text-slate-850 dark:text-slate-205 truncate">{shipment.cargo?.description || "Unspecified Package"}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Owner: {shipment.cargo?.customers?.company_name || "Unassigned"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-xs">
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <span className="font-semibold">{originParsed.address}</span>
                            <span className="text-slate-400">→</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">{destParsed.address}</span>
                          </div>
                          <div className="text-[9.5px] text-slate-400 dark:text-slate-500 mt-1">
                            Dispatched: {originParsed.dispatch_date} {destParsed.delivery_date ? `| Est. Delivery: ${destParsed.delivery_date}` : ""}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                        {destParsed.carrier}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(shipment.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openTrackingModal(shipment)}
                            className="p-2 bg-slate-50 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-955/30 text-slate-655 dark:text-slate-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                            title="Trace Route"
                          >
                            <FaRoad />
                          </button>
                          
                          {canModify && (
                            <>
                              <button
                                onClick={() => openEditModal(shipment)}
                                className="p-2 bg-slate-50 dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-955/30 text-slate-655 dark:text-slate-400 hover:text-amber-600 rounded-lg transition-colors cursor-pointer"
                                title="Edit Routing details"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => openDeleteModal(shipment)}
                                className="p-2 bg-slate-50 dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-955/30 text-slate-655 dark:text-slate-400 hover:text-red-650 rounded-lg transition-colors cursor-pointer"
                                title="Delete Tracking History"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredShipments.length)} of {filteredShipments.length} items
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

      {/* DISPATCH SHIPMENT MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg border border-slate-150 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-white text-base">Dispatch Cargo Shipment</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddShipment} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Link Cargo Item *</label>
                <select
                  required
                  value={formData.cargo_id}
                  onChange={(e) => setFormData({ ...formData, cargo_id: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-850 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Select Cargo to Dispatch</option>
                  {cargoOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.description.slice(0, 50)}... ({String(c.id).slice(0, 6).toUpperCase()})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Origin Address Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="WMS Gate 3, Chicago WH"
                    value={formData.originAddress}
                    onChange={(e) => setFormData({ ...formData, originAddress: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-105 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Dispatch Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.dispatchDate}
                    onChange={(e) => setFormData({ ...formData, dispatchDate: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-105 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Destination Delivery Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="Terminal 4, JFK Airport, NY"
                    value={formData.destinationAddress}
                    onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-105 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Est. Delivery Date</label>
                  <input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-105 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Courier Carrier Service</label>
                  <input
                    type="text"
                    placeholder="ORBEM Fleet, FedEx, DHL"
                    value={formData.carrier}
                    onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-105 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Custom Tracking ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={formData.trackingId}
                    onChange={(e) => setFormData({ ...formData, trackingId: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-105 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Initial Dispatch Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-850 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Pending">Pending Dispatch</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delayed">Delayed</option>
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
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SHIPMENT MODAL */}
      {editModalOpen && selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg border border-slate-150 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-white text-base">Edit Dispatch Routing</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleEditShipment} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Link Cargo Item *</label>
                <select
                  required
                  value={formData.cargo_id}
                  onChange={(e) => setFormData({ ...formData, cargo_id: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-850 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {cargoOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.description.slice(0, 50)}... ({String(c.id).slice(0, 6).toUpperCase()})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Origin Address Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.originAddress}
                    onChange={(e) => setFormData({ ...formData, originAddress: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-105 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Dispatch Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.dispatchDate}
                    onChange={(e) => setFormData({ ...formData, dispatchDate: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-105 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Destination Delivery Address *</label>
                  <input
                    type="text"
                    required
                    value={formData.destinationAddress}
                    onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-105 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Est. Delivery Date</label>
                  <input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-105 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Courier Carrier Service</label>
                  <input
                    type="text"
                    value={formData.carrier}
                    onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-105 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Tracking ID (Read-only)</label>
                  <input
                    type="text"
                    disabled
                    value={formData.trackingId}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-400 dark:text-slate-500 rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Dispatch Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-850 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Pending">Pending Dispatch</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delayed">Delayed</option>
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

      {/* TRACKING TIMELINE PANEL MODAL */}
      {trackingModalOpen && selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg border border-slate-150 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FaRoad className="text-blue-500" />
                <h3 className="font-semibold text-slate-800 dark:text-white text-base">Shipment Routing Timeline</h3>
              </div>
              <button onClick={() => setTrackingModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer">
                <FaTimes />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Routing Card */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-4 rounded-xl space-y-2 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Cargo Package</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{selectedShipment.cargo?.description || "Cargo Item"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Courier</p>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{parseDestination(selectedShipment.destination).carrier}</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-600 dark:text-slate-350 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 gap-2">
                  <div className="flex items-center gap-1.5">
                    <FaMapMarkerAlt className="text-slate-400" />
                    <span>Origin: <strong className="text-slate-850 dark:text-slate-205">{parseOrigin(selectedShipment.origin).address}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FaMapMarkerAlt className="text-blue-500" />
                    <span>Dest: <strong className="text-slate-850 dark:text-slate-205">{parseDestination(selectedShipment.destination).address}</strong></span>
                  </div>
                </div>
              </div>

              {/* Progress Steps Timeline */}
              <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-700 ml-4 space-y-8">
                {/* Step 1: Intaken */}
                <div className="relative">
                  <span className={`absolute -left-8.5 top-0.5 h-5 w-5 rounded-full border-2 border-white dark:border-slate-800 ring-4 ring-slate-50 dark:ring-slate-900 flex items-center justify-center text-[10px] font-bold ${
                    getTrackingStepIndex(selectedShipment.status) >= 0
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                  }`}>
                    {getTrackingStepIndex(selectedShipment.status) >= 0 ? "✓" : "1"}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">Shipment Intaken</h4>
                    <p className="text-slate-550 dark:text-slate-400 text-xs mt-0.5">Cargo is checked in at warehouse gates and registered in databases.</p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">Completed</span>
                  </div>
                </div>

                {/* Step 2: Dispatched */}
                <div className="relative">
                  <span className={`absolute -left-8.5 top-0.5 h-5 w-5 rounded-full border-2 border-white dark:border-slate-800 ring-4 ring-slate-50 dark:ring-slate-900 flex items-center justify-center text-[10px] font-bold ${
                    getTrackingStepIndex(selectedShipment.status) >= 1
                      ? "bg-emerald-500 text-white"
                      : selectedShipment.status?.toLowerCase() === "pending"
                      ? "bg-slate-200 dark:bg-slate-700 text-slate-500"
                      : "bg-blue-500 text-white animate-pulse"
                  }`}>
                    {getTrackingStepIndex(selectedShipment.status) >= 1 ? "✓" : "2"}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">Dispatched from Warehouse</h4>
                    <p className="text-slate-550 dark:text-slate-400 text-xs mt-0.5">Cargo packages loaded into shipping couriers and departed.</p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                      {getTrackingStepIndex(selectedShipment.status) >= 1 ? `Completed on ${parseOrigin(selectedShipment.origin).dispatch_date}` : "Pending"}
                    </span>
                  </div>
                </div>

                {/* Step 3: Out for Delivery */}
                <div className="relative">
                  <span className={`absolute -left-8.5 top-0.5 h-5 w-5 rounded-full border-2 border-white dark:border-slate-800 ring-4 ring-slate-50 dark:ring-slate-900 flex items-center justify-center text-[10px] font-bold ${
                    getTrackingStepIndex(selectedShipment.status) >= 2
                      ? "bg-emerald-500 text-white"
                      : selectedShipment.status?.toLowerCase() === "in transit"
                      ? "bg-blue-500 text-white animate-pulse"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                  }`}>
                    {getTrackingStepIndex(selectedShipment.status) >= 2 ? "✓" : "3"}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">In Transit (Out for Delivery)</h4>
                    <p className="text-slate-550 dark:text-slate-400 text-xs mt-0.5">Packages are actively in transit via courier and tracking is live.</p>
                    {selectedShipment.status?.toLowerCase() === "delayed" && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1 inline-flex items-center gap-1">
                        <FaExclamationTriangle className="animate-pulse" /> Shipment Delayed (Alert)
                      </span>
                    )}
                    {getTrackingStepIndex(selectedShipment.status) > 2 && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">Completed</span>
                    )}
                  </div>
                </div>

                {/* Step 4: Arrived */}
                <div className="relative">
                  <span className={`absolute -left-8.5 top-0.5 h-5 w-5 rounded-full border-2 border-white dark:border-slate-800 ring-4 ring-slate-50 dark:ring-slate-900 flex items-center justify-center text-[10px] font-bold ${
                    getTrackingStepIndex(selectedShipment.status) === 3
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                  }`}>
                    {getTrackingStepIndex(selectedShipment.status) === 3 ? "✓" : "4"}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">Arrived at Destination</h4>
                    <p className="text-slate-550 dark:text-slate-400 text-xs mt-0.5">Successfully signed for and delivered at destination address.</p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                      {getTrackingStepIndex(selectedShipment.status) === 3 ? `Arrived on ${parseDestination(selectedShipment.destination).delivery_date || "today"}` : "Pending"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setTrackingModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Close Route Map
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE SHIPMENT MODAL */}
      {deleteModalOpen && selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md border border-slate-150 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-white text-base">Confirm Deletion</h3>
              <button onClick={() => setDeleteModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer">
                <FaTimes />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-650 dark:text-slate-400 leading-normal">
                Are you sure you want to delete shipment reference <strong className="font-mono text-slate-800 dark:text-white">{String(selectedShipment.id).slice(0, 8).toUpperCase()}</strong>?
                This action is permanent and deletes the logistics tracking history from the database.
              </p>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteShipment}
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

export default Shipments;