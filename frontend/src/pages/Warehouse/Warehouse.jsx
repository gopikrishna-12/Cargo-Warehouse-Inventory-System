import { useEffect, useState } from "react";
import { apiService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  FaWarehouse,
  FaMapMarkerAlt,
  FaPlus,
  FaEdit,
  FaTrashAlt,
  FaTimes,
  FaBoxes,
  FaChartPie,
  FaHdd,
  FaSpinner,
  FaWeightHanging,
  FaCubes
} from "react-icons/fa";

// Helper to parse cargo details serialized into description column
function parseCargo(raw) {
  try {
    const data = JSON.parse(raw);
    return {
      description: data.text || data.description || "Logistics Package",
      weight: Number(data.weight) || 0.0,
      quantity: Number(data.quantity) || 0,
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

function Warehouse() {
  const { role, permissions } = useAuth();
  const canModify = ["Super Admin", "Admin", "Warehouse Manager"].includes(role);

  // Main states
  const [warehouses, setWarehouses] = useState([]);
  const [cargoList, setCargoList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals control
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Selection
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    address: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      
      const whData = await apiService.getWarehouses();
      setWarehouses(whData || []);

      const cargoData = await apiService.getCargo();
      setCargoList(cargoData || []);

    } catch (e) {
      toast.error("Failed to load WMS warehouses: " + e.message);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Add Warehouse
  async function handleAddWarehouse(e) {
    e.preventDefault();
    if (!canModify) {
      toast.error("Unauthorized. Action blocked for this role.");
      return;
    }
    if (!formData.address.trim()) {
      toast.error("Please provide a valid warehouse address.");
      return;
    }

    try {
      setLoading(true);
      await apiService.createWarehouse({
        address: formData.address.trim()
      });

      toast.success("New warehouse zone registered successfully!");
      setAddModalOpen(false);
      resetForm();
      fetchData();
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      toast.error("Failed to add warehouse: " + msg);
    } finally {
      setLoading(false);
    }
  }

  // Edit Warehouse
  async function handleEditWarehouse(e) {
    e.preventDefault();
    if (!canModify) {
      toast.error("Unauthorized. Action blocked for this role.");
      return;
    }
    if (!formData.address.trim()) {
      toast.error("Please provide a valid warehouse address.");
      return;
    }

    try {
      setLoading(true);
      await apiService.updateWarehouse(selectedWarehouse.id, {
        address: formData.address.trim()
      });

      toast.success("Warehouse address updated successfully!");
      setEditModalOpen(false);
      resetForm();
      fetchData();
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      toast.error("Failed to update warehouse: " + msg);
    } finally {
      setLoading(false);
    }
  }

  // Delete Warehouse
  async function handleDeleteWarehouse() {
    if (!canModify) {
      toast.error("Unauthorized. Action blocked for this role.");
      return;
    }
    try {
      setLoading(true);
      await apiService.deleteWarehouse(selectedWarehouse.id);

      toast.success("Warehouse zone deleted from database.");
      setDeleteModalOpen(false);
      fetchData();
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      toast.error("Failed to delete warehouse: " + msg);
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(wh) {
    setSelectedWarehouse(wh);
    setFormData({ address: wh.address });
    setEditModalOpen(true);
  }

  function openDeleteModal(wh) {
    setSelectedWarehouse(wh);
    setDeleteModalOpen(true);
  }

  function resetForm() {
    setFormData({ address: "" });
    setSelectedWarehouse(null);
  }

  // Calculate dynamic capacity & occupancy metrics based on live Cargo table
  function getWarehouseLiveDetails(whAddress, id) {
    // Determine maximum capacity based on seed or details
    const idStr = String(id);
    const sum = idStr.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const capacityLimit = 250 + (sum % 250); // 250 to 500 Tons max

    // Filter cargo located in this warehouse address
    const matchingCargo = cargoList.filter((c) => {
      const details = parseCargo(c.description);
      return (
        details.warehouse_zone === whAddress || 
        whAddress.toLowerCase().includes(details.warehouse_zone.toLowerCase())
      );
    });

    const activeWeight = matchingCargo.reduce((acc, curr) => {
      const info = parseCargo(curr.description);
      return acc + (info.weight || 0);
    }, 0);

    const cargoCount = matchingCargo.length;
    const roundedWeight = Math.round(activeWeight * 10) / 10;
    const percent = Math.min(100, Math.round((roundedWeight / capacityLimit) * 100));

    return {
      capacity: capacityLimit,
      occupancyVal: roundedWeight,
      percent: percent || 0,
      cargoCount
    };
  }

  // Shelf matrix mapping generator
  function getShelvingMatrix(whAddress) {
    const sum = whAddress.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    return [
      { code: "A1", filled: (sum % 3 === 0) }, { code: "A2", filled: (sum % 4 === 0) }, { code: "A3", filled: false }, { code: "A4", filled: true },
      { code: "B1", filled: false }, { code: "B2", filled: (sum % 2 === 0) }, { code: "B3", filled: true }, { code: "B4", filled: false },
      { code: "C1", filled: true }, { code: "C2", filled: false }, { code: "C3", filled: (sum % 5 === 0) }, { code: "C4", filled: true }
    ];
  }

  const activeWarehouseForGrid = selectedWarehouse || warehouses[0];
  const gridMatrix = activeWarehouseForGrid ? getShelvingMatrix(activeWarehouseForGrid.address) : [];

  return (
    <div className="space-y-6 transition-colors duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Warehouse Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Monitor storage locations, physical zone layout maps, and total load limits.</p>
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
            <span>Register Warehouse</span>
          </button>
        )}
      </div>

      {loading && warehouses.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-3xl text-blue-600" />
        </div>
      ) : warehouses.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-8 text-center shadow-xs">
          <FaWarehouse className="mx-auto text-4xl text-slate-350 dark:text-slate-550 mb-3" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-350">No warehouses registered</h3>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Please register a warehouse zone to display storage statistics.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Warehouses list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {warehouses.map((wh, index) => {
                const { capacity, occupancyVal, percent, cargoCount } = getWarehouseLiveDetails(wh.address, wh.id);
                const isSelected = activeWarehouseForGrid?.id === wh.id;
                
                return (
                  <div
                    key={wh.id}
                    onClick={() => setSelectedWarehouse(wh)}
                    className={`bg-white dark:bg-slate-800 rounded-xl border p-6 space-y-4 cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? "border-blue-500 ring-2 ring-blue-500/25 shadow-md"
                        : "border-slate-100 dark:border-slate-700 shadow-xs hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/25 text-blue-650 dark:text-blue-450 rounded-xl">
                        <FaWarehouse className="text-xl" />
                      </div>
                      
                      {canModify && (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openEditModal(wh)}
                            className="p-2 bg-slate-50 dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-500 hover:text-amber-600 rounded-lg transition-colors cursor-pointer"
                            title="Edit Location"
                          >
                            <FaEdit className="text-xs" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(wh)}
                            className="p-2 bg-slate-50 dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-955/40 text-slate-500 hover:text-red-650 rounded-lg transition-colors cursor-pointer"
                            title="Delete Zone"
                          >
                            <FaTrashAlt className="text-xs" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-850 dark:text-white text-lg">Zone {String.fromCharCode(65 + index)}</h3>
                      <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm mt-1">
                        <FaMapMarkerAlt className="mr-1.5 text-slate-400 shrink-0 text-xs" />
                        <span className="truncate max-w-[200px]">{wh.address}</span>
                      </div>
                    </div>

                    {/* Stats badges */}
                    <div className="flex gap-4 text-xs text-slate-600 dark:text-slate-300 pt-1">
                      <span className="flex items-center gap-1">
                        <FaWeightHanging className="text-slate-400" />
                        <span><strong>{occupancyVal}T</strong> Stored</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <FaCubes className="text-slate-400" />
                        <span><strong>{cargoCount}</strong> Packages</span>
                      </span>
                    </div>

                    {/* Occupancy bar */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-650 dark:text-slate-300">
                        <span>Space Occupancy</span>
                        <span>{percent}% ({occupancyVal}T / {capacity}T)</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            percent > 90
                              ? "bg-red-500"
                              : percent > 75
                              ? "bg-amber-500"
                              : "bg-blue-600"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shelving Slots map (Right panel) */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-6 space-y-6 transition-colors shadow-xs">
            <div>
              <h3 className="font-semibold text-slate-850 dark:text-white text-base flex items-center gap-2">
                <FaHdd className="text-blue-500" />
                <span>Physical Storage Matrix</span>
              </h3>
              <p className="text-slate-400 dark:text-slate-450 text-xs mt-1">
                Virtual shelves layout map for <strong className="text-slate-700 dark:text-slate-350">{activeWarehouseForGrid ? activeWarehouseForGrid.address.split(",")[0] : "Active Zone"}</strong>.
              </p>
            </div>

            {/* Slots Grid */}
            <div className="grid grid-cols-4 gap-3">
              {gridMatrix.map((slot) => (
                <div
                  key={slot.code}
                  className={`border rounded-lg p-3 text-center transition-all duration-200 ${
                    slot.filled
                      ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/30 text-blue-700 dark:text-blue-400 shadow-xs"
                      : "bg-slate-50/50 dark:bg-slate-900/50 border-slate-150 dark:border-slate-750 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850"
                  }`}
                >
                  <FaBoxes className="mx-auto text-sm mb-1 text-slate-400" />
                  <span className="text-xs font-bold">{slot.code}</span>
                  <p className="text-[9px] font-semibold mt-0.5 uppercase tracking-wide">
                    {slot.filled ? "Filled" : "Free"}
                  </p>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4 flex gap-4 text-xs text-slate-500 justify-center">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/30 inline-block" />
                <span>Occupied</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-150 dark:border-slate-750 inline-block" />
                <span>Available</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER WAREHOUSE MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md border border-slate-150 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-white text-base">Register Warehouse Zone</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddWarehouse} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Warehouse Address Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Building 12, Logistics Park South, Seattle"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
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
                  Register Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT WAREHOUSE MODAL */}
      {editModalOpen && selectedWarehouse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md border border-slate-150 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-white text-base">Edit Warehouse Zone Address</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleEditWarehouse} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase">Warehouse Address Location *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-808 dark:text-slate-101 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
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

      {/* DELETE WAREHOUSE MODAL */}
      {deleteModalOpen && selectedWarehouse && (
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
                Are you sure you want to delete warehouse zone reference <strong className="font-mono text-slate-850 dark:text-white">{String(selectedWarehouse.id).slice(0, 8).toUpperCase()}</strong>?
                All allocated slots and occupancy markers associated with this zone will be cleared.
              </p>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteWarehouse}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer"
                >
                  Delete Zone
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Warehouse;